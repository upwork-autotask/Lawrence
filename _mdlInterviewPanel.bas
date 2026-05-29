Option Compare Database
Option Explicit

Public Function GetInterviewLeads(ByVal pID As Variant) As String
    On Error Resume Next
    Dim rs As Object
    Dim s As String
    Dim sep As String
    Dim role As String
    Dim prim As Boolean
    If IsNull(pID) Then Exit Function
    Set rs = CurrentDb.OpenRecordset( _
        "SELECT LeadName, RoleOnPanel, IsPrimary FROM qryInterviewLeads " & _
        "WHERE InterviewID=" & CLng(pID) & " ORDER BY IsPrimary DESC, LeadName", 4)
    Do Until rs.EOF
        prim = Nz(rs.Fields("IsPrimary").Value, False)
        role = Nz(rs.Fields("RoleOnPanel").Value, "")
        s = s & sep & Nz(rs.Fields("LeadName").Value, "")
        If prim Then
            s = s & " *"
        ElseIf Len(role) > 0 Then
            s = s & " (" & role & ")"
        End If
        sep = ", "
        rs.MoveNext
    Loop
    rs.Close
    GetInterviewLeads = s
End Function

Public Function PanelTest() As String
    PanelTest = "ok"
End Function
