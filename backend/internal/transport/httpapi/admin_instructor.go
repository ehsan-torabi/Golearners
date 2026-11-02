package httpapi

import (
	"net/http"

	"github.com/google/uuid"

	"golearn/backend/internal/service/courseadmin"
)

// instructorPayload is the JSON shape of the editable teacher profile.
type instructorPayload struct {
	Headline      string            `json:"headline"`
	BioHTML       string            `json:"bio_html"`
	AvatarMediaID *uuid.UUID        `json:"avatar_media_id"`
	Socials       map[string]string `json:"socials"`
}

// GET /api/v1/admin/instructor — the editable about-the-teacher profile.
func (a *App) handleAdminInstructorGet(w http.ResponseWriter, r *http.Request) {
	i, err := a.CourseAdmin.Instructor(r.Context())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, instructorPayload{
		Headline: i.Headline, BioHTML: i.BioHTML,
		AvatarMediaID: i.AvatarMediaID, Socials: i.Socials,
	})
}

// PUT /api/v1/admin/instructor
func (a *App) handleAdminInstructorPut(w http.ResponseWriter, r *http.Request) {
	var in instructorPayload
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	err := a.CourseAdmin.UpdateInstructor(r.Context(), adminActor(r), courseadmin.InstructorInput{
		Headline: in.Headline, BioHTML: in.BioHTML,
		AvatarMediaID: in.AvatarMediaID, Socials: in.Socials,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
