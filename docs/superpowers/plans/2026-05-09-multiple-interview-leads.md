# Multiple Interview Leads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `frmInterviewReg` in `Database_2ndCopy.accdb` so one interview register row can have multiple interview leads.

**Architecture:** Keep `tblMainSHeetInterview` as the master interview register table and add a normalized child table, `tblInterviewLeads`, with one row per lead per interview. Replace the single bound `Interviewer Lead` UI with a read-only summary plus an edit popup that manages child rows through a linked continuous subform.

**Tech Stack:** Microsoft Access ACCDB, DAO/ACE SQL, Access forms, Access VBA module, Windows VBScript automation, PowerShell for backup and verification orchestration.

---

## Current Context

- Database path: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`
- Main form: `frmInterviewReg`
- Main form record source: `tblMainSHeetInterview`
- Current single-value field: `tblMainSHeetInterview.[Interviewer Lead]`
- Main interview primary key: `tblMainSHeetInterview.EMPID`
- Employee source table: `[Employees Employment details]`
- Employee primary key: `[Employees Employment details].EmployeeID`
- Current form control: `Interviewer Lead`, a combo/list-style control bound to `[Interviewer Lead]`
- Existing failed attempt: `_apply_panel.vbs` aborted during VBA module validation, so implementation should use a new script and should be idempotent.

## File and Object Map

- Create: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_verify_multi_interview_leads.vbs`
  - Verifies schema, query, module function, form controls, and a reversible temporary insert.
- Create: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs`
  - Applies Access schema, query, module, form, and popup changes.
- Modify: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`
  - Add table `tblInterviewLeads`
  - Add query `qryInterviewLeads`
  - Add module `mdlInterviewPanel`
  - Add form `fsubInterviewLeads`
  - Add form `frmInterviewLeads_Edit`
  - Modify form `frmInterviewReg`
- Leave unchanged for compatibility: `tblMainSHeetInterview.[Interviewer Lead]`

---

### Task 1: Safety Baseline

**Files:**
- Read: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`
- Create: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.backup_<timestamp>_pre_multi_leads.accdb`

- [ ] **Step 1: Confirm Access is closed**

Run:

```powershell
Get-Process MSACCESS -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence" -Filter "Database_2ndCopy.laccdb" -Force
```

Expected: no `MSACCESS` process using this database and no active `Database_2ndCopy.laccdb` lock file. If a lock exists, close Access before continuing.

- [ ] **Step 2: Create a timestamped backup**

Run:

```powershell
$dir = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence"
$src = Join-Path $dir "Database_2ndCopy.accdb"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $dir "Database_2ndCopy.backup_${stamp}_pre_multi_leads.accdb"
Copy-Item -LiteralPath $src -Destination $backup
Get-Item -LiteralPath $backup | Format-List FullName,Length,LastWriteTime
```

Expected: backup file exists and has the same byte length as `Database_2ndCopy.accdb`.

- [ ] **Step 3: Export the current main form**

Run:

```powershell
$vbs = @'
Option Explicit
Dim app, dbPath, outPath
dbPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
outPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_frmInterviewReg_before_multi_leads.txt"
Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
app.SaveAsText 2, "frmInterviewReg", outPath
app.CloseCurrentDatabase
app.Quit 2
WScript.Echo "Wrote " & outPath
'@
$tmp = Join-Path $env:TEMP "export_frmInterviewReg_before_multi_leads.vbs"
Set-Content -LiteralPath $tmp -Value $vbs -Encoding ASCII
cscript //nologo $tmp
```

Expected: `_frmInterviewReg_before_multi_leads.txt` is created for rollback/debug comparison.

---

### Task 2: Write the Verification Script First

**Files:**
- Create: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_verify_multi_interview_leads.vbs`

- [ ] **Step 1: Add the verification script**

Create `_verify_multi_interview_leads.vbs` with this content:

```vbscript
Option Explicit

Dim app, db, rs, dbPath, failures
dbPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
failures = 0

Sub Check(condition, message)
    If condition Then
        WScript.Echo "[OK] " & message
    Else
        WScript.Echo "[FAIL] " & message
        failures = failures + 1
    End If
End Sub

Function TableExists(tableName)
    On Error Resume Next
    Dim t
    Set t = db.TableDefs(tableName)
    TableExists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Function QueryExists(queryName)
    On Error Resume Next
    Dim q
    Set q = db.QueryDefs(queryName)
    QueryExists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Function FieldExists(tableName, fieldName)
    On Error Resume Next
    Dim f
    Set f = db.TableDefs(tableName).Fields(fieldName)
    FieldExists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Function FormExists(formName)
    On Error Resume Next
    app.DoCmd.OpenForm formName, 1, , , 1, 3
    FormExists = (Err.Number = 0)
    If FormExists Then app.DoCmd.Close 2, formName, 2
    Err.Clear
    On Error GoTo 0
End Function

Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
Set db = app.CurrentDb

Check TableExists("tblInterviewLeads"), "tblInterviewLeads table exists"
Check FieldExists("tblInterviewLeads", "InterviewLeadID"), "tblInterviewLeads.InterviewLeadID exists"
Check FieldExists("tblInterviewLeads", "InterviewID"), "tblInterviewLeads.InterviewID exists"
Check FieldExists("tblInterviewLeads", "EmployeeID"), "tblInterviewLeads.EmployeeID exists"
Check FieldExists("tblInterviewLeads", "RoleOnPanel"), "tblInterviewLeads.RoleOnPanel exists"
Check FieldExists("tblInterviewLeads", "IsPrimary"), "tblInterviewLeads.IsPrimary exists"
Check FieldExists("tblInterviewLeads", "Notes"), "tblInterviewLeads.Notes exists"
Check FieldExists("tblInterviewLeads", "CreatedAt"), "tblInterviewLeads.CreatedAt exists"
Check QueryExists("qryInterviewLeads"), "qryInterviewLeads query exists"
Check FormExists("fsubInterviewLeads"), "fsubInterviewLeads form exists"
Check FormExists("frmInterviewLeads_Edit"), "frmInterviewLeads_Edit form exists"

On Error Resume Next
Dim panelTest
panelTest = app.Run("GetInterviewLeads", Null)
Check Err.Number = 0, "GetInterviewLeads function is callable"
Err.Clear
On Error GoTo 0

On Error Resume Next
app.DoCmd.OpenForm "frmInterviewReg", 1, , , 1, 3
Check Err.Number = 0, "frmInterviewReg opens in design view"
If Err.Number = 0 Then
    Check app.Forms("frmInterviewReg").Controls("txtInterviewerLeads").ControlSource = "=GetInterviewLeads([EMPID])", "frmInterviewReg has summary textbox"
    Check app.Forms("frmInterviewReg").Controls("cmdEditPanel").OnClick = "[Event Procedure]", "frmInterviewReg has edit button handler"
    app.DoCmd.Close 2, "frmInterviewReg", 2
End If
Err.Clear
On Error GoTo 0

On Error Resume Next
Dim interviewId, employeeId, summary
Set rs = db.OpenRecordset("SELECT TOP 1 EMPID FROM tblMainSHeetInterview WHERE EMPID Is Not Null", 4)
If Not rs.EOF Then interviewId = rs.Fields(0).Value
rs.Close
Set rs = db.OpenRecordset("SELECT TOP 1 EmployeeID FROM [Employees Employment details] WHERE EmployeeID Is Not Null", 4)
If Not rs.EOF Then employeeId = rs.Fields(0).Value
rs.Close

If Not IsEmpty(interviewId) And Not IsEmpty(employeeId) Then
    db.Execute "DELETE FROM tblInterviewLeads WHERE Notes='__VERIFY_MULTI_LEADS__'", 128
    db.Execute "INSERT INTO tblInterviewLeads (InterviewID, EmployeeID, RoleOnPanel, IsPrimary, Notes) VALUES (" & CLng(interviewId) & ", " & CLng(employeeId) & ", 'Lead', True, '__VERIFY_MULTI_LEADS__')", 128
    summary = app.Run("GetInterviewLeads", CLng(interviewId))
    Check Len(summary & "") > 0, "GetInterviewLeads returns a non-empty summary after test insert"
    db.Execute "DELETE FROM tblInterviewLeads WHERE Notes='__VERIFY_MULTI_LEADS__'", 128
Else
    Check False, "Verification found at least one interview and one employee row"
End If
If Err.Number <> 0 Then
    WScript.Echo "[FAIL] reversible insert/function check: " & Err.Description
    failures = failures + 1
    Err.Clear
End If
On Error GoTo 0

app.CloseCurrentDatabase
app.Quit 2

If failures > 0 Then
    WScript.Echo "FAILED checks: " & failures
    WScript.Quit 1
End If

WScript.Echo "All multi-interview-lead checks passed."
```

- [ ] **Step 2: Run the verification script before implementation**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_verify_multi_interview_leads.vbs"
```

Expected before implementation: FAIL because `tblInterviewLeads`, `qryInterviewLeads`, and new forms do not exist yet. This confirms the script catches the missing feature.

---

### Task 3: Create the Implementation Script Skeleton and Schema

**Files:**
- Create: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs`
- Modify: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`

- [ ] **Step 1: Start the implementation script with helpers**

Create `_implement_multi_interview_leads.vbs` with this opening:

```vbscript
Option Explicit

Const acForm = 2
Const acModule = 5
Const acDesign = 1
Const acSaveYes = 1
Const acSaveNo = 2
Const dbFailOnError = 128

Dim app, db, dbPath, logPath, fso, logFile
dbPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
logPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.log"

Set fso = CreateObject("Scripting.FileSystemObject")
Set logFile = fso.CreateTextFile(logPath, True)

Sub Log(message)
    logFile.WriteLine message
    WScript.Echo message
End Sub

Sub ExecuteSql(sqlText)
    Log "[SQL] " & sqlText
    db.Execute sqlText, dbFailOnError
End Sub

Function TableExists(tableName)
    On Error Resume Next
    Dim t
    Set t = db.TableDefs(tableName)
    TableExists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Function QueryExists(queryName)
    On Error Resume Next
    Dim q
    Set q = db.QueryDefs(queryName)
    QueryExists = (Err.Number = 0)
    Err.Clear
    On Error GoTo 0
End Function

Sub DropFormIfExists(formName)
    On Error Resume Next
    app.DoCmd.DeleteObject acForm, formName
    Err.Clear
    On Error GoTo 0
End Sub

Sub DropModuleIfExists(moduleName)
    On Error Resume Next
    app.DoCmd.DeleteObject acModule, moduleName
    Err.Clear
    On Error GoTo 0
End Sub

Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
Set db = app.CurrentDb
Log "Opened " & dbPath
```

- [ ] **Step 2: Add the normalized child table**

Append this schema block:

```vbscript
If Not TableExists("tblInterviewLeads") Then
    ExecuteSql "CREATE TABLE tblInterviewLeads (" & _
        "InterviewLeadID COUNTER CONSTRAINT pk_tblInterviewLeads PRIMARY KEY, " & _
        "InterviewID LONG NOT NULL, " & _
        "EmployeeID LONG NOT NULL, " & _
        "RoleOnPanel TEXT(100), " & _
        "IsPrimary YESNO, " & _
        "Notes LONGTEXT, " & _
        "CreatedAt DATETIME)"
    ExecuteSql "CREATE UNIQUE INDEX ux_tblInterviewLeads_Interview_Employee ON tblInterviewLeads (InterviewID, EmployeeID)"
    ExecuteSql "CREATE INDEX ix_tblInterviewLeads_InterviewID ON tblInterviewLeads (InterviewID)"
    ExecuteSql "CREATE INDEX ix_tblInterviewLeads_EmployeeID ON tblInterviewLeads (EmployeeID)"
    ExecuteSql "ALTER TABLE tblInterviewLeads ALTER COLUMN CreatedAt DATETIME DEFAULT Now()"
    Log "[OK] Created tblInterviewLeads"
Else
    Log "[INFO] tblInterviewLeads already exists"
End If
```

- [ ] **Step 3: Add relationships where Access accepts them**

Append this relationship block:

```vbscript
On Error Resume Next
ExecuteSql "ALTER TABLE tblInterviewLeads ADD CONSTRAINT fk_tblInterviewLeads_Interview FOREIGN KEY (InterviewID) REFERENCES tblMainSHeetInterview (EMPID)"
If Err.Number <> 0 Then
    Log "[WARN] Could not add interview FK: " & Err.Description
    Err.Clear
End If
ExecuteSql "ALTER TABLE tblInterviewLeads ADD CONSTRAINT fk_tblInterviewLeads_Employee FOREIGN KEY (EmployeeID) REFERENCES [Employees Employment details] (EmployeeID)"
If Err.Number <> 0 Then
    Log "[WARN] Could not add employee FK: " & Err.Description
    Err.Clear
End If
On Error GoTo 0
```

- [ ] **Step 4: Run schema portion once**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs"
```

Expected at this intermediate point: script opens the database and creates `tblInterviewLeads`, then may stop because later query/form blocks are not appended yet. If it stops only because the script reaches EOF, continue to Task 4.

---

### Task 4: Add Query and VBA Summary Function

**Files:**
- Modify: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs`
- Modify Access object: `qryInterviewLeads`
- Modify Access object: `mdlInterviewPanel`

- [ ] **Step 1: Append query creation**

Append this block after the schema block:

```vbscript
Dim qdf, querySql
If QueryExists("qryInterviewLeads") Then
    db.QueryDefs.Delete "qryInterviewLeads"
End If

querySql = _
    "SELECT L.InterviewLeadID, L.InterviewID, L.EmployeeID, " & _
    "Trim(Nz(E.[First Name],'') & ' ' & Nz(E.Surname,'')) AS LeadName, " & _
    "L.RoleOnPanel, L.IsPrimary, L.Notes, L.CreatedAt " & _
    "FROM tblInterviewLeads AS L " & _
    "LEFT JOIN [Employees Employment details] AS E ON L.EmployeeID = E.EmployeeID;"

Set qdf = db.CreateQueryDef("qryInterviewLeads", querySql)
Log "[OK] Created qryInterviewLeads"
```

- [ ] **Step 2: Append VBA module creation**

Append this block:

```vbscript
DropModuleIfExists "mdlInterviewPanel"

Dim vbProj, vbComp, codeText
Set vbProj = app.VBE.VBProjects(1)
Set vbComp = vbProj.VBComponents.Add(1)
vbComp.Name = "mdlInterviewPanel"

codeText = _
"Option Compare Database" & vbCrLf & _
"Option Explicit" & vbCrLf & _
"" & vbCrLf & _
"Public Function GetInterviewLeads(ByVal pID As Variant) As String" & vbCrLf & _
"    On Error GoTo CleanFail" & vbCrLf & _
"    Dim rs As DAO.Recordset" & vbCrLf & _
"    Dim s As String" & vbCrLf & _
"    Dim sep As String" & vbCrLf & _
"    Dim roleText As String" & vbCrLf & _
"    If IsNull(pID) Or Len(pID & vbNullString) = 0 Then Exit Function" & vbCrLf & _
"    Set rs = CurrentDb.OpenRecordset(""SELECT LeadName, RoleOnPanel, IsPrimary FROM qryInterviewLeads WHERE InterviewID="" & CLng(pID) & "" ORDER BY IsPrimary DESC, LeadName"", dbOpenSnapshot)" & vbCrLf & _
"    Do Until rs.EOF" & vbCrLf & _
"        s = s & sep & Nz(rs!LeadName, """")" & vbCrLf & _
"        roleText = Nz(rs!RoleOnPanel, """")" & vbCrLf & _
"        If Nz(rs!IsPrimary, False) Then" & vbCrLf & _
"            s = s & "" *""" & vbCrLf & _
"        ElseIf Len(roleText) > 0 Then" & vbCrLf & _
"            s = s & "" ("" & roleText & "")""" & vbCrLf & _
"        End If" & vbCrLf & _
"        sep = "", """ & vbCrLf & _
"        rs.MoveNext" & vbCrLf & _
"    Loop" & vbCrLf & _
"CleanExit:" & vbCrLf & _
"    On Error Resume Next" & vbCrLf & _
"    If Not rs Is Nothing Then rs.Close" & vbCrLf & _
"    GetInterviewLeads = s" & vbCrLf & _
"    Exit Function" & vbCrLf & _
"CleanFail:" & vbCrLf & _
"    s = """"" & vbCrLf & _
"    Resume CleanExit" & vbCrLf & _
"End Function" & vbCrLf

vbComp.CodeModule.AddFromString codeText
app.DoCmd.Save acModule, "mdlInterviewPanel"
Log "[OK] Created mdlInterviewPanel"
```

- [ ] **Step 3: Verify VBE access before continuing**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs"
```

Expected: if Access Trust Center blocks VBA project access, the script fails at `app.VBE`. Enable Access Trust Center -> Macro Settings -> `Trust access to the VBA project object model`, then rerun.

---

### Task 5: Create the Lead Subform and Popup

**Files:**
- Modify: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs`
- Modify Access object: `fsubInterviewLeads`
- Modify Access object: `frmInterviewLeads_Edit`

- [ ] **Step 1: Append subform creation**

Append this block:

```vbscript
DropFormIfExists "fsubInterviewLeads"

Dim sf, sfName, ctl
Set sf = app.CreateForm()
sfName = sf.Name
sf.RecordSource = "tblInterviewLeads"
sf.DefaultView = 1
sf.AllowAdditions = True
sf.AllowEdits = True
sf.AllowDeletions = True
sf.NavigationButtons = False
sf.RecordSelectors = False
sf.ScrollBars = 2
sf.Width = 11400
sf.Section(0).Height = 420

Set ctl = app.CreateControl(sfName, 111, 0, , "EmployeeID", 120, 60, 4200, 300)
ctl.Name = "cboEmployeeID"
ctl.RowSource = "SELECT EmployeeID, Trim(Nz([First Name],'') & ' ' & Nz(Surname,'')) AS FullName FROM [Employees Employment details] ORDER BY Surname, [First Name];"
ctl.RowSourceType = "Table/Query"
ctl.BoundColumn = 1
ctl.ColumnCount = 2
ctl.ColumnWidths = "0;4 cm"
ctl.LimitToList = True

Set ctl = app.CreateControl(sfName, 111, 0, , "RoleOnPanel", 4500, 60, 2300, 300)
ctl.Name = "cboRoleOnPanel"
ctl.RowSourceType = "Value List"
ctl.RowSource = """Lead"";""Co-lead"";""HR"";""Technical Assessor"";""Observer"""
ctl.LimitToList = False

Set ctl = app.CreateControl(sfName, 106, 0, , "IsPrimary", 7000, 90, 360, 240)
ctl.Name = "chkIsPrimary"

Set ctl = app.CreateControl(sfName, 109, 0, , "Notes", 7600, 60, 3500, 300)
ctl.Name = "txtNotes"

app.DoCmd.Save acForm, sfName
app.DoCmd.Close acForm, sfName, acSaveYes
app.DoCmd.Rename "fsubInterviewLeads", acForm, sfName
Log "[OK] Created fsubInterviewLeads"
```

- [ ] **Step 2: Append popup creation**

Append this block:

```vbscript
DropFormIfExists "frmInterviewLeads_Edit"

Dim pop, popName, popMod
Set pop = app.CreateForm()
popName = pop.Name
pop.RecordSource = "tblMainSHeetInterview"
pop.DefaultView = 0
pop.PopUp = True
pop.Modal = True
pop.Caption = "Manage Interview Leads"
pop.NavigationButtons = False
pop.RecordSelectors = False
pop.ScrollBars = 0
pop.AllowAdditions = False
pop.AllowDeletions = False
pop.Width = 11600
pop.Section(0).Height = 6400

Set ctl = app.CreateControl(popName, 100, 0, , , 120, 120, 8000, 360)
ctl.Name = "lblTitle"
ctl.Caption = "Manage Interview Leads"
ctl.FontSize = 14
ctl.FontBold = True

Set ctl = app.CreateControl(popName, 109, 0, , "Name", 120, 620, 1900, 300)
ctl.Name = "txtCandidateName"
ctl.Locked = True

Set ctl = app.CreateControl(popName, 109, 0, , "Surname", 2120, 620, 1900, 300)
ctl.Name = "txtCandidateSurname"
ctl.Locked = True

Set ctl = app.CreateControl(popName, 109, 0, , "Vacancy Number", 4120, 620, 2100, 300)
ctl.Name = "txtVacancyNumber"
ctl.Locked = True

Set ctl = app.CreateControl(popName, 112, 0, , , 120, 1100, 11200, 4600)
ctl.Name = "subInterviewLeads"
ctl.SourceObject = "fsubInterviewLeads"
ctl.LinkMasterFields = "EMPID"
ctl.LinkChildFields = "InterviewID"

Set ctl = app.CreateControl(popName, 104, 0, , , 9800, 5860, 1400, 360)
ctl.Name = "cmdClose"
ctl.Caption = "Close"
ctl.OnClick = "[Event Procedure]"

Set popMod = pop.Module
popMod.AddFromString _
"Option Compare Database" & vbCrLf & _
"Option Explicit" & vbCrLf & _
"" & vbCrLf & _
"Private Sub cmdClose_Click()" & vbCrLf & _
"    If Me.Dirty Then Me.Dirty = False" & vbCrLf & _
"    DoCmd.Close acForm, Me.Name" & vbCrLf & _
"End Sub" & vbCrLf

app.DoCmd.Save acForm, popName
app.DoCmd.Close acForm, popName, acSaveYes
app.DoCmd.Rename "frmInterviewLeads_Edit", acForm, popName
Log "[OK] Created frmInterviewLeads_Edit"
```

- [ ] **Step 3: Run and inspect popup objects**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs"
```

Expected: script creates `fsubInterviewLeads` and `frmInterviewLeads_Edit` without deleting existing business forms other than these two generated objects.

---

### Task 6: Modify `frmInterviewReg`

**Files:**
- Modify: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs`
- Modify Access object: `frmInterviewReg`

- [ ] **Step 1: Append main form UI changes**

Append this block:

```vbscript
app.Visible = True
app.DoCmd.OpenForm "frmInterviewReg", acDesign, , , 1, 0
app.DoCmd.SelectObject acForm, "frmInterviewReg", False

Dim mainFrm, mainMod, oldLead, newTxt, newBtn, procLine
Set mainFrm = app.Forms("frmInterviewReg")

On Error Resume Next
Set oldLead = mainFrm.Controls("Interviewer Lead")
If Err.Number = 0 Then
    oldLead.Visible = False
    oldLead.TabStop = False
End If
Err.Clear
mainFrm.Controls("Label9").Caption = "Interview Leads"
On Error GoTo 0

On Error Resume Next
mainFrm.Controls.Delete "txtInterviewerLeads"
mainFrm.Controls.Delete "cmdEditPanel"
Err.Clear
On Error GoTo 0

Set newTxt = app.CreateControl("frmInterviewReg", 109, 0, , , 13500, 36, 1080, 1164)
newTxt.Name = "txtInterviewerLeads"
newTxt.Locked = True
newTxt.TabStop = False
newTxt.ControlSource = "=GetInterviewLeads([EMPID])"

Set newBtn = app.CreateControl("frmInterviewReg", 104, 0, , , 14580, 36, 360, 1164)
newBtn.Name = "cmdEditPanel"
newBtn.Caption = "..."
newBtn.OnClick = "[Event Procedure]"

Set mainMod = mainFrm.Module
On Error Resume Next
procLine = mainMod.ProcStartLine("cmdEditPanel_Click", 0)
If Err.Number = 0 And procLine > 0 Then
    mainMod.DeleteLines procLine, mainMod.ProcCountLines("cmdEditPanel_Click", 0)
End If
Err.Clear
On Error GoTo 0

mainMod.AddFromString _
"Private Sub cmdEditPanel_Click()" & vbCrLf & _
"    If Me.Dirty Then Me.Dirty = False" & vbCrLf & _
"    If IsNull(Me.EMPID) Then" & vbCrLf & _
"        MsgBox ""Save the interview record first."", vbInformation, ""Interview Leads""" & vbCrLf & _
"        Exit Sub" & vbCrLf & _
"    End If" & vbCrLf & _
"    DoCmd.OpenForm ""frmInterviewLeads_Edit"", , , ""EMPID = "" & CLng(Me.EMPID), , acDialog" & vbCrLf & _
"    Me.txtInterviewerLeads.Requery" & vbCrLf & _
"End Sub" & vbCrLf

app.DoCmd.Close acForm, "frmInterviewReg", acSaveYes
Log "[OK] Updated frmInterviewReg"
```

- [ ] **Step 2: Append cleanup and close**

Append this final block:

```vbscript
app.CloseCurrentDatabase
app.Quit 2
Log "DONE"
logFile.Close
```

- [ ] **Step 3: Run the completed implementation script**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.vbs"
```

Expected: log ends with `DONE`, and `_implement_multi_interview_leads.log` contains `[OK] Updated frmInterviewReg`.

---

### Task 7: Verify and Manually QA

**Files:**
- Run: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_verify_multi_interview_leads.vbs`
- Inspect: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`

- [ ] **Step 1: Run automated verification**

Run:

```powershell
cscript //nologo "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_verify_multi_interview_leads.vbs"
```

Expected after implementation: all checks pass and the script prints `All multi-interview-lead checks passed.`

- [ ] **Step 2: Export modified form for comparison**

Run:

```powershell
$vbs = @'
Option Explicit
Dim app, dbPath, outPath
dbPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
outPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_frmInterviewReg_after_multi_leads.txt"
Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
app.SaveAsText 2, "frmInterviewReg", outPath
app.CloseCurrentDatabase
app.Quit 2
WScript.Echo "Wrote " & outPath
'@
$tmp = Join-Path $env:TEMP "export_frmInterviewReg_after_multi_leads.vbs"
Set-Content -LiteralPath $tmp -Value $vbs -Encoding ASCII
cscript //nologo $tmp
```

Expected: `_frmInterviewReg_after_multi_leads.txt` includes `txtInterviewerLeads`, `cmdEditPanel`, and `cmdEditPanel_Click`.

- [ ] **Step 3: Manual Access QA**

Open `Database_2ndCopy.accdb` and test:

1. Open `frmInterviewReg`.
2. Create or use the existing interview register row.
3. Click the `...` button in the `Interview Leads` column.
4. Add two employee leads with different roles.
5. Close the popup.
6. Confirm the main form summary shows both names.
7. Reopen the popup and delete one lead.
8. Confirm the main form summary updates.
9. Try adding the same employee twice for the same interview.
10. Confirm Access blocks the duplicate because of `ux_tblInterviewLeads_Interview_Employee`.
11. Use existing filters for region, department, and vacancy number.
12. Confirm filters still work.

---

### Task 8: Rollback Path

**Files:**
- Restore from: `Database_2ndCopy.backup_<timestamp>_pre_multi_leads.accdb`
- Replace: `C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb`

- [ ] **Step 1: Roll back only if verification fails and the issue is not quickly repairable**

Run:

```powershell
$dir = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence"
$current = Join-Path $dir "Database_2ndCopy.accdb"
$failed = Join-Path $dir ("Database_2ndCopy.failed_multi_leads_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".accdb")
$backup = Get-ChildItem -LiteralPath $dir -Filter "Database_2ndCopy.backup_*_pre_multi_leads.accdb" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
Move-Item -LiteralPath $current -Destination $failed
Copy-Item -LiteralPath $backup.FullName -Destination $current
Get-Item -LiteralPath $current | Format-List FullName,Length,LastWriteTime
```

Expected: the original database is restored, and the failed modified copy is retained for debugging.

---

## Self-Review

- Spec coverage: The plan covers schema, query, display summary, popup editor, main form integration, verification, manual QA, and rollback.
- Deferred-work scan: No banned markers or deferred-work instructions remain.
- Type consistency: `InterviewID` is consistently the child table foreign key to `tblMainSHeetInterview.EMPID`; `EmployeeID` is consistently the employee lead key.
- Access risk: VBA project access must be trusted. The plan detects this at Task 4 before the main form is modified.
- Data risk: The old `[Interviewer Lead]` column is preserved and hidden, not dropped.
