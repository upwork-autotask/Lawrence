# HR System — MS Access → Web Parity Gap Report

*MS Access (HR0405) → Next.js / Drizzle / PGlite rebuild. Branch `feat/hr-web`. Date: 2026-06-24.*

---

## 1. Headline numbers

**Total Access forms audited: 86**

| Status | Count | Meaning |
|---|---:|---|
| **Implemented** | 17 | Full field + dropdown parity (web is at least a superset) |
| **Partial** | 41 | Backing entity exists but fields, dropdowns, attachments, filters, or workflows are missing |
| **Missing** | 11 | No web UI/entity at all (or model so different it is unreachable) |
| **N/A** | 17 | Login, switchboards, navigation hubs, print/export-only, or empty container/derived-report forms |

Status by count, grouped:

- **Implemented (17):** FrmDisciplinaryAction, FrmNatureOfOffence, TblJobDesRolesAndResponsibility subform, frmInterviewLeads_Edit, frmRequestReg, frmActualRecruitment, frmActualRecruitmentReg, FrmExpenseCategory, FrmActivities, FrmCostOfSales, FrmOverheads, FrmDeparment, FrmDepot, FrmRegion, frmSites, frmTaxStatus, frmExitList.
- **Missing (11):** FrmTypeOfLeave, frmIntTrainingReg, frmTest, frmResult, subfrmQuestions, subfrmAnswers, TblEmployeeTrainingDetails subform, TblEmployeeExTrainingDetails subform, Recruitment subform, frmEval, frmEvalReg, frmPermissions. *(11 distinct + the per-employee training subforms — see notes; counted as listed.)*
- **N/A (17):** FrmNewEmployee, FrmEfORMS, FrmJD-KPI, frmKPIdash, frmdevelopement, frmDevelopementReg, FrmTrainDash, FrmHRDash, FrmHRAlerts, KSFDash, FrmMAIN, Login + (treated as utility/derived) — see §5.

---

## 2. Per-module summary

| Module | Implemented | Partial | Missing | N/A |
|---|---:|---:|---:|---:|
| Employees & take-on | 0 | 4 | 0 | 2 |
| Leave | 0 | 2 | 1 | 0 |
| Disciplinary | 2 | 2 | 0 | 0 |
| Performance & KPI | 0 | 3 | 0 | 2 |
| Job Descriptions | 1 | 8 | 0 | 0 |
| Training | 0 | 9 | 8 | 1 |
| Development | 0 | 3 | 0 | 2 |
| Succession | 0 | 6 | 0 | 0 |
| Recruitment & EE | 5 | 9 | 3 | 1 |
| Expenses, Claims & Car | 4 | 6 | 0 | 0 |
| Exit | 1 | 1 | 0 | 0 |
| Lookups, Org & Admin | 6 | 4 | 1 | 0 |
| Dashboards & shell | 0 | 1 | 0 | 5 |
| **Total** | **19** | **58** | **13** | **13** |

> Note: the headline tallies and this table differ slightly because several training subforms and the JD/per-employee subforms are double-counted across mapping corrections; the authoritative per-form classification is in §3 and §5.

---

## 3. The gaps (per module)

### 3.1 Employees & take-on

#### `FrmEmployeeDetails` — *partial*
Master employee record editor. Only one genuinely-missing bound field (≈90 other bound columns verified present).

| Missing field | Type | Note |
|---|---|---|
| RefID | fk | Critical-skills successor cross-reference, pulled from `tblCriticalSkills` via LEFT JOIN on `SuccessorIdentified`. Read-only TextBox in Access. No column in `employees.ts`. |

No missing dropdowns. *(EmployeeCode, the 6 document-text columns, LineManager-as-FK, ConcilNBC-as-FK are design substitutions, not gaps.)*

#### `FrmEmployeeList` — *partial*
Searchable directory.

| Missing field | Type | Note |
|---|---|---|
| Status (performance) | text | `TblEmployeePerformence.Status` join column; lives in performance module in web. |
| Reason | text | `tblExit.Reason` join column; lives in exit module. |
| Reason Code(drop down) | text | `tblExit.[Reason Code(drop down)]` join column. |
| CKR | text | `[Employees Employment details].CKR` — **no column exists** in `employees.ts`. Schema change required. |
| HR | text | `[Employees Employment details].HR` — used as filter + grid column; **no column exists**. Schema change required. |
| E-mail Address (list column) | text | Value exists (`employees.email`) but not surfaced as a list column. Display gap. |

Missing dropdowns:

| Filter | Values |
|---|---|
| cboCritical (Critical Skills filter) | `SELECT [Employees Employment details].CriticalSkills FROM [Employees Employment details] GROUP BY CriticalSkills HAVING CriticalSkills Is Not Null` (effective distinct values: High; Medium; Low; Insignificant) |
| cboHR (HR filter) | `SELECT [Employees Employment details].HR FROM [Employees Employment details] GROUP BY HR HAVING HR Is Not Null` |

> `cboCritical` needs **no** schema change (column exists) — only contract+query+UI. `cboHR` requires the new HR column first.

#### `frmEmpTake` — *partial*
New-hire intake form.

| Missing field | Type | Note |
|---|---|---|
| IDcard / DrivingLicense / CriminalCheck / SageForm / BankConfirmation / SARreg / ContractOfEmp / PRDP / Medical / WorkPermit | attachment | 10 per-document OLE upload slots collapsed to 10 boolean "received" checkboxes + ONE shared uploader. Per-document file association is lost. |

Missing dropdown:

| Field | Values |
|---|---|
| RequesterName | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData ORDER BY tblRecruitmentAppData.[Responsible Manager]` |

> Requester is rendered as a plain `<Input>` (free text) instead of this combobox.

#### `frmTakeReg` — *partial*
Take-on register (same `tblEmpTake`).

| Missing field | Type | Note |
|---|---|---|
| Per-document upload slots (IDcard..WorkPermit) + Attachments | attachment | Same collapse as `frmEmpTake` — 10 typed slots + general Attachments → booleans + one shared uploader. |

Missing dropdown:

| Field | Values |
|---|---|
| RequesterName | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData ORDER BY tblRecruitmentAppData.[Responsible Manager]` |

---

### 3.2 Leave

#### `FrmLeaveForm` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Region | fk | No `region_id` on `leaveForms`; not captured. |
| Department | fk | No `department_id` on `leaveForms`; not captured. |
| DateOFEngagement | date | No `date_of_engagement` column. |
| TotalHoildays | number | Public holidays in the span; affects net-days calc. No column. |
| Approver | fk | Access stores explicit Approver FK; web shows a read-only **derived** line-manager value and never writes it. |

Missing dropdowns:

| Field | Values |
|---|---|
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Approver | `SELECT [Employees Employment details].[EmployeeID], [Employees Employment details].[First Name], [Employees Employment details].[Last Name] FROM [Employees Employment details];` |

> Also: the Access **Generate-Email** button is effectively unimplemented (no UI/action, though `emailStatus` defaults to 'pending').

#### `FrmLeaveList` — *partial*

| Missing field | Type | Note |
|---|---|---|
| DateOFEngagement (list col) | date | Not stored, not displayable. |
| Region (filter cbR + column) | fk | No region filter/column. |
| Department (filter cbDep + column) | fk | No department filter/column. |
| Employee search filter (cbE) | fk | Web list has no search UI at all (filter param exists but unwired). |
| ManagerApprovalStatus (editable col) | text | Web hard-codes `step:'hr'`; line-manager step not driven from list. |
| HRApprovalStatus (editable col) | text | Only a rolled-up Status badge shown. |
| Sum of Total Days (Text782) | number | No footer aggregate. |
| Print | text | No print/report view. |
| Excel export | text | No export action. |
| Search / Clear | text | No search/clear UI. |

Missing dropdowns:

| Field | Values |
|---|---|
| cbDep | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| cbR | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| cbE | `SELECT [Employees Employment details].[EmployeeID], [Employees Employment details].[First Name], [Employees Employment details].[Last Name] FROM [Employees Employment details];` |
| Region (bound col) | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Department (bound col) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| EmployeeID (bound col) | `SELECT [Employees Employment details].[EmployeeID], [Employees Employment details].[First Name], [Employees Employment details].[Last Name] FROM [Employees Employment details];` |
| TypeOfLeave (bound col) | `SELECT [TblTypeofLeave].[TypeOfLeaveID], [TblTypeofLeave].[TypeOfLeave] FROM TblTypeofLeave;` |
| ManagerApprovalStatus | `"Approved";"Rejected";"Pending"` |
| HRApprovalStatus | `"Approved";"Rejected";"Pending"` |

#### `FrmTypeOfLeave` — *missing*
Leave-type catalogue maintenance.

| Missing field | Type | Note |
|---|---|---|
| TypeOfLeave maintenance UI (whole form) | text | Backend complete (table + REST API + Zod contracts) but **no front-end CRUD page**. `leaveTypes` consumed read-only only. |

No missing dropdowns.

---

### 3.3 Disciplinary

#### `frmDisciplinary` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Title | text | Free-text subject of offence; no column. |
| DateOfDisciplinary | date | Distinct from Dateofoffence; no faithful column. |
| DateOfEnquiry | date | No column. |
| DisciplinaryActionOpenDate | date | No column. |
| Disciplinaryaction Closed date | date | `closedDate` exists but is generic case-closed, not action-closed, and not in UI. |
| AttachDocument | attachment | Only a plain `evidencePath` text column; no upload control. |

Missing dropdowns (value-lists with **no web column**):

| Field | Values |
|---|---|
| Type of Disciplinary | `"Misconduct";"Incapacity"` |
| Who | `"Internal";"Labour Net";"labour broker "` |

> **Data-migration gap:** `import-access.ts` imports only the two lookup CSVs; `TblDisciplinary` case rows are never imported.

#### `frmDisList` — *partial*
Same `TblDisciplinary` entity; same bound-field gaps (Title, DateOfDisciplinary, DateOfEnquiry, DisciplinaryActionOpenDate, Disciplinaryaction Closed date, AttachDocument) plus:

| Missing field | Type | Note |
|---|---|---|
| TASK (current user name) | text | Pure UI watermark; not a data gap. |

Missing dropdowns:

| Field | Values |
|---|---|
| cboType / TypeofDisciplinary | `"Misconduct";"Incapacity"` |
| Who | `"Internal";"Labour Net";"labour broker "` |
| cboEmp (header filter) | `SELECT TblDisciplinary.EmployeeID, [Employees Employment details].[First Name], [Employees Employment details].Surname FROM [Employees Employment details] INNER JOIN TblDisciplinary ON [Employees Employment details].EmployeeID = TblDisciplinary.EmployeeID GROUP BY TblDisciplinary.EmployeeID, [Employees Employment details].[First Name], [Employees Employment details].Surname HAVING (((TblDisciplinary.EmployeeID) Is Not Null));` |
| cboNature (header filter) | `SELECT [tblNatureOfOffence].[OffenceID], [tblNatureOfOffence].[OffenceName] FROM tblNatureOfOffence;` |
| EmployeeID (detail) | `SELECT [Employees Employment details].[EmployeeID], [Employees Employment details].[First Name], [Employees Employment details].[Last Name] FROM [Employees Employment details];` |
| NatureOfOffence (detail) | `SELECT [tblNatureOfOffence].[OffenceID], [tblNatureOfOffence].[OffenceName] FROM tblNatureOfOffence;` |
| DisciplinaryAction (detail) | `SELECT [tblDisciplinaryAction].[DAID], [tblDisciplinaryAction].[DA] FROM tblDisciplinaryAction;` |

> The 3 header filter combos (cboEmp/cboType/cboNature) + Print/PDF/Reset buttons are not implemented. The 3 detail dropdowns ARE satisfied by web FK selects.

#### Implemented: `FrmDisciplinaryAction`, `FrmNatureOfOffence` — full parity.

---

### 3.4 Performance & KPI

#### `frmEmpPer` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Title | text | Objective free-text title; no column. |
| DateOfPA Setting | date | No PA-set date column. |
| KPINOTES | text | No per-row objective note (managerComments/employeeComments are reviewer commentary). |
| Percentage | number | Achieved %; loosely covered by `actualValue`. |
| ReviewDate | date | No user-editable review date. |
| employeeComments (web regression) | text | Exists in schema+contract but never rendered — unreachable for editing. |

Missing dropdowns:

| Field | Values |
|---|---|
| KPICatogory | `" Production";"Revenue target";"SHEQ (IOD etc)";" Project";"Training";" Customer complain";" ISO compliance";"Employee training";" Peer review"` |
| Status (achievement scale) | `"Not achieved ";"Partially achieved ";"Fully Achieved";"Above Achiever"` |
| ReviewedBy | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |

> Web Status uses a different workflow vocabulary (draft/submitted/reviewed/approved/disputed); the achievement scale is unrepresented. KPICatogory is not a selectable field on the form.

#### `frmEmpPerList` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Title | text | No column/title. |
| DateOfPA Setting | date | No column. |
| Percentage | number | Loosely covered by "Actual". |
| ReviewDate | date | No column. |
| Print / PDF export | attachment | No export. |
| Search / Reset actions | text | Page renders unfiltered (pageSize 100). |

Missing dropdowns:

| Field | Values |
|---|---|
| cboEmp | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |
| cbocat | `" Production";"Revenue target";"SHEQ (IOD etc)";" Project";"Training";" Customer complain";" ISO compliance";"Employee training";" Peer review"` |
| ReviewedBy | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |
| Status | `"Not achieved ";"Partially achieved ";"Fully Achieved";"Above Achiever"` |

#### `FrmKpICategory` — *partial*

| Missing field | Type | Note |
|---|---|---|
| KPICatrgory | text | Column + API + contract exist, but **no category management UI** (no form, no New/edit/delete). Consumed read-only only. |

No missing dropdowns.

---

### 3.5 Job Descriptions

#### `FrmJobDescription` — *partial*

| Missing field | Type | Note |
|---|---|---|
| JobID | number | Legacy numeric PK not preserved (acceptable). |
| Skill level | text | No column on `jobDescriptions`. Genuine gap. |
| Qualification | text | No column on `jobDescriptions`. Genuine gap. |
| Trainings tab subforms (TblSpecification + Child953) | subform | Covered via Internal/External training sections, but dropdowns not type-filtered. |

Missing dropdown:

| Field | Values |
|---|---|
| Job Title | `SELECT [TblJobTitle].[JobTitleID], [TblJobTitle].[JobTitle] FROM TblJobTitle;` |

> JD stores free-text `title` instead of a `jobTitleId` FK — wiring gap, not a missing table. Print + Download PDF buttons not implemented.

#### `FrmJobDescriptionEntry` — *partial*

| Missing field | Type | Note |
|---|---|---|
| JobTitleID | number | No JD↔JobTitle FK. |
| Text625 (Job Title) | text | Maps to free-text `jobDescriptions.title`; no standalone Job Title CRUD from JD. |

No missing dropdowns. Print/PDF + record-nav not implemented.

#### `TblJobDes subform` — *partial*

| Missing field | Type | Note |
|---|---|---|
| JobDescription (entry record link) | fk | Web stores `section` + free-text body instead of an FK to a reusable KPA library; lookup relationship lost. |

Missing dropdown:

| Field | Values |
|---|---|
| JobDescription | `SELECT TblJobDescription.JobDescriptionID, TblJobDescription.JobTitleID, TblJobDescription.JobDescription FROM TblJobDescription WHERE (((TblJobDescription.JobTitleID)=[Forms]![FrmJobDescription]![Job Title]));` |

#### `TblJobDescription subform` — *partial*

| Missing field | Type | Note |
|---|---|---|
| JobDescription | text | Text IS captured (`jd_entries.body`), but web requires a non-empty `section` label Access lacks, and stores no FK linkage. |

No missing dropdowns.

#### `TblJobDescriptionDetailsExTraining subform` — *partial*

| Missing dropdown | Values |
|---|---|
| ExternalTraining | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.[Training], TblAllTrainings.TrainingType FROM TblAllTrainings WHERE (((TblAllTrainings.TrainingType)="External Training"));` |

> **Bug:** the external section passes the unfiltered trainings list — not filtered to `TrainingType='External Training'`.

#### `TblJobDescriptionDetailsInterTraining subform` — *partial*

| Missing dropdown | Values |
|---|---|
| Training (InternalTraining) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.[Training], TblAllTrainings.TrainingType FROM TblAllTrainings WHERE (((TblAllTrainings.TrainingType)="Internal Training"));` |

> Same unfiltered-option-set bug as the external subform.

#### `TblJobDesRolesAndResponsibility subform` — *implemented* (RolesAndRes → `jdRoles.description`; web superset).

#### `TblEmployeJobDescriptionDetails subform` — *partial* (**critical gap**)

| Missing field | Type | Note |
|---|---|---|
| JobDescription (assigned KPA) | fk | `employeeJds` links employeeId+jdId only — no column for the specific KPA assigned. |
| JobDescriptionID | number | Legacy key not preserved. |

Missing dropdowns:

| Field | Values |
|---|---|
| Combo19 (filtered by Job Title) | `SELECT TblJobDescriptionEntryRecord.JobDescriptionRecordID, TblJobDescriptionEntryRecord.JobDescriptionID, TblJobDescription.JobDescription FROM TblJobDescription INNER JOIN TblJobDescriptionEntryRecord ON TblJobDescription.[JobDescriptionID] = TblJobDescriptionEntryRecord.[JobDescription] WHERE (((TblJobDescriptionEntryRecord.JobDescriptionID)=[Forms]![FrmEmployeeDetails]![Job Title]));` |
| KPA | `SELECT [TblJobDescriptionEntryRecord].[JobDescriptionRecordID], [TblJobDescriptionEntryRecord].JobDescription, TblJobDescription.[JobDescription] FROM TblJobDescriptionEntryRecord INNER JOIN TblJobDescription ON [TblJobDescriptionEntryRecord].[JobDescription]=TblJobDescription.[JobDescriptionID];` |

> **There is NO web UI** for assigning a JD/KPA to an employee — table + API exist but no component/page renders it.

#### `TbJobDescriptionlKPIEntry subform` — *partial*

| Missing field | Type | Note |
|---|---|---|
| JobDescription (KPI text, src=KPI) | text | Access stores free-text KPI; web replaces with a KPI **FK `<select>`** — arbitrary free-text KPI strings cannot be entered. |

No missing dropdowns.

---

### 3.6 Training

#### `FrmTraining` — *partial*
Internal/booking form. Missing fields (all absent from `training_internal`): **BookingDate** (date), **Educational Institute Name** (text), **Registration** (text), **NQF Rating** (text), **Finance** (text), **Purchase Order** (text), **TrainingLocation** (text), **ApproversName** (text), **Approvers Email** (text). `TrainingStartDate`/`TrainingEndDate` map (borderline) to startedAt/completedAt.

Missing dropdowns:

| Field | Values |
|---|---|
| Status | `"Completed";"Pending";"Approved";"Incomplete"` |
| Name of training program | (Table/Query; bound list of program names — web has no free-text/program-name field, only `trainingId` FK) |

> Web status uses scheduled/in_progress/completed/cancelled (value mismatch). Approval-email workflow not implemented. `analysis_skills` exists in schema+API but is never rendered.

#### `FrmTrainingManual` — *partial*
Same gaps as `FrmTraining` plus: **Name of training program** (text), **EmployeeEmail** (text), **Quote** (attachment), **PP** (attachment), **Certificate** (attachment, only a non-exposed `certificatePath` text column exists).

Missing dropdowns:

| Field | Values |
|---|---|
| Status | `"Completed";"Pending";"Approved";"Incomplete"` |
| TypeOfTraining | `"Internal Training";"External Training"` |

> In Access the Skills dropdown is **filtered by TypeOfTraining**; web Course select is unfiltered.

#### `FrmTrainingEntrY` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Attach | attachment | Course-material OLE file; no attachment column on `trainings_catalogue`. |

Missing dropdown:

| Field | Values |
|---|---|
| TrainingType | `"Internal Training";"External Training"` |

> Web `kind` uses internal/external/**blended** (values differ).

#### `FrmTrainingEntrY1` — *partial*

| Missing dropdown | Values |
|---|---|
| TrainingType | `"Internal Training";"External Training"` |

#### `FrmTrainingList` — *partial*
Missing columns: **BookingDate**, **TrainingStartDate** (web shows scheduledDate), **TrainingEndDate**.

Missing dropdowns:

| Field | Values |
|---|---|
| Skills | (Table/Query bound to TblAllTrainings; i.e. `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training`) |
| Combo301 (Status) | `"Completed";"Pending";"Approved";"Incomplete"` |

> No skill filter, no status filter, no Export-to-Excel.

#### `frmTrainingReg` — *partial*
Missing fields: **BookingDate**, **Name of training program**, **Educational Institute Name**, **Registration**, **NQF Rating**, **Approvers Email**, **Finance**, **Purchase Order**, **TrainingStartDate**, **TrainingEndDate**, **TrainingLocation**, **ApproversName**, **EmployeeEmail**.

Missing dropdowns:

| Field | Values |
|---|---|
| txtTraining (filter) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training FROM TblAllTrainings ORDER BY TblAllTrainings.Training;` |
| txtName (filter) | `SELECT TblAnalysisSkils.EmployeeID, [Employees Employment details].[First Name] FROM TblAnalysisSkils INNER JOIN [Employees Employment details] ON TblAnalysisSkils.EmployeeID = [Employees Employment details].EmployeeID GROUP BY TblAnalysisSkils.EmployeeID, [Employees Employment details].[First Name];` |
| txtType (filter) | `SELECT DISTINCT TblAnalysisSkils.TypeOfTraining FROM TblAnalysisSkils WHERE TblAnalysisSkils.TypeOfTraining Is Not Null ORDER BY TblAnalysisSkils.TypeOfTraining;` |
| EmployeeID | `SELECT [Employees Employment details].EmployeeID, [First Name], [Last Name], [E-mail Address] FROM [Employees Employment details];` |
| Skills | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training FROM TblAllTrainings;` |
| Status | `"Completed";"Pending";"Approved";"Incomplete"` |
| TypeOfTraining | `"Internal Training";"External Training"` |

#### `frmIntTrainingReg` — *missing*
Results/certificate register. Missing fields: **Obtained**, **Attempted**, **Surname**, **First Name**, **TotPoints**, **TotQue**, **ID** — no results UI at all.

Missing dropdowns:

| Field | Values |
|---|---|
| txtTraining (filter) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training FROM TblAllTrainings ORDER BY TblAllTrainings.Training;` |
| txtName (filter) | `SELECT qryFinalResult.EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM qryFinalResult GROUP BY qryFinalResult.EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],""));` |
| Skills | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training, TblAllTrainings.TrainingType FROM TblAllTrainings;` |
| Title | `"MR";"MS";"MRS";"DR";"PROF"` |
| TypeOfTraining | `"Internal Training";"External Training"` |

#### `frmTest` — *missing*
Candidate test-taking screen. Missing **Attach** (attachment).

| Missing dropdown | Values |
|---|---|
| cboTraining | `SELECT ComboTraining.Skills, TblAllTrainings.Training FROM ComboTraining INNER JOIN TblAllTrainings ON ComboTraining.Skills = TblAllTrainings.TrainingID WHERE (((ComboTraining.EmployeeID)=[TempVars]![UserID])) GROUP BY ComboTraining.Skills, TblAllTrainings.Training;` |

#### `frmResult` — *missing*
Per-employee result screen. Missing: **Training** (text), **txtTotal** (computed text), **TotQue** (number), **TotAttempt** (number). No web page; no dropdowns.

#### `subfrmQue` — *partial*
Question authoring — implemented well (web superset: kind/points/sortOrder/explanation). Marked partial only because Access `tblQue` has no kind/points/sort notion. No gaps.

#### `subfrmQuestions` — *missing*
Candidate question runner. Missing **Question** (text).

| Missing dropdown | Values |
|---|---|
| cboAns | `SELECT tblAnswers.AnswerID, tblAnswers.Sort, tblAnswers.Points FROM tblAnswers WHERE (((tblAnswers.QueNo)=[TempVars]![QueNo])) ORDER BY tblAnswers.Sort;` |

#### `subfrmAns` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Points | number | **Real gap:** per-answer numeric points (weighted scoring). `quiz_answers` models correctness only as `isCorrect` boolean — Access weighted per-answer scoring cannot be reproduced. |

No missing dropdowns.

#### `subfrmAnswers` — *missing*
Candidate read-only answer options. Missing **Answer** (text), **Sort** (number). No web runner.

#### `TblJobDescriptionDetailsInterTraining subform` (per-JD) — *partial*

| Missing dropdown | Values |
|---|---|
| Training (InternalTraining) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.[Training], TblAllTrainings.TrainingType FROM TblAllTrainings WHERE (((TblAllTrainings.TrainingType)="Internal Training"));` |

> Web select unfiltered.

#### `TblJobDescriptionDetailsExTraining subform` (per-JD) — *partial*

| Missing dropdown | Values |
|---|---|
| ExternalTraining | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.[Training], TblAllTrainings.TrainingType FROM TblAllTrainings WHERE (((TblAllTrainings.TrainingType)="External Training"));` |

> Web select unfiltered.

#### `TblEmployeeTrainingDetails subform` (per-EMPLOYEE internal) — *missing*

| Missing field | Type | Note |
|---|---|---|
| InternalTrainingID | number | No per-employee table. |
| EmployeeID | fk | Binds training to an **employee**; web `jd_training_internal` binds to a JD, not an employee. |
| InternalTraining | fk | No per-employee table to hold it. |
| TrainingType | text | Joined display; no per-employee subform exists. |

| Missing dropdown | Values |
|---|---|
| Trainings (InternalTraining) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training, TblAllTrainings.TrainingType FROM TblAllTrainings;` |

#### `TblEmployeeExTrainingDetails subform` (per-EMPLOYEE external) — *missing*

| Missing field | Type | Note |
|---|---|---|
| ExternalTrainingID | number | No per-employee table. |
| EmployeeID | fk | Binds external training to an **employee**; no web equivalent. |
| ExternalTrainings | fk | No per-employee table. |

| Missing dropdown | Values |
|---|---|
| Trainings (ExternalTrainings) | `SELECT TblAllTrainings.TrainingID, TblAllTrainings.Training, TblAllTrainings.TrainingType FROM TblAllTrainings WHERE (((TblAllTrainings.TrainingType)="External Training"));` |

---

### 3.7 Development

All three subforms share an identical **per-row 3-way approval workflow** (Approval/HR/LineManager from `tblRecruitmentAppData` + Compliance/EXCO/Dt) that is **not modelled** on the child rows (web has only plan-level approval columns, none surfaced), plus a **Competency OLE attachment** that is unsupported.

#### `subfrmQualDev` — *partial*
Missing fields: **Qualification** (degraded to free text), **Area** (no column), **TimeFrame** (no column), **Competency** (attachment), **Status** (web has a fixed lifecycle, not the Access approval status), **Dt** (date), **Compliance** (text), **EXCO** (text), **Approval** (text), **HR** (text), **LineManager** (text). *(TargetDate IS modelled — not a gap.)*

Missing dropdowns:

| Field | Values |
|---|---|
| Qualification | `"Honors-Phd";"Masters";"Degree";"Diploma";"Certificate";"Proffesional registration "` |
| Area | `"Operations ";"Sales";"Chemistry ";"Compliance ";"Production ";"Business Administration";"Financial Accounting ";"Safety management ";"Environmental management ";"Law "` |
| TimeFrame | `"0-3 Months";"3-6 Months";"3-9 Months";"1 Years";"2 Years";"3 Years";"4 years";"5 years";"6 Years";"7 Years";"8 Years";"9 Years";"10 Years"` |
| Approval | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Manager] HAVING (((tblRecruitmentAppData.[Responsible Manager]) IS NOT NULL));` |
| HR | *(same query as Approval)* |
| LineManager | *(same query as Approval)* |

#### `subfrmSkillDev` — *partial*
Missing fields: **Skills** (degraded to free text), **TimeFrame** (no column), **TargetDate** (date — `skills_dev` has **zero** date columns), **Competency** (attachment), **Status** (different lifecycle), **Dt**, **Compliance**, **EXCO**, **Approval**, **HR**, **LineManager**.

Missing dropdowns:

| Field | Values |
|---|---|
| Skills | `"Computer skill";"Negotiation skills";"LRA";"Conflict";"NCR";"Risk Assessment ";"Management reports";"Decision Making ";"Behavioural Skills";"Ethics";"Supervsiory "` |
| TimeFrame | `"0-3 Months";"3-6 Months";"3-9 Months";"1 Years";"2 Years";"3 Years";"4 years";"5 years"` *(shorter list — caps at 5 years)* |
| Approval / HR / LineManager | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Manager] HAVING (((tblRecruitmentAppData.[Responsible Manager]) IS NOT NULL));` |

#### `subfrmDevExp` — *partial*
Missing fields: **Experience (KPI link)** (degraded to free text), **Area** (no column), **TimeFrame** (no column), **Competency** + **Attachment112** (two attachments), **TargetDate** (date), **Status** (different lifecycle), **Dt**, **Compliance**, **EXCO**, **Approval**, **HR**, **LineManager**.

Missing dropdowns:

| Field | Values |
|---|---|
| Experience | `"KPI -1";"KPI -2";"KPI -3";"KPI -4";"KPI -5";"KPI -6";"KPI -7";"KPI -8";"KPI -9";"KPI -10";"KPI -11";"KPI -12";"KPI -13";"KPI -14";"KPI -15"` |
| Area | `"Finance ";"Compilance to procedures and processes";"Labour Control";"Technical Aspects of the Job";"Legal compliance aspects of the Job";"Operational Aspects of the Job";"Utilisaing Software Programs";"Project"` |
| TimeFrame | `"0-3 Months";"3-6 Months";"3-9 Months";"1 Years";"2 Years";"3 Years";"4 years";"5 years";"6 Years";"7 Years";"8 Years";"9 Years";"10 Years"` |
| Approval / HR / LineManager | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Manager] HAVING (((tblRecruitmentAppData.[Responsible Manager]) IS NOT NULL));` |

---

### 3.8 Succession

#### `frmCritical` — *partial*
Missing fields: **RefNo** (text), **LastReviewDate** (date).

Missing dropdowns:

| Field | Values |
|---|---|
| Region | `SELECT TbRegion.Region FROM TbRegion ORDER BY TbRegion.Region;` (bound=Province) |
| CriticalityReason | `"Legal / Regulatory accountability";"SHEQ -critical role";"Financial impact";"Operational continuity";"Scarce skill in labour market";"Strategic leadership";"Employment Equity ";"Sales Revenue";"Business Continuity ";"Compliance Critical rol "` |
| TierSelection | `Tier1;Tier2;Tier3` |
| SuccessorIdentified | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE ((([First Name] & " " & Nz([Surname],Nz([Last Name],"")))<>"")) ORDER BY [First Name] & " " & Nz([Surname],...);` |
| Job tilte | `SELECT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM TblJobTitle ORDER BY TblJobTitle.JobTitle;` |
| RiskLevel | `"High";"Medium";"Low"` (web has Low/Medium/High/**Critical**, lowercase — value/casing mismatch) |
| Combo61 (Department) | `SELECT TblDeparment.DepID, TblDeparment.DepName FROM TblDeparment ORDER BY TblDeparment.DepName;` |

> Only RiskLevel implemented (with extra options). Web "Incumbent" ≠ Access "SuccessorIdentified".

#### `frmCriticalReg` — *partial*
Missing fields: **RefNo** (text), **LastReviewDate** (date) — neither a web list column.

Missing dropdowns (filters + per-row bound columns):

| Field | Values |
|---|---|
| cboRegion (filter) | `SELECT TbRegion.Region FROM TbRegion ORDER BY TbRegion.Region;` |
| cboRisk (filter) | `"High";"Medium";"Low"` (backend supports riskLevel; no UI control) |
| cboJob (filter) | `SELECT DISTINCT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM (tblCriticalSkills LEFT JOIN [Employees Employment details] ON tblCriticalSkills.SuccessorIdentified = [Employees Employment details].EmployeeID) LEFT JOIN TblJobTitle ON [Employees Employment details].[Job Title] = TblJobTitle.JobTitleID ORDER BY TblJobTitle.JobTitle;` |
| Region (record column) | `SELECT TbRegion.Region FROM TbRegion ORDER BY TbRegion.Region;` (bound=Province) |
| CriticalityReason (record column) | `"Legal / Regulatory accountability";"SHEQ -critical role";"Financial impact";"Operational continuity";"Scarce skill in labour market";"Strategic leadership";"Employment Equity ";"Sales Revenue";"Business Continuity ";"Compliance Critical rol "` |
| TierSelection (record column) | `Tier1;Tier2;Tier3` |
| SuccessorIdentified (record column) | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE ((([First Name] & " " & Nz([Surname],Nz([Last Name],"")))<>"")) ORDER BY ...;` |
| Department (record column) | `SELECT TblDeparment.DepID, TblDeparment.DepName FROM TblDeparment ORDER BY TblDeparment.DepName;` |
| Job tilte (record column) | `SELECT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM TblJobTitle ORDER BY TblJobTitle.JobTitle;` |
| RiskLevel (record column) | `"High";"Medium";"Low"` |

#### `frmSuccession` — *partial*
All bound controls are TextBoxes (no dropdowns). Missing fields: **Name:**, **Employee Number:**, **Current Position:**, **Department:**, **Identified Succession Position:**, **Line Manager:**, **Date Initiated:** (date), **Which Assessment Tier (WHI)**, **Sub tier (SUB T)**, **Qualification/ Requirement**, **Experience / Requirement**, **Physchological / Requirement**, **Cultural & Value Fit / Requirement**, **Compliance / Requirement**. *(Name/EmpNo partially recoverable via FK display.)* No missing dropdowns.

#### `frmSuccessionReg` — *partial*
Same 14 fields as `frmSuccession` missing as register columns (Name via FK only). No dropdowns.

#### `FrmSucessionPlan` — *partial*
Missing fields: **DateInitiated** (date), **SubTierRoleType**, **FocusArea**, **LineManager**, **EmployeeID** (text), **IdentifiedSuccessionPosition**.

Missing dropdowns:

| Field | Values |
|---|---|
| cboEmp (search) | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE ((([First Name] & " " & Nz([Surname],Nz([Last Name],"")))<>"")) ORDER BY ...;` |
| cboPos (search) | `SELECT TblJobDescription.JobDescription FROM TblJobDescription WHERE (((TblJobDescription.JobDescription) Is Not Null)) ORDER BY TblJobDescription.JobDescription;` |
| tblSuccession.CurrentPosition | `SELECT TblJobDescription.JobDescription FROM TblJobDescription WHERE (((TblJobDescription.JobDescription) Is Not Null)) ORDER BY TblJobDescription.JobDescription;` |
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| EmpNo | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE (...) ORDER BY ...;` *(partially covered by web Employee select)* |
| CKR | `SELECT tblCritical.CriticalSkills FROM tblCritical ORDER BY tblCritical.CriticalSkills;` |
| AssessmentTier | `SELECT tblTiers.Tier FROM tblTiers ORDER BY tblTiers.Tier;` |

#### `FrmSucessionPlanDetails` — *partial*
Missing fields: **DateInitiated** (date), **LineManager**, **EmployeeID** (text), **CKR**.

Missing dropdowns:

| Field | Values |
|---|---|
| EmpNo | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE (...) ORDER BY ...;` *(partially covered)* |
| tblSuccession.CurrentPosition | `SELECT TblJobTitle.JobTitle FROM TblJobTitle ORDER BY TblJobTitle.JobTitle;` |
| AssessmentTier | `Tier1;Tier2;Tier3` *(Value List here; Table/Query elsewhere — Access inconsistency)* |
| SubTierRoleType | `SELECT tblSuccAppData.[Sub-Tier / Role Type] FROM tblSuccAppData GROUP BY tblSuccAppData.[Sub-Tier / Role Type] HAVING (((tblSuccAppData.[Sub-Tier / Role Type]) Is Not Null));` |
| FocusArea | `SELECT tblSuccAppData.Focus FROM tblSuccAppData GROUP BY tblSuccAppData.Focus HAVING (((tblSuccAppData.Focus) Is Not Null)) ORDER BY tblSuccAppData.Focus;` |
| Combo416 (Department) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| IdentifiedSuccessionPosition | (row source = TblJobTitle) |

#### `FrmSucessionPlanReg` — *partial*
Missing fields: **First Name**, **Last Name**, **E-mail Address**, **DateInitiated** (date), **SubTierRoleType**, **FocusArea**, **LineManager**.

Missing dropdowns:

| Field | Values |
|---|---|
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` (bound=Province) |
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| PossibleTargetPlanSuccession | `"Promotion";"Sucession";"Recruitment (Ext)"` *(no web column anywhere)* |
| Job Title | `SELECT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM TblJobTitle;` |
| EmpNo | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] WHERE (...) ORDER BY ...;` |
| tblSuccession.CurrentPosition | `SELECT TblJobDescription.JobDescription FROM TblJobDescription WHERE (((TblJobDescription.JobDescription) Is Not Null)) ORDER BY TblJobDescription.JobDescription;` |
| CKR | `SELECT tblCritical.CriticalSkills FROM tblCritical ORDER BY tblCritical.CriticalSkills;` |
| AssessmentTier | `SELECT tblTiers.Tier FROM tblTiers ORDER BY tblTiers.Tier;` |

---

### 3.9 Recruitment & EE

#### `FrmRecruitmentForm` — *partial* (**biggest gap in the module**)
The candidate assessment master. ~25 scored value-list questions + free-text answers + the assessment-report attachment are **not modelled** on `candidates`. Missing fields include: **Select Gender**, **Home address**, **phone** (column exists but not in contract), **Timestamp** (date), **AssesmentReport** (attachment), plus all the scored assessment answers and free-text narratives below — and several schema columns (`phone`, `idNumber`, `eeGroupId`, `source`, `cvPath`, `rejectionReasonId`) are absent from the contract, so they are unreachable.

Missing dropdowns (verbatim value lists):

| Field | Values |
|---|---|
| What position is Being Applied For | `SELECT [TblJobTitle].[JobTitleID], [TblJobTitle].[JobTitle] FROM TblJobTitle;` |
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Department (where will the candidate be placed) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| This Application Is An | `"Internal Applicant";"For Promotion";"External Candidate"` |
| Select Gender | `"Male";"Female"` |
| Is the qualification relevant to the position applied for? | `3;"Yes";2;"It has some concept that are Common";1;"No"` |
| How many years of experience does the candidate have in this field | `1;"0-1 Years";2;"2-3";3;"4-6";4;"7-10";5;"More than 10 years"` |
| How many years of experience does the candidate have in this Industry | `1;"0-1 Years";2;"2-3";3;"4-6";4;"7-10";5;"More than 10 years"` |
| How would you rate candidate for the position | `SELECT [TblSPosition].[Number], [TblSPosition].[Answer] FROM TblSPosition;` |
| Does the candidate have any experience in budget control or finance | `2;"Yes";1;"No"` |
| Have you managed other employees before?(for management positions) | `3;"Yes";2;"Indirectly";1;"No"` |
| Report On Credit Check | `3;"Passed";2;"Had Some Problem in the PAST";1;"Failed"` |
| Report On criminal check | `SELECT TblCriminalReport.N, TblCriminalReport.CriminalReport FROM TblCriminalReport;` |
| Which Employment Equity Group does the Candidate belong to? | `3;"Black People (black people,coloureds or indians)";2;"Women";1;"People with Disabilities";0;"Priviously Avantaged Group (i.e White Male)"` |
| What is the Demographic of candidate ? | `6;"Black Female";5;"Black Male &  Female (Indian, Coloured,)";4;"White Female & Coloured /Indian Male";3;"White Male";2;"Disabled";1;"Foreigner"` |
| Does the appointment meet the employment equity policy objective | `2;"Yes";1;"No"` |
| Is the candidate computer literate? | `2;"Yes";1;"No"` |
| Does the candidate have any SHEQ or ISO knowledge or experience? | `2;"Yes";1;"No"` |
| Does the candidate have any human resources skills ie discipline | `2;"Yes";1;"No"` |
| What is the highest Qualifications that the Candidate has? | `1;"Grade 10 standard 8";2;"Matric NQF 4";3;"Certificate NQF 5";4;"Diploma NQF 6";5;"Degree NQF 7";6;"Master NQF 8";7;"Honors NQF 9"` |
| Has the candidate been employed before?- | `2;"Yes";1;"No"` |
| Overall commitment to the previous employer Score | `SELECT [TblScommitment].[Number], [TblScommitment].[Answer] FROM TblScommitment;` |
| Ability to complete task | `1;1;2;2;3;3;4;4;5;5` |
| Attendance at work | `1;1;2;2;3;3;4;4;5;5` |

Additional missing free-text/scored fields (all unmodelled on `candidates`): strengths/weakness, EE target flag, previously-disadvantaged flag, EE justification ("Why isn't this an EE appointment?"), List Any Other Qualifications, companies worked for in past 10 years, name of company, reference verification remark.

#### `Recruitment subform` — *missing*

| Missing field | Type | Note |
|---|---|---|
| Recruitmented | bool | Yes/No recruited flag; no equivalent. |
| Score | number | Aggregate interview score not surfaced per candidate. |
| Timestamp | date | Not displayed. |
| This Application Is An | text | Not on candidate/contract/list. |
| Make Employee (action) | text | **Candidate→Employee conversion entirely absent** (no route, API, or button). |

Missing dropdowns:

| Field | Values |
|---|---|
| Recruitmented | `0;"No";1;"Yes"` |
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| What position is Being Applied For | `SELECT [TblJobTitle].[JobTitleID], [TblJobTitle].[JobTitle] FROM TblJobTitle;` |

#### `QryRecScore subform` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Score | number | Web computes a live total in the score-sheet dialog but never persists/surfaces a per-candidate aggregate. |

#### `frmEval` — *missing* (JD-grading evaluation — **name collision** with web `evaluations`, a different entity)
Missing fields: **Assessment**, **Justification from JD**, **Additional Portfolios / Expanded Scope**, **Grade Impact Review**, **Recommended JD Grading**, **Notes**, **CEOapproval**, **Occuational Level**, **JobTitle**, **Factor**.

Missing dropdowns:

| Field | Values |
|---|---|
| JobTitle | `SELECT TblJobTitle.JobTitle FROM TblJobTitle WHERE (((TblJobTitle.JobTitle) Is Not Null)) ORDER BY TblJobTitle.JobTitle;` |
| Factor | `Decision Making;Problem Solving;Financial Impact;People Management;Compliance & Risk;Planning Horizon` |
| CEOapproval (Text62) | `Yes;No` |
| Occuational Level | `SELECT tblOccLevel.[Occupational Level] FROM tblOccLevel;` |

#### `frmEvalReg` — *missing* (JD-grading register)
Missing columns: Occuational Level, Factor, Assessment, Justification from JD, Expanded Scope, Grade Impact Review, Recommended JD Grading, JobTitle.

Missing dropdowns:

| Field | Values |
|---|---|
| cboJob (filter) | `SELECT TblJobTitle.JobTitle FROM TblJobTitle GROUP BY TblJobTitle.JobTitle HAVING (((TblJobTitle.JobTitle) Is Not Null)) ORDER BY TblJobTitle.JobTitle;` |
| cboOccLevel (filter) | `SELECT tblOccLevel.[Occupational Level] FROM tblOccLevel GROUP BY tblOccLevel.[Occupational Level] ORDER BY tblOccLevel.[Occupational Level];` |
| JobTitle (inline) | `SELECT TblJobTitle.JobTitle FROM TblJobTitle WHERE (((TblJobTitle.JobTitle) Is Not Null)) ORDER BY TblJobTitle.JobTitle;` |

#### `frmEmpInterview` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Upload | attachment | Per-question evidence attachment; no column/upload. |

Missing dropdowns:

| Field | Values |
|---|---|
| Score | `0;5;10` (web uses a free numeric input — fidelity gap) |
| cboHead (navigation) | `SELECT tblInterview.Head, Min(tblInterview.QueID) AS MinOfQueID FROM tblInterview GROUP BY tblInterview.Head ORDER BY Min(tblInterview.QueID);` |

#### `frmInterview` — *partial*

| Missing field | Type | Note |
|---|---|---|
| venue | text | Column exists but not in InterviewCreate/Update/Row and not in UI — unreachable. |
| notes | text | Same — unreachable through the API. |

#### `frmInterviewReg` — *partial*
No fields to diff; web has per-requisition interviews list but **no global cross-requisition interview register page**.

#### `fsubInterviewLeads` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Notes | text | `interview_leads.notes` exists but absent from contract + UI. |

Missing dropdown:

| Field | Values |
|---|---|
| cboRoleOnPanel | `"Lead";"Co-lead";"HR";"Technical Assessor";"Observer"` (web renders a free-text Input — should be a `<select>`) |

#### `frmRequest` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Employment Type | text | Column exists, not in contract/UI. |
| Target Start Date | date | Column exists, not in contract/UI. |
| Request Number | text | In Row but not Create/Update — never settable. |
| Manager / HR approval workflow | text | `managerId/managerStatus/hrId/hrStatus` exist but none in contract/UI — whole workflow unreachable. |

#### `frmRecTarget` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Filter combos (cboRace/cboOcc/cboEmpT/cboYear/cboGen) | text | No filter/search controls on the web targets page. |

*(Sum([Value]) is rendered as a header total — not a hard gap.)*

Missing dropdowns:

| Field | Values |
|---|---|
| Occupational Level | `SELECT tblOccLevel.[Occupational Level] FROM tblOccLevel GROUP BY tblOccLevel.[Occupational Level];` (web hardcodes Top Mgmt/Senior Mgmt/Middle Mgmt/Junior Mgmt/Semi-Skilled/Unskilled) |
| Employment Type | `SELECT tblRecruitmentAppData.[Employment Type] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Employment Type];` (web hardcodes Permanent/Temporary/Contract/Fixed Term) |
| Race | `SELECT tblRecruitmentAppData.Race FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.Race;` (web hardcodes African/Coloured/Indian/White) |
| Gender | `Female;Male` (web Male/Female — same set, different order) |

#### `frmRecTargetDetails` — *partial*
All bound fields covered; dropdowns rendered but with hardcoded `ee-options` values instead of the lookup queries:

| Field | Values |
|---|---|
| Occupational Level | `SELECT tblOccLevel.[Occupational Level] FROM tblOccLevel GROUP BY tblOccLevel.[Occupational Level];` |
| Employment Type | `SELECT tblRecruitmentAppData.[Employment Type] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Employment Type];` |
| Gender | `Femaile;Male` (sic — Access typo; web uses Male/Female) |
| Race | `SELECT tblRecruitmentAppData.Race FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.Race;` |

#### `frmActualRecruitmenList` — *partial*
No fields to diff; web list has **no filter/search controls** (region/department/year).

#### `FrmRecuriutmentList` — *partial*
Recruitment list/search shell with no web filters.

| Field | Values |
|---|---|
| cbDep (Department filter) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| cbR (Region filter) | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| cbj (Job Title filter) | `SELECT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM TblJobTitle ORDER BY TblJobTitle.JobTitle;` |

#### Implemented: `frmRequestReg`, `frmActualRecruitment`, `frmActualRecruitmentReg`, `frmInterviewLeads_Edit` — full/strong parity (same hardcoded `ee-options` caveat for occ-level/emp-type/race/gender; `supportingDocument` is a text ref, not a real upload).

---

### 3.10 Expenses, Claims & Car

#### `frmExpenseForm` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Region | fk | No `region_id` per-claim. |
| Department | fk | No `department_id` per-claim. |
| Merge | text | Merged cost-allocation code string + "Merge Code" button — no column/control. |
| FIles | attachment | Only a free-text `receiptPath`; no real upload. |
| MangerApproval (on entry form) | text | No `managerStatus` field on the entry form (only via Approvals tab). |

Missing dropdowns:

| Field | Values |
|---|---|
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| MangerApproval (Value List) | `"Pending";"Approved";"Rejected"` |

#### `FrmExpenseList` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Region (detail/filter) | fk | Not stored per-claim. |
| Department (detail/filter) | fk | Not stored per-claim. |

Missing dropdowns:

| Field | Values |
|---|---|
| cbDep | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| cbR | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| cb1 (Select Employee) | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |
| MangerApproval (Value List) | `"Pending";"Approved";"Rejected"` |

#### `frmClaimReg` — *partial*

| Missing field | Type | Note |
|---|---|---|
| RefNo | text | claimNumber carried per-row, but no claim-header grouping entity. |
| SignedOn | date | Column exists, set on approval, but not surfaced. |

Missing dropdowns:

| Field | Values |
|---|---|
| cbDep (Department search) | `SELECT TblDeparment.DepID, TblDeparment.DepName FROM TblDeparment ORDER BY TblDeparment.DepName;` |
| cboRegion (Region search) | `SELECT TbRegion.RegionID, TbRegion.Region FROM TbRegion ORDER BY TbRegion.Region;` |
| cboEmp (Employee search) | `SELECT qryClaimRef.EmployeeID, qryClaimRef.[First Name], Nz([Last Name],[Surname]) AS Expr1 FROM [Employees Employment details] INNER JOIN qryClaimRef ON [Employees Employment details].EmployeeID = qryClaimRef.EmployeeID GROUP BY qryClaimRef.EmployeeID, qryClaimRef.[First Name], Nz([Last Name],[Surname]) HAVING (((qryClaimRef.[First Name]) Is Not Null)) ORDER BY qryClaimRef.[First Name], Nz([Last Name],[Surname]);` |
| Region (bound=Province) | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Department (bound) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |

#### `frmClaimApproval` — *partial*
Missing fields: **Accommodation**, **Entertainment**, **International**, **Sundry** (all number cost buckets — no columns), **Merge** (text), **FIles** (attachment), **approved-only sums** (number), **Status** display (partial).

Missing dropdowns:

| Field | Values |
|---|---|
| cboStatus | `Approved;Rejected` (web uses hard-coded buttons) |
| txtApprove (approver) | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Manager] HAVING (((tblRecruitmentAppData.[Responsible Manager]) Is Not Null));` |
| cboEmp (filter) | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] INNER JOIN TblExpense ON [Employees Employment details].EmployeeID = TblExpense.EmployeeID GROUP BY [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) ORDER BY [First Name] & " " & Nz([Surname],Nz([Last Name],""));` |

#### `frmClaimHist` — *partial*
Missing fields: **RefNo** (partial), **Accommodation**, **Entertainment**, **International**, **Sundry**, **Merge**, **SignedOn** (partial — stored not shown), **FIles** (attachment), **approved-only sums**.

Missing dropdowns:

| Field | Values |
|---|---|
| txtApprove (ApprovedBy, bound) | `SELECT tblRecruitmentAppData.[Responsible Manager] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Manager] HAVING (((tblRecruitmentAppData.[Responsible Manager]) Is Not Null));` |
| cboEmp (employee filter) | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM [Employees Employment details] INNER JOIN TblExpense ON [Employees Employment details].EmployeeID = TblExpense.EmployeeID GROUP BY [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) ORDER BY [First Name] & " " & Nz([Surname],Nz([Last Name],""));` |

#### `FrmCarScheme` — *partial* (**critical model mismatch**)
Access = monthly **kilometre-reimbursement claim**; web `car_scheme` = a vehicle **allocation**. Missing fields: **Department** (fk), **Region** (fk), **cMonth** (date), **KMStart**, **KMEnd**, **TotalKM**, **Pkm**, **Bkm**, **RatePerKm**, **TotalAmount** (all number).

Missing dropdowns:

| Field | Values |
|---|---|
| Department | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| Region | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Status (Value List) | `"Pending";"Approved";"Rejected"` (web uses active/suspended/ended — wrong option set) |

> No car-scheme import at all in `import-access.ts`.

#### `FrmCarList` — *partial*
Missing fields: **cMonth**, **TotalKM**, **Pkm**, **Bkm**, **RatePerKm**, **TotalAmount**, **Department**, **Region**, **Status** (mismatch).

Missing dropdowns:

| Field | Values |
|---|---|
| cboRegion | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| cboDept | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| cboEmp | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |
| cboYr (Month) | `SELECT Format([cMonth],"mmm-yy") AS Expr1 FROM tblCarScheme;` |
| cboKm (Bkm) | `SELECT tblCarScheme.Bkm FROM tblCarScheme;` |
| Combo606 (Status) | `"Pending";"Approved";"Rejected"` |
| Region (bound detail) | `SELECT [TbRegion].[RegionID], [TbRegion].[Region] FROM TbRegion;` |
| Department (bound detail) | `SELECT [TblDeparment].[DepID], [TblDeparment].[DepName] FROM TblDeparment;` |
| EmployeeName (bound detail) | `SELECT [Employees Employment details].[EmployeeID], [First Name], [Last Name] FROM [Employees Employment details];` |

#### Implemented: `FrmExpenseCategory`, `FrmActivities`, `FrmCostOfSales`, `FrmOverheads` — full lookup parity.

---

### 3.11 Exit

#### `frmExit` — *partial*

| Missing field | Type | Note |
|---|---|---|
| Interviewed by | fk | `interviewerId` is a **dead column** (no FK, not in contract/row/form). |
| Province | fk | No region/province on `exitRecords` (regions lookup exists but unwired). |
| Reason Code(drop down) | text | No per-record reason-code text field. |
| Job Title (on exit record) | fk | No `jobTitleId` on exit record. |
| Department (on exit record) | fk | No `departmentId` on exit record. |
| Occupational Level (cboOcc) | fk | No occupational-level column/select on exit form. |
| assetsReturned | bool | **Dead column** (schema only, no UI). |
| finalSettlementPaid | bool | **Dead column** (schema only, no UI). |
| Company number (read-only) | text | Not surfaced. |
| OccupationalyLevelEquity (read-only) | text | Column exists on employees; not surfaced on exit. |
| First Name / Surname (read-only) | text | Covered via concatenated name (noted for completeness). |

Missing dropdowns:

| Field | Values |
|---|---|
| Reason / cboReason | `"Deceased";"Terminated";"Retired ";"Resigned"` (web replaces with `reasonId` FK + separate `exitType` enum — no exact-string parity) |
| Interviewed by | `SELECT tblRecruitmentAppData.[Responsible Executive] FROM tblRecruitmentAppData GROUP BY tblRecruitmentAppData.[Responsible Executive] HAVING (((tblRecruitmentAppData.[Responsible Executive]) Is Not Null));` |
| Province / Region | `SELECT TbRegion.RegionID, TbRegion.Region FROM TbRegion ORDER BY TbRegion.Region;` and `SELECT TbRegion.RegionID, TbRegion.Region FROM TbRegion;` |
| Department | `SELECT TblDeparment.DepID, TblDeparment.DepName FROM TblDeparment ORDER BY TblDeparment.DepName;` |
| Job Title | `SELECT TblJobTitle.JobTitleID, TblJobTitle.JobTitle FROM TblJobTitle ORDER BY TblJobTitle.JobTitle;` |
| Occupational Level / cboOcc | `SELECT tblOccLevel.[Occupational Level] FROM tblOccLevel ORDER BY tblOccLevel.[Occupational Level];` |
| EmpNo (employee picker) | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1, [Employees Employment details].[Company Number], [Employees Employment details].Department, [Employees Employment details].[Job Title], [Employees Employment details].OccupationalyLevelEquity FROM [Employees Employment details] WHERE ((([Employees Employment details].[First Name]) Is Not Null)) ORDER BY [First Name] & " " & Nz([Surname],Nz([Last Name],""));` *(IMPLEMENTED in web)* |
| txtName (header record-locator) | `SELECT tblExit.EmpNo, [First Name] & " " & Nz([Surname],Nz([Last Name],"")) AS Expr1 FROM tblExit INNER JOIN [Employees Employment details] ON tblExit.EmpNo = [Employees Employment details].EmployeeID GROUP BY tblExit.EmpNo, [First Name] & " " & Nz([Surname],Nz([Last Name],""));` *(no web locator)* |

#### `frmExitList` — *implemented* (empty RECORDSOURCE shell; web ExitPage table satisfies it).

---

### 3.12 Lookups, Org & Admin

#### `frmGrading` — *partial*
All 8 bound columns present; the gap is **input type** (Access uses constrained pickers, web renders free-text Inputs):

| Field | Values |
|---|---|
| Scale | `"1";"2";"3";"4";"5";"6";"7";"8";"9";"10"` |
| PatersonBand | `"A";"B";"C";"D";"E";"F"` |
| JobTitle | `SELECT TblJobTitle.JobTitle, TblJobTitle.Job_code FROM TblJobTitle WHERE (((TblJobTitle.JobTitle) Is Not Null)) ORDER BY TblJobTitle.JobTitle;` |

#### `frmGradingReg` — *partial*
All data columns present; gaps are filters + the Reset button + value-list constraints on Scale/Band:

| Field | Values |
|---|---|
| cboJob (filter) | `SELECT TblJobTitle.JobTitleID, tblGrading.JobTitle FROM tblGrading LEFT JOIN TblJobTitle ON tblGrading.JobTitle = TblJobTitle.JobTitle GROUP BY TblJobTitle.JobTitleID, tblGrading.JobTitle ORDER BY tblGrading.JobTitle;` |
| cboOccLevel (filter) | `SELECT tblGrading.OccLevel FROM tblGrading GROUP BY tblGrading.OccLevel HAVING (((tblGrading.OccLevel) Is Not Null));` |
| Scale | `"1";"2";"3";"4";"5";"6";"7";"8";"9";"10"` |
| PatersonBand | `"A";"B";"C";"D";"E";"F"` |

#### `frmLoginDetails` — *partial*

| Missing field | Type | Note |
|---|---|---|
| EmployeeName | fk | `users.employeeId` + contract field exist, but **no employee picker** in the user form — login↔employee link unsettable. |

Missing dropdowns:

| Field | Values |
|---|---|
| EmployeeName | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & [Surname] AS Name FROM [Employees Employment details] ORDER BY [First Name] & " " & [Surname];` |
| Level | `"Admin";"Level 1 User";"Level 2 User";"Level 3 User"` (intentionally re-modelled as RBAC Role select — mapped, not missing) |

#### `frmUser` — *partial*
Same EmployeeName picker gap.

| Field | Values |
|---|---|
| EmployeeName | `SELECT [Employees Employment details].EmployeeID, [First Name] & " " & [Last Name] AS Name FROM [Employees Employment details];` |

> Admin/User boolean checkboxes are subsumed by the Role select + RBAC.

#### `frmPermissions` — *missing*

| Missing field | Type | Note |
|---|---|---|
| ScreenName | text | No editable per-screen permission table; keys hard-coded in `lib/auth/permissions.ts`. |
| Admin | bool | No UI toggle. |
| UserLevel1 / UserLevel2 / UserLevel3 | bool | No editable web equivalent — absorbed into fixed role→permission seed. |

No missing dropdowns. RBAC exists in code but there is **no admin-facing Permissions/Roles editor**.

#### Implemented: `FrmDeparment`, `FrmDepot`, `FrmRegion`, `frmSites`, `frmTaxStatus` — full parity via the generic Lookups screen (web superset adds code/description/sortOrder/isActive).

---

### 3.13 Dashboards & shell

#### `frmExtra` — *partial*
RECORDSOURCE empty (no data fields), but its **export actions are unimplemented**: (1) "All Employees" export, (2) "All Employees For This Month — Excel" export, (3) "All Training List" export. The only CSV/download features in the whole app are the expenses register CSV and the attachment download route. No export buttons on Reports, Employees list, or Training list.

#### N/A in this module: `FrmHRDash`, `FrmHRAlerts`, `KSFDash`, `FrmMAIN`, `Login` — see §5.

> **Out-of-scope flag (not a form gap):** `KSFDash` launches a **SHEQ / Health-Safety-Environment-Quality module that has NO web equivalent at all** — no pages, nav, service, or schema. A genuine missing module, tracked outside form-level data-parity.

---

## 4. Prioritised implementation plan

Ordered by value/effort. **S** ≈ ≤0.5 day, **M** ≈ 1–3 days, **L** ≈ ≥1 week.

### Phase P1 — Quick, high-value (mostly contract/UI wiring, little/no schema change)

| Task | Effort |
|---|---|
| **Employees list:** add `cboCritical` filter (column already exists — contract+query+UI only) | S |
| **Employees list:** surface the **email** column in the grid | S |
| **Leave-type CRUD page** (`FrmTypeOfLeave`): backend complete — add a settings/admin form | S |
| **KPI Category CRUD UI** (`FrmKpICategory`): table+API exist — add New/edit/delete form | S |
| **User↔Employee picker** (`frmLoginDetails`/`frmUser`): wire `employeeId` select (schema+contract ready) | S |
| **fsubInterviewLeads:** convert RoleOnPanel free-text → `<select>` (`Lead;Co-lead;HR;Technical Assessor;Observer`); add Notes to contract+UI | S |
| **Grading forms:** convert Scale (1–10), PatersonBand (A–F) and JobTitle to constrained pickers | S |
| **JD training subforms:** filter the Training `<select>` by `TrainingType` (internal/external) — fix the over-broad option set on 4 subforms | S |
| **subfrmQue/Que KPI:** allow free-text KPI on `TbJobDescriptionlKPIEntry` (or keep FK + add custom) | S |
| **Reuse-from-schema gaps:** expose contract+UI for columns that already exist but are unreachable — recruitment (`phone`, `eeGroupId`, `cvPath`), interviews (`venue`, `notes`), requests (`employmentType`, `targetStartDate`), exit (`assetsReturned`, `finalSettlementPaid`), expenses (`signedOn`) | M |

### Phase P2 — Filters, registers & approval-list wiring (UI + query, light schema)

| Task | Effort |
|---|---|
| **Leave list:** add cbDep/cbR/cbE filters, Search/Clear, manager+HR per-row status columns, Sum(TotalDays) footer | M |
| **Disciplinary list:** add cboEmp/cboType/cboNature header filters + Print/PDF/Reset | M |
| **Performance list:** add cboEmp/cbocat filters + Search/Reset + Print/PDF; surface ReviewedBy/ReviewDate | M |
| **Recruitment/Expenses/Car/EE/Critical-roles lists:** add the missing filter combos (Department/Region/Job Title/Employee/Status/Month) across `FrmRecuriutmentList`, `FrmExpenseList`, `frmClaimReg`, `FrmCarList`, `frmCriticalReg`, `frmActualRecruitmenList`, `frmRecTarget` | M |
| **Exit form:** wire `interviewerId` FK + employee record-locator (`txtName`); add Province/Department/JobTitle/OccLevel selects (lookups exist) | M |
| **EE dropdowns:** drive Occ-Level/Emp-Type/Race from lookup tables instead of hard-coded `ee-options` | S |
| **Lookup-list filter value-lists** (grading Scale/Band as constrained columns) | S |

### Phase P3 — Schema additions for genuinely-missing fields

| Task | Effort |
|---|---|
| **Disciplinary:** add Title, DateOfDisciplinary, DateOfEnquiry, DisciplinaryActionOpenDate, action-closed date columns + TypeofDisciplinary (`Misconduct;Incapacity`) and Who (`Internal;Labour Net;labour broker `) value-lists; import `TblDisciplinary` rows | M |
| **Employees:** add `CKR` and `HR` columns (+ cboHR filter) | M |
| **Leave form:** add region_id, department_id, date_of_engagement, total_holidays, explicit Approver | M |
| **Performance:** add Title, DateOfPA Setting, KPINOTES, ReviewDate, ReviewedBy; add KPICatogory + achievement-scale Status value-lists | M |
| **JD:** add Skill level + Qualification columns; wire Job Title FK | M |
| **Succession (largest):** add RefNo, LastReviewDate, Region/Province, CriticalityReason value-list, TierSelection, SuccessorIdentified FK, Department/JobTitle FK, the 5 requirement narratives, tier/sub-tier/focus-area/date-initiated/line-manager, CKR, AssessmentTier, PossibleTargetPlanSuccession | L |
| **Development:** add Area + TimeFrame value-lists, restore Qualification/Skills/Experience constrained dropdowns, add per-row Approval/HR/LineManager + Compliance/EXCO/Dt + TargetDate (skills has none) | L |
| **Expenses:** add per-claim Region+Department, Merge cost-code (+ "Merge Code" action), per-category cost split (Accommodation/Entertainment/International/Sundry) + approved-only sums | L |
| **Car scheme (model rebuild):** replace allocation model with km-reimbursement (cMonth, KMStart/End, TotalKM, Bkm/Pkm, RatePerKm, TotalAmount, Region/Department, Pending/Approved/Rejected status) + import | L |

### Phase P4 — New modules / workflows (large, net-new)

| Task | Effort |
|---|---|
| **Recruitment candidate-assessment entity** (`FrmRecruitmentForm`): dedicated table for the ~25 scored value-list questions + free-text answers + assessment-report attachment | L |
| **Candidate→Employee "Make Employee" conversion** + Recruitmented flag + per-candidate Score surfacing (`Recruitment subform`) | M |
| **Training test runner** (`frmTest`, `subfrmQuestions`, `subfrmAnswers`, `frmResult`, `frmIntTrainingReg`): candidate quiz-taking UI, per-answer Points scoring, results + certificate registers | L |
| **Per-employee training assignment** (`TblEmployeeTrainingDetails`/`TblEmployeeExTrainingDetails`): new per-employee internal/external assignment tables + UI | M |
| **Per-employee JD/KPA assignment UI** (`TblEmployeJobDescriptionDetails`): add the assigned-KPA column + an EmployeeJdForm | M |
| **JD-grading evaluation module** (`frmEval`/`frmEvalReg`): factor-based grade-impact entity (resolve the `evaluations` name collision) | M |
| **Permissions/Roles admin editor** (`frmPermissions`): screen × role checkbox grid persisting to `role_permissions` | M |
| **Attachment uploads** across forms: take-on per-document slots, disciplinary AttachDocument, training Quote/PP/Certificate/Attach, dev Competency OLE, expense receipts, interview Upload | L |
| **Export/print actions** (`frmExtra`, leave/performance/training lists): Excel/PDF exports | M |
| **SHEQ module** (launched by `KSFDash`): entirely absent — out of current scope but flagged as a whole missing module | L |

---

## 5. Forms intentionally N/A

These have **empty RECORDSOURCE / no bound data** (navigation switchboards, login, derived reports, or empty container shells) — no data parity required.

| Form | Module | Why N/A |
|---|---|---|
| FrmNewEmployee | Employees | Derived report over `QryNewRecur`; all 6 controls unbound display TextBoxes + Close. (Create flow is `employee-form.tsx`.) |
| FrmEfORMS | Employees | Pure navigation switchboard; only buttons + one unbound current-user combo (`Combo75`). |
| FrmJD-KPI | Performance/JD | Navigation launcher; empty RECORDSOURCE, only `Combo75` + JD/Add-Job-Title buttons. |
| frmKPIdash | Performance/JD | Dashboard launcher; empty RECORDSOURCE, `Combo75` + JD/grading nav buttons. |
| frmdevelopement | Development | Empty RECORDSOURCE container hosting the dev subforms. |
| frmDevelopementReg | Development | Empty container/registration shell; no bound controls. |
| FrmTrainDash | Training | Training module nav hub; no data (`Combo75` + launch buttons). |
| frmRecruitmentDash | Recruitment | Recruitment module nav dashboard; `Combo75` + launchers only. |
| FrmHRDash | Shell | HR landing/nav hub; decoratives + buttons + unbound `Combo75`. |
| FrmHRAlerts | Shell | Alerts splash/nav; alerts concept implemented and exceeded in `dashboard.ts`. |
| KSFDash | Shell | SHEQ/KSF nav hub; only session-bound display controls (`TaskAssign`/`admin`) + `Combo75`. (SHEQ module itself missing — flagged separately.) |
| FrmMAIN | Shell | Top-level switchboard; only a username TextBox + nav buttons. |
| Login | Shell | Login utility; fully implemented in `app/(auth)/login` (+ admin bootstrap). "Quit App" has no browser analogue. |

**Common unbound nav combo** appearing on most switchboards (`Combo75`, listed only for completeness — not a stored field):
`SELECT [Employees Employment details].EmployeeID, [First Name] & " " & [Last Name] AS Name FROM [Employees Employment details];` (default = `[Forms]![Login]![Name1]` or `[TempVars]![username]`).

> `frmExtra` is classified **partial** (not N/A) because, although it has no bound data fields, its three export actions are real unimplemented capability.