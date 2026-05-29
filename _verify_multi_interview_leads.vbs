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
