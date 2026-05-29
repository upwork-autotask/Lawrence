Option Explicit
' Adds multi-Interviewer-Lead support to frmInterviewReg.
' Creates: mdlInterviewPanel (VBA module), fsubInterviewLeads (subform),
'          frmInterviewLeads_Edit (popup), and modifies frmInterviewReg.
' Idempotent-ish: deletes our objects if they already exist before recreating.

Dim app, db, dbPath, fso, ts, logPath
dbPath  = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
logPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_apply_panel.log"

Set fso = CreateObject("Scripting.FileSystemObject")
Set ts  = fso.CreateTextFile(logPath, True)

Sub Log(msg)
    ts.WriteLine msg
    WScript.Echo msg
End Sub

Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False
Log "Opened: " & dbPath

' Test VBE access; abort if Trust Center blocks it
Dim canVBE
canVBE = False
On Error Resume Next
Dim vbeTest
Set vbeTest = app.VBE
If Err.Number = 0 And Not vbeTest Is Nothing Then canVBE = True
Err.Clear
On Error Goto 0
If Not canVBE Then
    Log "[ABORT] Cannot access VBE. Enable Access Trust Center -> Macro Settings -> 'Trust access to the VBA project object model'."
    app.CloseCurrentDatabase
    app.Quit 2
    ts.Close
    WScript.Quit 1
End If
Log "[OK] VBE accessible"

' ===== Helper: delete existing AccessObject by type/name =====
Sub DropIfExists(typeNum, objName)
    On Error Resume Next
    app.DoCmd.DeleteObject typeNum, objName
    On Error Goto 0
End Sub

' acModule=5, acForm=2
' ===== 1. mdlInterviewPanel module =====
DropIfExists 5, "mdlInterviewPanel"
Dim vbProj, vbComp, codeMod
Set vbProj = app.VBE.VBProjects(1)
Set vbComp = vbProj.VBComponents.Add(1)  ' vbext_ct_StdModule = 1
vbComp.Name = "mdlInterviewPanel"
Set codeMod = vbComp.CodeModule

Dim basFile
basFile = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_mdlInterviewPanel.bas"

' Clear VBE-auto-inserted lines (e.g. 'Option Compare Database') before importing
If codeMod.CountOfLines > 0 Then codeMod.DeleteLines 1, codeMod.CountOfLines
codeMod.AddFromFile basFile
Log "[DEBUG] Module lines after AddFromFile: " & codeMod.CountOfLines
app.DoCmd.Save 5, "mdlInterviewPanel"

' Close + reopen database to force VBA project recompile
app.CloseCurrentDatabase
app.OpenCurrentDatabase dbPath, False
Log "[OK] Reopened DB (force recompile)"

' Verify by calling PanelTest
Dim compileOK, testRet, errNum, errDesc
compileOK = False
On Error Resume Next
testRet = app.Run("PanelTest")
errNum = Err.Number
errDesc = Err.Description
Err.Clear
On Error Goto 0
Log "[DEBUG] testRet=[" & testRet & "]  err#=" & errNum & "  desc=[" & errDesc & "]"
If errNum = 0 Then compileOK = True
If Not compileOK Then
    Log "[ABORT] mdlInterviewPanel did not compile after reload"
    app.CloseCurrentDatabase
    app.Quit 2
    ts.Close
    WScript.Quit 1
End If
Log "[OK] mdlInterviewPanel compiles, PanelTest returned: " & testRet

' ===== 2. fsubInterviewLeads (continuous subform) =====
DropIfExists 2, "fsubInterviewLeads"
Dim sf, ctl, sfName
Set sf = app.CreateForm()
sfName = sf.Name      ' capture generated name (e.g. "Form1") BEFORE any close
sf.RecordSource = "qryInterviewLeads"
sf.DefaultView = 1   ' acFormDS=2 datasheet, 1=Continuous
sf.AllowAdditions = True
sf.AllowEdits = True
sf.AllowDeletions = True
sf.NavigationButtons = False
sf.RecordSelectors = False
sf.ScrollBars = 2     ' Vertical only

' Combo: EmployeeID -> Employee name (no headers — labels go in Detail above the row, but
' Continuous Forms render multiple Detail rows; column titles will live on the popup instead)
Set ctl = app.CreateControl(sf.Name, 111, 0, , "EmployeeID", 100, 50, 4000, 300)  ' acComboBox=111, Detail=0
ctl.Name = "cboEmployeeID"
ctl.RowSource = "SELECT EmployeeID, [First Name] & ' ' & Surname AS FullName FROM [Employees Employment details] ORDER BY Surname, [First Name];"
ctl.RowSourceType = "Table/Query"
ctl.BoundColumn = 1
ctl.ColumnCount = 2
ctl.ColumnWidths = "0;3 cm"

' Combo: RoleOnPanel
Set ctl = app.CreateControl(sf.Name, 111, 0, , "RoleOnPanel", 4150, 50, 2500, 300)
ctl.Name = "cboRoleOnPanel"
ctl.RowSourceType = "Value List"
Dim Q
Q = Chr(34)
ctl.RowSource = Q & "Lead" & Q & ";" & Q & "Co-lead" & Q & ";" & Q & "Observer" & Q & ";" & Q & "Technical Assessor" & Q & ";" & Q & "HR" & Q
ctl.LimitToList = False

' Checkbox: IsPrimary
Set ctl = app.CreateControl(sf.Name, 106, 0, , "IsPrimary", 6800, 80, 350, 240)
ctl.Name = "chkIsPrimary"

' Notes
Set ctl = app.CreateControl(sf.Name, 109, 0, , "Notes", 7400, 50, 4000, 300)  ' acTextBox=109
ctl.Name = "txtNotes"

app.DoCmd.Save 2, sfName                ' save with auto-name first
app.DoCmd.Close 2, sfName, 0            ' close (already saved)
app.DoCmd.Rename "fsubInterviewLeads", 2, sfName   ' rename to target
Log "[OK] Created subform fsubInterviewLeads"

' ===== 3. frmInterviewLeads_Edit (popup, hosts subform) =====
DropIfExists 2, "frmInterviewLeads_Edit"
Dim pop, popName
Set pop = app.CreateForm()
popName = pop.Name
pop.RecordSource = "tblMainSHeetInterview"
pop.DefaultView = 0   ' Single Form
pop.PopUp = True
pop.Modal = True
pop.Caption = "Manage Interview Panel"
pop.NavigationButtons = False
pop.RecordSelectors = False
pop.ScrollBars = 0
pop.AllowAdditions = False
pop.AllowDeletions = False

' Everything in Detail section (section 0). New forms only have Detail by default.
Dim hdr
Set hdr = app.CreateControl(popName, 100, 0, , , 100, 100, 8000, 400)
hdr.Name = "lblTitle"
hdr.Caption = "Manage Interview Panel"
hdr.FontSize = 14
hdr.FontBold = True

Set ctl = app.CreateControl(popName, 109, 0, , "Name", 100, 600, 2000, 300)
ctl.Name = "txtName"
ctl.Locked = True
Set ctl = app.CreateControl(popName, 109, 0, , "Surname", 2200, 600, 2000, 300)
ctl.Name = "txtSurname"
ctl.Locked = True
Set ctl = app.CreateControl(popName, 109, 0, , "Vacancy Number", 4300, 600, 2000, 300)
ctl.Name = "txtVacancy"
ctl.Locked = True

' Subform control
Set ctl = app.CreateControl(popName, 112, 0, , , 100, 1050, 11000, 4500)  ' acSubform=112
ctl.Name = "subPanel"
ctl.SourceObject = "fsubInterviewLeads"
ctl.LinkMasterFields = "EMPID"
ctl.LinkChildFields = "InterviewID"

' Close button
Set ctl = app.CreateControl(popName, 104, 0, , , 9500, 5650, 1500, 350)  ' acCommandButton=104
ctl.Name = "cmdClose"
ctl.Caption = "Close"
ctl.OnClick = "[Event Procedure]"

' Inject class-module event
Dim popMod
Set popMod = pop.Module
popMod.AddFromString _
"Option Compare Database" & vbCrLf & _
"Option Explicit" & vbCrLf & _
"" & vbCrLf & _
"Private Sub cmdClose_Click()" & vbCrLf & _
"    DoCmd.Close acForm, Me.Name" & vbCrLf & _
"End Sub" & vbCrLf

app.DoCmd.Save 2, popName
app.DoCmd.Close 2, popName, 0
app.DoCmd.Rename "frmInterviewLeads_Edit", 2, popName
Log "[OK] Created popup frmInterviewLeads_Edit"

' ===== 4. Modify frmInterviewReg =====
' Open in design view, normal window (hidden mode breaks CreateControl)
app.Visible = True
app.DoCmd.OpenForm "frmInterviewReg", 1, , , 1, 0   ' acDesign=1, acNormal=0
app.DoCmd.SelectObject 2, "frmInterviewReg", False  ' make it the active design object
Dim mainFrm
Set mainFrm = app.Forms("frmInterviewReg")

' Hide existing listbox 'Interviewer Lead' rather than deleting (safety)
On Error Resume Next
Dim oldCtl
Set oldCtl = mainFrm.Controls("Interviewer Lead")
If Not oldCtl Is Nothing Then
    oldCtl.Visible = False
    Log "[OK] Hid existing 'Interviewer Lead' listbox"
End If
Err.Clear
On Error Goto 0

' Update Label9 caption (its label)
On Error Resume Next
mainFrm.Controls("Label9").Caption = "Interview Panel"
On Error Goto 0
Log "[OK] Renamed Label9 -> 'Interview Panel'"

' Save the form before adding new controls (clean state for compile)
app.DoCmd.Save 2, "frmInterviewReg"

' Add textbox in the Detail row at position of old listbox
'   Old listbox position: Left=13500, Top=36, Width=1440, Height=1164  (in Detail/section 0)
' Reserve right ~360 twips for the button.
Dim newTxt, newBtn
Set newTxt = app.CreateControl("frmInterviewReg", 109, 0, , , 13500, 36, 1080, 1164)  ' textbox
newTxt.Name = "txtInterviewerLeads"
newTxt.Locked = True
newTxt.TabStop = False
newTxt.BackStyle = 1
' Save first so the new control persists, then set the bound expression
app.DoCmd.Save 2, "frmInterviewReg"
mainFrm.Controls("txtInterviewerLeads").ControlSource = "=GetInterviewLeads([EMPID])"
Log "[OK] Added textbox txtInterviewerLeads"

Set newBtn = app.CreateControl("frmInterviewReg", 104, 0, , , 14580, 36, 360, 1164)  ' button
newBtn.Name = "cmdEditPanel"
newBtn.Caption = "..."
newBtn.OnClick = "[Event Procedure]"
Log "[OK] Added button cmdEditPanel"

' Add OnClick handler to the form's class module
Dim mainMod
Set mainMod = mainFrm.Module
Dim handlerName, lineNum, found
handlerName = "cmdEditPanel_Click"
lineNum = 0
found = False
On Error Resume Next
lineNum = mainMod.ProcStartLine(handlerName, 0)
If Err.Number = 0 And lineNum > 0 Then found = True
Err.Clear
On Error Goto 0

If Not found Then
    mainMod.AddFromString _
"Private Sub cmdEditPanel_Click()" & vbCrLf & _
"    If IsNull(Me.EMPID) Then" & vbCrLf & _
"        MsgBox ""Save the interview record first."", vbInformation" & vbCrLf & _
"        Exit Sub" & vbCrLf & _
"    End If" & vbCrLf & _
"    DoCmd.OpenForm ""frmInterviewLeads_Edit"", , , ""EMPID = "" & Me.EMPID, , acDialog" & vbCrLf & _
"    Me.txtInterviewerLeads.Requery" & vbCrLf & _
"End Sub" & vbCrLf
    Log "[OK] Added cmdEditPanel_Click handler"
Else
    Log "[INFO] cmdEditPanel_Click already exists"
End If

app.DoCmd.Close 2, "frmInterviewReg", 1   ' save changes
Log "[OK] Saved frmInterviewReg"

app.CloseCurrentDatabase
app.Quit 2
Log "DONE"
ts.Close
