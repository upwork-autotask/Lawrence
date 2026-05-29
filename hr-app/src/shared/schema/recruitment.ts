// MODULE: Recruitment
// STATUS: stub — Recruitment-module subagent.
// Legacy: tblRequest, Recruitment, tblInterview, tblQue, tblEmpInterview, tblMainSHeetInterview,
//         tblEvaluation, tblActualRecruitment, tblEmpTake, tblRecruitmentTarget,
//         tblRecruitmentAppData, tblNonRecruitmentReason.
// IMPORTANT: implement multi-interview-lead support via a junction table `interview_leads`
//            (referenced in REQUIREMENTS.md §8 module 11). Replaces the single-text "Interviewer Lead"
//            field on tblMainSHeetInterview. Required columns:
//              id, interview_id, employee_id, role_on_panel, is_primary, notes + auditColumns.
//            Unique index on (interview_id, employee_id).
export {};
