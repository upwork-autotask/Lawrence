Option Explicit

Const acForm = 2
Const acModule = 5
Const acDesign = 1
Const acSaveYes = 1
Const acSaveNo = 2
Const dbFailOnError = 128

Const acLabel = 100
Const acTextBox = 109
Const acComboBox = 111
Const acCheckBox = 106
Const acCommandButton = 104
Const acSubform = 112

Dim app, db, dbPath, logPath, fso, logFile
dbPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
logPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_implement_multi_interview_leads.log"

Set fso = CreateObject("Scripting.FileSystemObject")
Set logFile = fso.CreateTextFile(logPath, True)

Sub Log(message)
    logFile.WriteLine message
    WScript.Echo message
End Sub

Sub Fail(message)
    Log "[FAIL] " & message
    On Error Resume Next
    If Not app Is Nothing Then
        app.CloseCurrentDatabase
        app.Quit 2
    End If
    If Not logFile Is Nothing Then logFile.Close
    WScript.Quit 1
End Sub

Sub ExecuteSql(sqlText)
    Log "[SQL] " & sqlText
    db.Execute sqlText, dbFailOnError
End Sub

Sub TryExecuteSql(sqlText, warningText)
    On Error Resume Next
    Log "[SQL] " & sqlText
    db.Execute sqlText, dbFailOnError
    If Err.Number <> 0 Then
        Log "[WARN] " & warningText & ": " & Err.Description
        Err.Clear
    End If
    On Error GoTo 0
End Sub

Sub TryExecuteAdoSql(sqlText, warningText)
    On Error Resume Next
    Log "[ADO SQL] " & sqlText
    app.CurrentProject.Connection.Execute sqlText
    If Err.Number <> 0 Then
        Log "[WARN] " & warningText & ": " & Err.Description
        Err.Clear
    End If
    On Error GoTo 0
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
    If Err.Number = 0 Then Log "[OK] Dropped existing form " & formName
    Err.Clear
    On Error GoTo 0
End Sub

Sub DropModuleIfExists(moduleName)
    On Error Resume Next
    app.DoCmd.DeleteObject acModule, moduleName
    If Err.Number = 0 Then Log "[OK] Dropped existing module " & moduleName
    Err.Clear
    On Error GoTo 0
End Sub

Sub DeleteControlIfExists(formName, controlName)
    On Error Resume Next
    app.DeleteControl formName, controlName
    If Err.Number = 0 Then Log "[OK] Deleted existing control " & controlName & " from " & formName
    Err.Clear
    On Error GoTo 0
End Sub

Sub CreateSchema()
    If Not TableExists("tblInterviewLeads") Then
        ExecuteSql "CREATE TABLE tblInterviewLeads (" & _
            "InterviewLeadID COUNTER CONSTRAINT pk_tblInterviewLeads PRIMARY KEY, " & _
            "InterviewID LONG NOT NULL, " & _
            "EmployeeID LONG NOT NULL, " & _
            "RoleOnPanel TEXT(100), " & _
            "IsPrimary YESNO, " & _
            "Notes MEMO, " & _
            "CreatedAt DATETIME)"
        db.TableDefs.Refresh
        Log "[OK] Created tblInterviewLeads"
    Else
        Log "[INFO] tblInterviewLeads already exists"
    End If

    TryExecuteAdoSql "ALTER TABLE tblInterviewLeads ALTER COLUMN CreatedAt DATETIME DEFAULT Now()", "Could not set CreatedAt default"
    TryExecuteSql "CREATE UNIQUE INDEX ux_tblInterviewLeads_Interview_Employee ON tblInterviewLeads (InterviewID, EmployeeID)", "Could not add unique interview/employee index"
    TryExecuteSql "CREATE INDEX ix_tblInterviewLeads_InterviewID ON tblInterviewLeads (InterviewID)", "Could not add InterviewID index"
    TryExecuteSql "CREATE INDEX ix_tblInterviewLeads_EmployeeID ON tblInterviewLeads (EmployeeID)", "Could not add EmployeeID index"
    TryExecuteSql "ALTER TABLE tblInterviewLeads ADD CONSTRAINT fk_tblInterviewLeads_Interview FOREIGN KEY (InterviewID) REFERENCES tblMainSHeetInterview (EMPID)", "Could not add interview FK"
    TryExecuteSql "ALTER TABLE tblInterviewLeads ADD CONSTRAINT fk_tblInterviewLeads_Employee FOREIGN KEY (EmployeeID) REFERENCES [Employees Employment details] (EmployeeID)", "Could not add employee FK"
End Sub

Sub CreateQuery()
    Dim querySql
    If QueryExists("qryInterviewLeads") Then
        db.QueryDefs.Delete "qryInterviewLeads"
        Log "[OK] Dropped existing qryInterviewLeads"
    End If

    querySql = _
        "SELECT L.InterviewLeadID, L.InterviewID, L.EmployeeID, " & _
        "Trim(E.[First Name] & ' ' & E.Surname) AS LeadName, " & _
        "L.RoleOnPanel, L.IsPrimary, L.Notes, L.CreatedAt " & _
        "FROM tblInterviewLeads AS L " & _
        "LEFT JOIN [Employees Employment details] AS E ON L.EmployeeID = E.EmployeeID;"

    db.CreateQueryDef "qryInterviewLeads", querySql
    Log "[OK] Created qryInterviewLeads"
End Sub

Sub CreateModule()
    Dim vbProj, vbComp, codeText, errNum, errDesc

    On Error Resume Next
    Set vbProj = app.VBE.VBProjects(1)
    errNum = Err.Number
    errDesc = Err.Description
    Err.Clear
    On Error GoTo 0
    If errNum <> 0 Or vbProj Is Nothing Then
        Fail "Cannot access the Access VBA project. Enable Trust Center -> Macro Settings -> Trust access to the VBA project object model. " & errDesc
    End If

    DropModuleIfExists "mdlInterviewPanel"

    Set vbComp = vbProj.VBComponents.Add(1)
    vbComp.Name = "mdlInterviewPanel"
    If vbComp.CodeModule.CountOfLines > 0 Then
        vbComp.CodeModule.DeleteLines 1, vbComp.CodeModule.CountOfLines
    End If

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
End Sub

Sub CreateSubform()
    Dim sf, sfName, ctl

    DropFormIfExists "fsubInterviewLeads"

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

    Set ctl = app.CreateControl(sfName, acComboBox, 0, , "EmployeeID", 120, 60, 4200, 300)
    ctl.Name = "cboEmployeeID"
    ctl.RowSource = "SELECT EmployeeID, Trim(Nz([First Name],'') & ' ' & Nz(Surname,'')) AS FullName FROM [Employees Employment details] ORDER BY Surname, [First Name];"
    ctl.RowSourceType = "Table/Query"
    ctl.BoundColumn = 1
    ctl.ColumnCount = 2
    ctl.ColumnWidths = "0;4 cm"
    ctl.LimitToList = True

    Set ctl = app.CreateControl(sfName, acComboBox, 0, , "RoleOnPanel", 4500, 60, 2300, 300)
    ctl.Name = "cboRoleOnPanel"
    ctl.RowSourceType = "Value List"
    ctl.RowSource = """Lead"";""Co-lead"";""HR"";""Technical Assessor"";""Observer"""
    ctl.LimitToList = False

    Set ctl = app.CreateControl(sfName, acCheckBox, 0, , "IsPrimary", 7000, 90, 360, 240)
    ctl.Name = "chkIsPrimary"

    Set ctl = app.CreateControl(sfName, acTextBox, 0, , "Notes", 7600, 60, 3500, 300)
    ctl.Name = "txtNotes"

    app.DoCmd.Save acForm, sfName
    app.DoCmd.Close acForm, sfName, acSaveYes
    app.DoCmd.Rename "fsubInterviewLeads", acForm, sfName
    Log "[OK] Created fsubInterviewLeads"
End Sub

Sub CreatePopup()
    Dim pop, popName, ctl, popMod

    DropFormIfExists "frmInterviewLeads_Edit"

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

    Set ctl = app.CreateControl(popName, acLabel, 0, , , 120, 120, 8000, 360)
    ctl.Name = "lblTitle"
    ctl.Caption = "Manage Interview Leads"
    ctl.FontSize = 14
    ctl.FontBold = True

    Set ctl = app.CreateControl(popName, acLabel, 0, , , 120, 520, 1900, 220)
    ctl.Name = "lblCandidateName"
    ctl.Caption = "Name"
    Set ctl = app.CreateControl(popName, acTextBox, 0, , "Name", 120, 760, 1900, 300)
    ctl.Name = "txtCandidateName"
    ctl.Locked = True

    Set ctl = app.CreateControl(popName, acLabel, 0, , , 2120, 520, 1900, 220)
    ctl.Name = "lblCandidateSurname"
    ctl.Caption = "Surname"
    Set ctl = app.CreateControl(popName, acTextBox, 0, , "Surname", 2120, 760, 1900, 300)
    ctl.Name = "txtCandidateSurname"
    ctl.Locked = True

    Set ctl = app.CreateControl(popName, acLabel, 0, , , 4120, 520, 2100, 220)
    ctl.Name = "lblVacancyNumber"
    ctl.Caption = "Vacancy Number"
    Set ctl = app.CreateControl(popName, acTextBox, 0, , "Vacancy Number", 4120, 760, 2100, 300)
    ctl.Name = "txtVacancyNumber"
    ctl.Locked = True

    Set ctl = app.CreateControl(popName, acLabel, 0, , , 240, 1140, 4000, 220)
    ctl.Name = "lblLeadEmployee"
    ctl.Caption = "Employee"
    Set ctl = app.CreateControl(popName, acLabel, 0, , , 4620, 1140, 2200, 220)
    ctl.Name = "lblLeadRole"
    ctl.Caption = "Role"
    Set ctl = app.CreateControl(popName, acLabel, 0, , , 7120, 1140, 600, 220)
    ctl.Name = "lblLeadPrimary"
    ctl.Caption = "Primary"
    Set ctl = app.CreateControl(popName, acLabel, 0, , , 7720, 1140, 3400, 220)
    ctl.Name = "lblLeadNotes"
    ctl.Caption = "Notes"

    Set ctl = app.CreateControl(popName, acSubform, 0, , , 120, 1420, 11200, 4300)
    ctl.Name = "subInterviewLeads"
    ctl.SourceObject = "fsubInterviewLeads"
    ctl.LinkMasterFields = "EMPID"
    ctl.LinkChildFields = "InterviewID"

    Set ctl = app.CreateControl(popName, acCommandButton, 0, , , 9800, 5860, 1400, 360)
    ctl.Name = "cmdClose"
    ctl.Caption = "Close"
    ctl.OnClick = "[Event Procedure]"

    Set popMod = pop.Module
    If popMod.CountOfLines > 0 Then
        popMod.DeleteLines 1, popMod.CountOfLines
    End If
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
End Sub

Sub UpdateMainForm()
    Dim mainFrm, mainMod, oldLead, newTxt, newBtn, procLine, procLines

    app.DoCmd.OpenForm "frmInterviewReg", acDesign, , , 1, 0
    app.DoCmd.SelectObject acForm, "frmInterviewReg", False
    Set mainFrm = app.Forms("frmInterviewReg")

    On Error Resume Next
    Set oldLead = mainFrm.Controls("Interviewer Lead")
    If Err.Number = 0 Then
        oldLead.Visible = False
        oldLead.TabStop = False
        Log "[OK] Hid existing Interviewer Lead control"
    End If
    Err.Clear
    mainFrm.Controls("Label9").Caption = "Interview Leads"
    Err.Clear
    On Error GoTo 0

    DeleteControlIfExists "frmInterviewReg", "txtInterviewerLeads"
    DeleteControlIfExists "frmInterviewReg", "cmdEditPanel"

    Set newTxt = app.CreateControl("frmInterviewReg", acTextBox, 0, , , 13500, 36, 1080, 1164)
    newTxt.Name = "txtInterviewerLeads"
    newTxt.Locked = True
    newTxt.TabStop = False
    newTxt.ControlSource = "=GetInterviewLeads([EMPID])"
    newTxt.BackStyle = 1

    Set newBtn = app.CreateControl("frmInterviewReg", acCommandButton, 0, , , 14580, 36, 360, 1164)
    newBtn.Name = "cmdEditPanel"
    newBtn.Caption = "..."
    newBtn.OnClick = "[Event Procedure]"

    Set mainMod = mainFrm.Module
    On Error Resume Next
    procLine = mainMod.ProcStartLine("cmdEditPanel_Click", 0)
    If Err.Number = 0 And procLine > 0 Then
        procLines = mainMod.ProcCountLines("cmdEditPanel_Click", 0)
        mainMod.DeleteLines procLine, procLines
        Log "[OK] Replaced existing cmdEditPanel_Click handler"
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
End Sub

Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
Set db = app.CurrentDb
Log "Opened " & dbPath

CreateSchema
CreateQuery
CreateModule

app.Visible = True
CreateSubform
CreatePopup
UpdateMainForm

On Error Resume Next
app.CloseCurrentDatabase
If Err.Number <> 0 Then
    Log "[WARN] Access threw while closing database after saves: " & Err.Description
    Err.Clear
End If
app.Quit 2
If Err.Number <> 0 Then
    Log "[WARN] Access threw while quitting after saves: " & Err.Description
    Err.Clear
End If
On Error GoTo 0
Log "DONE"
logFile.Close
