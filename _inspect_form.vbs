Option Explicit
Dim app, frm, c, i, s, fso, ts, dbPath, outPath, line, sectName

dbPath  = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\Database_2ndCopy.accdb"
outPath = "C:\Users\bhanu\Documents\Upwork\2026\May\Lawrence\_form_inspect.txt"

Set fso = CreateObject("Scripting.FileSystemObject")
Set ts  = fso.CreateTextFile(outPath, True)

Set app = CreateObject("Access.Application")
app.Visible = False
app.OpenCurrentDatabase dbPath, False

app.DoCmd.OpenForm "frmInterviewReg", 1, , , 1, 3   ' acDesign=1, acHidden=3
Set frm = app.Forms("frmInterviewReg")

ts.WriteLine "Form:         " & frm.Name
ts.WriteLine "RecordSource: " & frm.RecordSource
ts.WriteLine "HasModule:    " & frm.HasModule
ts.WriteLine "Caption:      " & frm.Caption
ts.WriteLine "Width:        " & frm.Width

' Section heights (acDetail=0, acHeader=1, acFooter=2, acPageHeader=3, acPageFooter=4)
ts.WriteLine ""
ts.WriteLine "--- Sections ---"
For i = 0 To 4
    On Error Resume Next
    sectName = ""
    sectName = "Visible=" & frm.Section(i).Visible & " Height=" & frm.Section(i).Height & " Name=" & frm.Section(i).Name
    If Err.Number = 0 And Len(sectName) > 0 Then
        ts.WriteLine "Section " & i & " " & sectName
    End If
    Err.Clear
    On Error Goto 0
Next

ts.WriteLine ""
ts.WriteLine "--- Controls ---"
For i = 0 To frm.Controls.Count - 1
    Set c = frm.Controls(i)
    line = c.Name & "|TYPE=" & c.ControlType
    On Error Resume Next
    line = line & "|SOURCE=" & c.ControlSource
    line = line & "|LEFT=" & c.Left & "|TOP=" & c.Top & "|W=" & c.Width & "|H=" & c.Height
    line = line & "|SECT=" & c.Section
    line = line & "|VIS=" & c.Visible
    Err.Clear
    line = line & "|CAPTION=" & c.Caption
    Err.Clear
    line = line & "|SRCOBJ=" & c.SourceObject
    Err.Clear
    line = line & "|LMASTER=" & c.LinkMasterFields
    Err.Clear
    line = line & "|LCHILD=" & c.LinkChildFields
    Err.Clear
    On Error Goto 0
    ts.WriteLine line
Next

app.DoCmd.Close 2, "frmInterviewReg", 2
app.CloseCurrentDatabase
app.Quit 2

ts.WriteLine ""
ts.WriteLine "DONE"
ts.Close
WScript.Echo "Wrote " & outPath
