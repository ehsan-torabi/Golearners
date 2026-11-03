// Authz matrix spot-checks: learners must not reach admin routes.
package httpapi_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
)

// stubCourseRepo satisfies ports.CourseRepo for list-only tests.
type stubCourseRepo struct{ ports.CourseRepo }

func (stubCourseRepo) ListAdmin(context.Context, ports.CourseFilter) ([]*course.Course, int, error) {
	return nil, 0, nil
}

// stubAuditRepo satisfies ports.AuditRepo for list-only tests.
type stubAuditRepo struct{ ports.AuditRepo }

func (stubAuditRepo) List(context.Context, int, int) ([]*ports.AuditEntry, int, error) {
	return nil, 0, nil
}

// stubCourseStatsRepo satisfies ports.CourseStatsRepo for list-only tests.
type stubCourseStatsRepo struct{ ports.CourseStatsRepo }

func (stubCourseStatsRepo) List(context.Context, ports.CourseStatsFilter, int, int) ([]ports.CourseStatsRow, int, error) {
	return nil, 0, nil
}

func (stubCourseStatsRepo) Detail(context.Context, uuid.UUID, int) (*ports.CourseStatsDetail, error) {
	return &ports.CourseStatsDetail{}, nil
}

func (e *testEnv) loginAsAdmin(t *testing.T, mobile string) []*http.Cookie {
	t.Helper()
	cookies := e.registerAndVerify(t, mobile)
	u, ok := e.users.FindByMobileForTest(mobile)
	require.True(t, ok)
	require.NoError(t, e.users.AddRole(context.Background(), u.ID, identity.RoleAdmin))
	return cookies
}

func TestLearnerCannotReachAdminRoutes(t *testing.T) {
	e := newEnv(t)
	learner := e.registerAndVerify(t, "09121234567")
	hdr := http.Header{"X-CSRF-Token": []string{cookieByName(learner, "gl_csrf")}}

	for _, tc := range []struct{ method, path string }{
		{"GET", "/api/v1/admin/courses"},
		{"POST", "/api/v1/admin/courses"},
		{"DELETE", "/api/v1/admin/courses/00000000-0000-7000-8000-000000000001"},
		{"GET", "/api/v1/admin/audit-logs"},
		{"GET", "/api/v1/admin/messages"},
		{"GET", "/api/v1/admin/course-stats"},
		{"GET", "/api/v1/admin/course-stats/00000000-0000-7000-8000-000000000001"},
	} {
		rec := e.do(t, tc.method, tc.path, "{}", hdr, learner)
		require.Equal(t, http.StatusForbidden, rec.Code, "%s %s: %s", tc.method, tc.path, rec.Body.String())
		require.Contains(t, rec.Body.String(), "FORBIDDEN")
	}
}

func TestAdminReachesAdminRoutes(t *testing.T) {
	e := newEnv(t)
	e.app.CoursesRepo = stubCourseRepo{}
	e.app.Audit = stubAuditRepo{}
	e.app.CourseStats = stubCourseStatsRepo{}
	admin := e.loginAsAdmin(t, "09121234567")

	rec := e.do(t, "GET", "/api/v1/admin/courses", "", nil, admin)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	rec = e.do(t, "GET", "/api/v1/admin/audit-logs", "", nil, admin)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
	rec = e.do(t, "GET", "/api/v1/admin/course-stats", "", nil, admin)
	require.Equal(t, http.StatusOK, rec.Code, rec.Body.String())
}

func TestAnonymousGets401OnAdminRoutes(t *testing.T) {
	e := newEnv(t)
	rec := e.do(t, "GET", "/api/v1/admin/courses", "", nil, nil)
	require.Equal(t, http.StatusUnauthorized, rec.Code)
}
