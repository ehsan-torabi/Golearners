// CourseStatsRepo implementation: per-course performance aggregates.
package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"golearn/backend/internal/ports"
)

// tehranDay is the product calendar day: the console renders Jalali dates,
// so the day buckets follow Tehran time rather than the database timezone.
const tehranDay = "(now() AT TIME ZONE 'Asia/Tehran')::date"

// tehranSince is the start of the trend window. It reads the day count from
// $2, so every query using it must bind the window length as the second
// argument.
const tehranSince = "((" + tehranDay + " - ($2::int - 1) * interval '1 day') AT TIME ZONE 'Asia/Tehran')"

// activeLearnerWindow is how recent a progress row must be to count the
// learner as active.
const activeLearnerWindow = "30 days"

// courseStatsMetrics are the measured numbers of one course. Every value
// comes from a real row: nothing here is estimated.
const courseStatsMetrics = `
(SELECT count(*)::int FROM entitlements e WHERE e.course_id=c.id AND e.revoked_at IS NULL) AS enrollments,
(SELECT count(*)::int FROM entitlements e WHERE e.course_id=c.id AND e.revoked_at IS NULL AND e.source='purchase') AS paid_enrollments,
(SELECT count(*)::int FROM entitlements e WHERE e.course_id=c.id AND e.revoked_at IS NULL AND e.source<>'purchase') AS granted_enrollments,
(SELECT count(DISTINCT o.id)::int FROM order_items oi JOIN orders o ON o.id=oi.order_id AND o.status='paid' WHERE oi.course_id=c.id) AS orders,
(SELECT count(DISTINCT o.user_id)::int FROM order_items oi JOIN orders o ON o.id=oi.order_id AND o.status='paid' WHERE oi.course_id=c.id) AS buyers,
(SELECT coalesce(sum(oi.unit_price_rial),0)::bigint FROM order_items oi JOIN orders o ON o.id=oi.order_id AND o.status='paid' WHERE oi.course_id=c.id) AS revenue_rial,
(SELECT coalesce(sum(r.amount_rial),0)::bigint FROM refunds r JOIN payments p ON p.id=r.payment_id JOIN orders o ON o.id=p.order_id JOIN order_items oi ON oi.order_id=o.id AND oi.course_id=c.id WHERE o.status='paid' AND r.status='completed') AS refund_rial,
(SELECT coalesce(avg(rv.rating),0)::float8 FROM reviews rv WHERE rv.course_id=c.id AND rv.status='approved') AS avg_rating,
(SELECT count(*)::int FROM reviews rv WHERE rv.course_id=c.id AND rv.status='approved') AS review_count,
(SELECT count(*)::int FROM reviews rv WHERE rv.course_id=c.id AND rv.status='pending') AS pending_reviews,
(SELECT count(*)::int FROM lessons l JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id AND l.status IN ('ready','published')) AS lessons,
(SELECT count(*)::int FROM course_sections s WHERE s.course_id=c.id) AS sections,
(SELECT coalesce(sum(l.duration_seconds),0)::int FROM lessons l JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id) AS duration_seconds,
(SELECT count(DISTINCT p.user_id)::int FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id) AS started_learners,
(SELECT count(DISTINCT p.user_id)::int FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id AND p.updated_at > now() - interval '` + activeLearnerWindow + `') AS active_learners,
(SELECT count(*)::int FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id AND p.completed_at IS NOT NULL) AS completed_lessons,
(SELECT coalesce(sum(w.seconds),0)::bigint FROM lesson_watch_daily w JOIN lessons l ON l.id=w.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id) AS watch_seconds,
(SELECT count(DISTINCT w.user_id)::int FROM lesson_watch_daily w JOIN lessons l ON l.id=w.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id) AS watch_learners,
(SELECT max(p.updated_at) FROM lesson_progress p JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id WHERE s.course_id=c.id) AS last_activity_at`

const courseStatsIdentity = `c.id, c.slug, c.title, c.summary, c.level, c.status,
	c.price_rial, c.cover_media_id, c.published_at`

// CourseStatsRepo implements ports.CourseStatsRepo.
type CourseStatsRepo struct{ pool *pgxpool.Pool }

func NewCourseStatsRepo(pool *pgxpool.Pool) *CourseStatsRepo {
	return &CourseStatsRepo{pool: pool}
}

// courseStatsWhere builds the filter clause and its bound arguments.
func courseStatsWhere(f ports.CourseStatsFilter) (string, []any) {
	where := []string{"c.deleted_at IS NULL"}
	args := []any{}
	next := func() string { return fmt.Sprint(len(args) + 1) }
	if f.CategorySlug != "" {
		where = append(where, "EXISTS(SELECT 1 FROM course_category_courses cc JOIN course_categories cat ON cat.id = cc.category_id WHERE cc.course_id = c.id AND cat.slug = $"+next()+")")
		args = append(args, f.CategorySlug)
	}
	if f.Level != "" {
		where = append(where, "c.level = $"+next())
		args = append(args, f.Level)
	}
	if f.Status != "" {
		where = append(where, "c.status = $"+next())
		args = append(args, f.Status)
	}
	if f.Q != "" {
		where = append(where, "(c.title ILIKE '%'||$"+next()+"||'%' OR c.summary ILIKE '%'||$"+next()+"||'%' OR c.slug ILIKE '%'||$"+next()+"||'%')")
		args = append(args, f.Q)
	}
	if f.MinEnrollments > 0 {
		where = append(where, "(SELECT count(*) FROM entitlements e WHERE e.course_id=c.id AND e.revoked_at IS NULL) >= $"+next())
		args = append(args, f.MinEnrollments)
	}
	return strings.Join(where, " AND "), args
}

// courseStatsOrder is the sort whitelist; anything unknown falls back to the
// ranking an operator wants first: the courses that enrolled the most.
func courseStatsOrder(sort string) string {
	switch sort {
	case "enrollments_asc":
		return "enrollments ASC, c.created_at DESC"
	case "revenue_desc":
		return "revenue_rial DESC, c.created_at DESC"
	case "revenue_asc":
		return "revenue_rial ASC, c.created_at DESC"
	case "watch_desc":
		return "watch_seconds DESC, c.created_at DESC"
	case "rating_desc":
		return "avg_rating DESC, c.created_at DESC"
	case "title":
		return "c.title ASC"
	case "newest":
		return "c.created_at DESC"
	default:
		return "enrollments DESC, c.created_at DESC"
	}
}

// completionPct is the share of the enrolled learners' lessons that are done.
func completionPct(completed, enrolled, lessons int) float64 {
	if enrolled <= 0 || lessons <= 0 {
		return 0
	}
	return float64(completed) / float64(enrolled*lessons) * 100
}

func scanCourseStatsRow(row pgx.Row) (*ports.CourseStatsRow, error) {
	r := &ports.CourseStatsRow{}
	var level, status string
	err := row.Scan(
		&r.CourseID, &r.Slug, &r.Title, &r.Summary, &level, &status,
		&r.PriceRial, &r.CoverMediaID, &r.PublishedAt,
		&r.Enrollments, &r.PaidEnrollments, &r.GrantedEnrollments,
		&r.Orders, &r.Buyers, &r.RevenueRial, &r.RefundRial,
		&r.AvgRating, &r.ReviewCount, &r.PendingReviews,
		&r.Lessons, &r.Sections, &r.DurationSeconds,
		&r.StartedLearners, &r.ActiveLearners, &r.CompletedLessons,
		&r.WatchSeconds, &r.WatchLearners, &r.LastActivityAt,
	)
	if err != nil {
		return nil, err
	}
	r.Level = level
	r.Status = status
	r.NetRevenueRial = r.RevenueRial - r.RefundRial
	r.CompletionPct = completionPct(r.CompletedLessons, r.Enrollments, r.Lessons)
	return r, nil
}

// List returns one page of courses with their measured performance.
func (r *CourseStatsRepo) List(ctx context.Context, f ports.CourseStatsFilter, page, perPage int) ([]ports.CourseStatsRow, int, error) {
	where, args := courseStatsWhere(f)
	q := `SELECT ` + courseStatsIdentity + `, ` + courseStatsMetrics + ` FROM courses c WHERE ` + where +
		` ORDER BY ` + courseStatsOrder(f.Sort) +
		` LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)
	args = append(args, perPage, (page-1)*perPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx, q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list course stats: %w", err)
	}
	defer rows.Close()
	var out []ports.CourseStatsRow
	for rows.Next() {
		row, err := scanCourseStatsRow(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan course stats: %w", err)
		}
		out = append(out, *row)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT count(*) FROM courses c WHERE `+where, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count course stats: %w", err)
	}
	return out, total, nil
}

// Detail returns the metrics, trends and per-lesson engagement of one course.
func (r *CourseStatsRepo) Detail(ctx context.Context, courseID uuid.UUID, days int) (*ports.CourseStatsDetail, error) {
	if days <= 0 || days > 365 {
		days = 60
	}
	row, err := scanCourseStatsRow(querierOf(ctx, r.pool).QueryRow(ctx,
		`SELECT `+courseStatsIdentity+`, `+courseStatsMetrics+` FROM courses c
		 WHERE c.id=$1 AND c.deleted_at IS NULL`, courseID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ports.ErrNotFound
		}
		return nil, fmt.Errorf("course stats: %w", err)
	}
	out := &ports.CourseStatsDetail{
		Course:  row.CourseStatsIdentity,
		Metrics: row.CourseStatsMetrics,
		Series: ports.CourseStatsSeries{
			Days: []string{}, Enrollments: []int{}, RevenueRial: []int64{},
			WatchSeconds: []int64{}, ActiveLearners: []int{},
		},
		Lessons: []ports.CourseLessonStat{},
		Sources: map[string]int{},
		Reviews: []ports.CourseStatsReview{},
	}
	if err := r.fillSeries(ctx, out, courseID, days); err != nil {
		return nil, err
	}
	if err := r.fillLessons(ctx, out, courseID); err != nil {
		return nil, err
	}
	if err := r.fillSources(ctx, out, courseID); err != nil {
		return nil, err
	}
	if err := r.fillReviews(ctx, out, courseID); err != nil {
		return nil, err
	}
	return out, nil
}

// fillSeries fills the daily trend. Every day of the window is present, so
// a gap reads as zero instead of a missing point.
func (r *CourseStatsRepo) fillSeries(ctx context.Context, out *ports.CourseStatsDetail, courseID uuid.UUID, days int) error {
	rows, err := querierOf(ctx, r.pool).Query(ctx, `
WITH days AS (
	SELECT gs::date AS day FROM generate_series(
		`+tehranDay+` - ($2::int - 1) * interval '1 day',
		`+tehranDay+`, interval '1 day') AS gs
),
enr AS (
	SELECT (granted_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(*)::int AS n
	FROM entitlements
	WHERE course_id=$1 AND revoked_at IS NULL AND granted_at >= `+tehranSince+`
	GROUP BY 1
),
rev AS (
	SELECT (o.paid_at AT TIME ZONE 'Asia/Tehran')::date AS day, sum(oi.unit_price_rial)::bigint AS v
	FROM order_items oi JOIN orders o ON o.id=oi.order_id AND o.status='paid'
	WHERE oi.course_id=$1 AND o.paid_at IS NOT NULL AND o.paid_at >= `+tehranSince+`
	GROUP BY 1
),
wat AS (
	SELECT w.day, sum(w.seconds)::bigint AS s
	FROM lesson_watch_daily w
	JOIN lessons l ON l.id=w.lesson_id
	JOIN course_sections s ON s.id=l.section_id
	WHERE s.course_id=$1 AND w.day >= (`+tehranDay+` - ($2::int - 1) * interval '1 day')
	GROUP BY 1
),
act AS (
	SELECT (p.updated_at AT TIME ZONE 'Asia/Tehran')::date AS day, count(DISTINCT p.user_id)::int AS n
	FROM lesson_progress p
	JOIN lessons l ON l.id=p.lesson_id
	JOIN course_sections s ON s.id=l.section_id
	WHERE s.course_id=$1 AND p.updated_at >= `+tehranSince+`
	GROUP BY 1
)
SELECT days.day::text, coalesce(enr.n,0), coalesce(rev.v,0), coalesce(wat.s,0), coalesce(act.n,0)
FROM days
LEFT JOIN enr ON enr.day=days.day
LEFT JOIN rev ON rev.day=days.day
LEFT JOIN wat ON wat.day=days.day
LEFT JOIN act ON act.day=days.day
ORDER BY days.day`, courseID, days)
	if err != nil {
		return fmt.Errorf("course stats series: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var day string
		var enrolled int
		var revenue, watch int64
		var active int
		if err := rows.Scan(&day, &enrolled, &revenue, &watch, &active); err != nil {
			return fmt.Errorf("scan course stats series: %w", err)
		}
		out.Series.Days = append(out.Series.Days, day)
		out.Series.Enrollments = append(out.Series.Enrollments, enrolled)
		out.Series.RevenueRial = append(out.Series.RevenueRial, revenue)
		out.Series.WatchSeconds = append(out.Series.WatchSeconds, watch)
		out.Series.ActiveLearners = append(out.Series.ActiveLearners, active)
	}
	return rows.Err()
}

// fillLessons adds the per-lesson engagement rows, ordered by curriculum.
func (r *CourseStatsRepo) fillLessons(ctx context.Context, out *ports.CourseStatsDetail, courseID uuid.UUID) error {
	rows, err := querierOf(ctx, r.pool).Query(ctx, `
SELECT l.id, l.title, l.position, l.duration_seconds, l.status,
	coalesce(s.title,''), s.position,
	(SELECT count(DISTINCT p.user_id)::int FROM lesson_progress p WHERE p.lesson_id=l.id),
	(SELECT count(DISTINCT p.user_id)::int FROM lesson_progress p WHERE p.lesson_id=l.id AND p.completed_at IS NOT NULL),
	(SELECT coalesce(sum(w.seconds),0)::bigint FROM lesson_watch_daily w WHERE w.lesson_id=l.id),
	(SELECT coalesce(avg(p.position_seconds),0)::float8 FROM lesson_progress p WHERE p.lesson_id=l.id)
FROM lessons l JOIN course_sections s ON s.id=l.section_id
WHERE s.course_id=$1
ORDER BY s.position, l.position`, courseID)
	if err != nil {
		return fmt.Errorf("course stats lessons: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var l ports.CourseLessonStat
		var status string
		var avgPosition float64
		if err := rows.Scan(&l.LessonID, &l.Title, &l.Position, &l.DurationSeconds, &status,
			&l.SectionTitle, &l.SectionPosition,
			&l.Started, &l.Completed, &l.WatchSeconds, &avgPosition); err != nil {
			return fmt.Errorf("scan course stats lesson: %w", err)
		}
		l.Status = status
		l.CompletionPct = completionPct(l.Completed, l.Started, 1)
		if l.DurationSeconds > 0 {
			l.AvgPositionPct = avgPosition / float64(l.DurationSeconds) * 100
		}
		out.Lessons = append(out.Lessons, l)
	}
	return rows.Err()
}

// fillSources splits the enrollments by how they were granted.
func (r *CourseStatsRepo) fillSources(ctx context.Context, out *ports.CourseStatsDetail, courseID uuid.UUID) error {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT e.source, count(*)::int FROM entitlements e
		 WHERE e.course_id=$1 AND e.revoked_at IS NULL GROUP BY e.source`, courseID)
	if err != nil {
		return fmt.Errorf("course stats sources: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var source string
		var n int
		if err := rows.Scan(&source, &n); err != nil {
			return fmt.Errorf("scan course stats source: %w", err)
		}
		out.Sources[source] = n
	}
	return rows.Err()
}

// fillReviews adds the latest learner reviews, newest first.
func (r *CourseStatsRepo) fillReviews(ctx context.Context, out *ports.CourseStatsDetail, courseID uuid.UUID) error {
	rows, err := querierOf(ctx, r.pool).Query(ctx,
		`SELECT r.id, coalesce(u.full_name,''), r.rating, r.body, r.status, r.created_at
		 FROM reviews r LEFT JOIN users u ON u.id=r.user_id
		 WHERE r.course_id=$1 ORDER BY r.created_at DESC LIMIT 8`, courseID)
	if err != nil {
		return fmt.Errorf("course stats reviews: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var rv ports.CourseStatsReview
		if err := rows.Scan(&rv.ID, &rv.UserName, &rv.Rating, &rv.Body, &rv.Status, &rv.CreatedAt); err != nil {
			return fmt.Errorf("scan course stats review: %w", err)
		}
		out.Reviews = append(out.Reviews, rv)
	}
	return rows.Err()
}

// learnerStatsBody is one learner's standing in one course. The course id is
// bound as $1; the query that wraps it appends its own arguments after that.
const learnerStatsBody = `
WITH standing AS (
	SELECT u.id AS user_id, u.full_name, u.mobile, e.source, e.granted_at,
		(SELECT coalesce(sum(oi.unit_price_rial),0)::bigint FROM order_items oi
			JOIN orders o ON o.id=oi.order_id AND o.status='paid'
			WHERE oi.course_id=$1 AND o.user_id=u.id) AS spent_rial,
		(SELECT count(*)::int FROM lessons l JOIN course_sections s ON s.id=l.section_id
			WHERE s.course_id=$1 AND l.status IN ('ready','published')) AS lessons_total,
		(SELECT count(DISTINCT p.lesson_id)::int FROM lesson_progress p
			JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id
			WHERE s.course_id=$1 AND p.user_id=u.id) AS lessons_started,
		(SELECT count(*)::int FROM lesson_progress p
			JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id
			WHERE s.course_id=$1 AND p.user_id=u.id AND p.completed_at IS NOT NULL) AS lessons_done,
		(SELECT coalesce(sum(w.seconds),0)::bigint FROM lesson_watch_daily w
			JOIN lessons l ON l.id=w.lesson_id JOIN course_sections s ON s.id=l.section_id
			WHERE s.course_id=$1 AND w.user_id=u.id) AS watch_seconds,
		(SELECT max(p.updated_at) FROM lesson_progress p
			JOIN lessons l ON l.id=p.lesson_id JOIN course_sections s ON s.id=l.section_id
			WHERE s.course_id=$1 AND p.user_id=u.id) AS last_activity_at,
		(SELECT r.rating FROM reviews r WHERE r.course_id=$1 AND r.user_id=u.id
			ORDER BY r.created_at DESC LIMIT 1) AS rating
	FROM entitlements e JOIN users u ON u.id=e.user_id
	WHERE e.course_id=$1 AND e.revoked_at IS NULL
)`

// learnerStatsWhere filters the standing rows; args already carries the
// course id, so the placeholders continue from there.
func learnerStatsWhere(f ports.LearnerStatFilter, args []any) (string, []any) {
	where := []string{"TRUE"}
	next := func() string { return fmt.Sprint(len(args) + 1) }
	if f.Q != "" {
		where = append(where, "(full_name ILIKE '%'||$"+next()+"||'%' OR mobile LIKE '%'||$"+next()+"||'%')")
		args = append(args, f.Q)
	}
	if f.Source != "" {
		where = append(where, "source = $"+next())
		args = append(args, f.Source)
	}
	switch f.State {
	case "completed":
		where = append(where, "lessons_total > 0 AND lessons_done >= lessons_total")
	case "started":
		where = append(where, "lessons_started > 0 AND lessons_done < lessons_total")
	case "not_started":
		where = append(where, "lessons_started = 0")
	}
	return strings.Join(where, " AND "), args
}

// learnerStatsOrder is the sort whitelist; the top of the list answers the
// question an operator asks first: who is actually watching.
func learnerStatsOrder(sort string) string {
	switch sort {
	case "progress_desc":
		return "lessons_done DESC, watch_seconds DESC"
	case "spent_desc":
		return "spent_rial DESC, granted_at DESC"
	case "enrolled_asc":
		return "granted_at ASC"
	case "name":
		return "full_name ASC"
	default:
		return "watch_seconds DESC, granted_at DESC"
	}
}

// Learners returns one page of the course's learners with their standing.
func (r *CourseStatsRepo) Learners(ctx context.Context, courseID uuid.UUID, f ports.LearnerStatFilter, page, perPage int) ([]ports.LearnerStat, int, error) {
	args := []any{courseID}
	where, args := learnerStatsWhere(f, args)
	q := learnerStatsBody + ` SELECT * FROM standing WHERE ` + where +
		` ORDER BY ` + learnerStatsOrder(f.Sort) +
		` LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)
	args = append(args, perPage, (page-1)*perPage)
	rows, err := querierOf(ctx, r.pool).Query(ctx, q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list course learners: %w", err)
	}
	defer rows.Close()
	var out []ports.LearnerStat
	for rows.Next() {
		var s ports.LearnerStat
		var source string
		if err := rows.Scan(&s.UserID, &s.FullName, &s.Mobile, &source, &s.GrantedAt,
			&s.SpentRial, &s.LessonsTotal, &s.LessonsStarted, &s.LessonsDone,
			&s.WatchSeconds, &s.LastActivityAt, &s.Rating); err != nil {
			return nil, 0, fmt.Errorf("scan course learner: %w", err)
		}
		s.Source = source
		if s.LessonsTotal > 0 {
			s.ProgressPct = float64(s.LessonsDone) / float64(s.LessonsTotal) * 100
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int
	err = querierOf(ctx, r.pool).QueryRow(ctx,
		learnerStatsBody+` SELECT count(*) FROM standing WHERE `+where, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count course learners: %w", err)
	}
	return out, total, nil
}
