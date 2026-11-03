// WatchRepo implementation: real watch time per learner, lesson and day.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// maxBeatCredit caps how much one heartbeat can add, so a client that claims
// an hour of watching in a single call cannot move the number.
const maxBeatCredit = 60

// WatchRepo implements ports.WatchRepo.
type WatchRepo struct{ pool *pgxpool.Pool }

func NewWatchRepo(pool *pgxpool.Pool) *WatchRepo { return &WatchRepo{pool: pool} }

// Record credits one heartbeat of watch time.
//
// The credited amount is the smallest of the reported delta, the wall-clock
// gap since the previous beat and the cap, so pausing or scrubbing the
// player cannot inflate the total. The gap is read across every day of the
// pair, so crossing midnight does not reset the allowance.
func (r *WatchRepo) Record(ctx context.Context, userID, lessonID uuid.UUID, reportedSeconds int) error {
	if reportedSeconds <= 0 {
		return nil
	}
	if reportedSeconds > maxBeatCredit {
		reportedSeconds = maxBeatCredit
	}
	var gapSeconds int64
	err := querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT coalesce(extract(epoch from now() - max(last_beat_at))::bigint, 1000000000)
		 FROM lesson_watch_daily WHERE user_id=$1 AND lesson_id=$2`,
		userID, lessonID).Scan(&gapSeconds)
	if err != nil {
		return fmt.Errorf("last watch beat: %w", err)
	}
	credited := reportedSeconds
	if int(gapSeconds) < credited {
		credited = int(gapSeconds)
	}
	if credited <= 0 {
		return nil
	}
	_, err = querierOf(ctx, r.pool).Exec(ctx,
		`INSERT INTO lesson_watch_daily (user_id, lesson_id, day, seconds, last_beat_at)
		 VALUES ($1, $2, (now() AT TIME ZONE 'Asia/Tehran')::date, $3, now())
		 ON CONFLICT (user_id, lesson_id, day) DO UPDATE
		 SET seconds = lesson_watch_daily.seconds + EXCLUDED.seconds,
		     last_beat_at = EXCLUDED.last_beat_at`,
		userID, lessonID, credited)
	if err != nil {
		return fmt.Errorf("record watch time: %w", err)
	}
	return nil
}
