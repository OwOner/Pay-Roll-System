"use client"

import { useState, useRef, useEffect } from "react"
import { read, utils } from "xlsx"
import fuzzysort from "fuzzysort"
import { fetchImportContext, importAttendanceBatch, ValidatedAttendanceRow } from "./actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Save, Trash2, XCircle, Download } from "lucide-react"
import { generateExcelTemplate, generateCsvTemplate } from "./export-template"

type Step = 1 | 2 | 3 | 4
type RawRow = Record<string, any>

const NEXUS_FIELDS = [
  { id: "employee_id", label: "Employee ID / Code" },
  { id: "employee_name", label: "Employee Name (For Matching)" },
  { id: "work_date", label: "Work Date" },
  { id: "time_in", label: "Time In" },
  { id: "time_out", label: "Time Out" },
  { id: "project_name", label: "Site / Project Name" }
]

export function RawImportTab() {
  const [step, setStep] = useState<Step>(1)
  const [fileData, setFileData] = useState<RawRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  
  const [mapping, setMapping] = useState<Record<string, string>>({})
  
  const [employees, setEmployees] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [stats, setStats] = useState({ matched: 0, duplicates: 0, missingEmployee: 0, missingProject: 0 })
  
  const [isImporting, setIsImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 1. UPLOAD
  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = read(bstr, { type: "binary", cellDates: true })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = utils.sheet_to_json<RawRow>(ws, { defval: "" })
      
      if (data.length > 0) {
        const h = Object.keys(data[0])
        setHeaders(h)
        setFileData(data)
        
        // Auto-guess mapping
        const initialMapping: Record<string, string> = {}
        h.forEach(col => {
          const lower = col.toLowerCase()
          if (lower.includes("name") && !lower.includes("project") && !lower.includes("site")) initialMapping[col] = "employee_name"
          else if (lower.includes("id") || lower.includes("code")) initialMapping[col] = "employee_id"
          else if (lower.includes("date")) initialMapping[col] = "work_date"
          else if (lower.includes("in")) initialMapping[col] = "time_in"
          else if (lower.includes("out")) initialMapping[col] = "time_out"
          else if (lower.includes("project") || lower.includes("site")) initialMapping[col] = "project_name"
          else initialMapping[col] = "ignore"
        })
        setMapping(initialMapping)
        setStep(2)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'csv') {
      alert('Only .xlsx and .csv formats are supported.')
      return
    }
    processFile(file)
  }

  const handleDownloadExcelTemplate = async () => {
    try {
      const blob = await generateExcelTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Attendance_Import_Template.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to download template.");
    }
  }

  const handleDownloadCsvTemplate = () => {
    const blob = generateCsvTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Attendance_Import_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 2. MAPPING -> LOAD CONTEXT
  const proceedToValidation = async () => {
    // Fetch active employees and projects
    const { employees, projects } = await fetchImportContext()
    setEmployees(employees)
    setProjects(projects)
    
    // Process rows
    runValidation(employees, projects, mapping, fileData)
    setStep(3)
  }

  const parseExcelTime = (val: any, baseDateObj: Date): string | null => {
    if (!val) return null
    if (val instanceof Date) return val.toISOString()
    
    // If it's a decimal from Excel time (e.g. 0.333 for 8 AM)
    if (typeof val === 'number') {
       const msInDay = 24 * 60 * 60 * 1000
       const timeMs = Math.round(val * msInDay)
       const d = new Date(baseDateObj)
       d.setHours(0, 0, 0, 0)
       return new Date(d.getTime() + timeMs).toISOString()
    }

    // String parsing e.g. "08:00 AM" or "17:00"
    if (typeof val === 'string') {
        // Try simple string parse with the date
        const d = new Date(`${baseDateObj.toDateString()} ${val}`)
        if (!isNaN(d.getTime())) return d.toISOString()
    }
    
    return null
  }

  const runValidation = (emps: any[], projs: any[], curMap: Record<string,string>, data: RawRow[]) => {
    let matched = 0, missingEmployee = 0, missingProject = 0
    const duplicates = 0
    
    const results = data.map((row, index) => {
      let problem = null
      let actionRequired = false
      let suggestedEmpId = null
      let suggestedProjId = null
      
      // Extract mapped fields
      const extract = (field: string) => {
        const col = Object.keys(curMap).find(k => curMap[k] === field)
        return col ? row[col] : null
      }
      
      const rawEmpId = extract("employee_id")
      const rawEmpName = extract("employee_name")
      const rawDate = extract("work_date")
      const rawIn = extract("time_in")
      const rawOut = extract("time_out")
      const rawProj = extract("project_name")
      
      // Parse Date
      let baseDateObj = new Date()
      if (rawDate instanceof Date) {
        baseDateObj = rawDate
      } else if (rawDate) {
        baseDateObj = new Date(rawDate)
      }
      
      let work_date_iso = ""
      if (!isNaN(baseDateObj.getTime())) {
          work_date_iso = baseDateObj.toISOString().split('T')[0]
      } else {
          problem = "Invalid Date"
          actionRequired = true
      }

      // Block future dates
      if (work_date_iso) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const rowDate = new Date(work_date_iso + 'T00:00:00')
        if (rowDate > today) {
          problem = `Future date (${work_date_iso}) — cannot import future attendance`
          actionRequired = true
        }
      }

      // Parse Times
      const time_in_iso = parseExcelTime(rawIn, baseDateObj)
      let time_out_iso = parseExcelTime(rawOut, baseDateObj)


      // Handle Night Shift: if time_out < time_in, add 1 day to time_out
      if (time_in_iso && time_out_iso) {
        const tin = new Date(time_in_iso)
        const tout = new Date(time_out_iso)
        if (tout < tin) {
           tout.setDate(tout.getDate() + 1)
           time_out_iso = tout.toISOString()
        }
      }
      
      // Match Employee
      let empMatch = emps.find(e => e.employee_code === rawEmpId || e.id === rawEmpId)
      if (!empMatch && rawEmpName) {
         // Fuzzy match name
         const res = fuzzysort.go(String(rawEmpName), emps, { keys: ['first_name', 'last_name'], threshold: -10000 })
         if (res.length > 0) {
             empMatch = res[0].obj
             problem = "Employee fuzzy matched"
             suggestedEmpId = empMatch.id
             actionRequired = true
             missingEmployee++
         } else {
             problem = "Employee not found"
             actionRequired = true
             missingEmployee++
         }
      } else if (!empMatch) {
         problem = "Employee not found"
         actionRequired = true
         missingEmployee++
      } else {
         suggestedEmpId = empMatch.id
      }

      // Match Project
      if (rawProj) {
         const pMatch = projs.find(p => p.project_name.toLowerCase() === String(rawProj).toLowerCase())
         if (pMatch) {
             suggestedProjId = pMatch.id
         } else {
             const res = fuzzysort.go(String(rawProj), projs, { key: 'project_name' })
             if (res.length > 0) {
                 suggestedProjId = res[0].obj.id
                 problem = problem ? problem + ", Project fuzzy matched" : "Project fuzzy matched"
                 actionRequired = true
                 missingProject++
             } else {
                 problem = problem ? problem + ", Project not found" : "Project not found"
                 actionRequired = true
                 missingProject++
             }
         }
      }
      
      if (!actionRequired) matched++

      // Define status
      const status = (!time_in_iso && !time_out_iso) ? "Absent" : "Present"

      return {
        _id: index,
        original: row,
        problem,
        actionRequired,
        skip: false,
        payload: {
          employee_id: suggestedEmpId,
          project_id: suggestedProjId,
          work_date: work_date_iso,
          time_in: time_in_iso,
          time_out: time_out_iso,
          status,
          internal_notes: problem || null
        },
        rawDisplay: {
          name: rawEmpName || rawEmpId,
          date: rawDate,
          proj: rawProj
        }
      }
    })
    
    setValidationResults(results)
    setStats({ matched, duplicates, missingEmployee, missingProject })
  }

  // 3. RESOLUTION HANDLERS
  const updateRowPayload = (indexId: number, field: string, value: any) => {
    setValidationResults(prev => prev.map(r => {
      if (r._id === indexId) {
        const newPayload = { ...r.payload, [field]: value }
        const stillNeedsAction = !newPayload.employee_id || newPayload.work_date === ""
        return { ...r, payload: newPayload, actionRequired: stillNeedsAction }
      }
      return r
    }))
  }

  const toggleSkip = (indexId: number) => {
    setValidationResults(prev => prev.map(r => {
      if (r._id === indexId) return { ...r, skip: !r.skip }
      return r
    }))
  }

  // 4. IMPORT
  const handleImport = async () => {
    setIsImporting(true)
    const validRows = validationResults
      .filter(r => !r.skip && r.payload.employee_id && r.payload.work_date)
      .map(r => r.payload as ValidatedAttendanceRow)
      
    if (validRows.length === 0) {
      alert("No valid rows to import!")
      setIsImporting(false)
      return
    }

    const batchId = `BATCH-${new Date().getTime()}`
    const result = await importAttendanceBatch(validRows, batchId)
    
    setIsImporting(false)
    if (result.success) {
      setImportDone(true)
      setStep(4)
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <div className="space-y-6">

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b pb-4">
        {[
          { num: 1, label: "Upload" },
          { num: 2, label: "Map Columns" },
          { num: 3, label: "Validate & Resolve" },
          { num: 4, label: "Complete" }
        ].map((s) => (
          <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= s.num ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              {s.num}
            </div>
            <span className="font-medium text-sm hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <CardTitle>Select File</CardTitle>
                <CardDescription>Only .xlsx and .csv formats are supported.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadExcelTemplate}>
                  <Download className="mr-2 h-4 w-4" /> Excel Template
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCsvTemplate}>
                  <Download className="mr-2 h-4 w-4" /> CSV Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline text-lg font-medium">
                Click to browse
                <Input id="file-upload" type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileUpload} />
              </Label>
              <p className="text-sm text-muted-foreground mt-2">or drag and drop your file here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>Match the columns from your Excel file to Nexus fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uploaded Column</TableHead>
                  <TableHead>Nexus Field</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map(h => (
                  <TableRow key={h}>
                    <TableCell className="font-medium">{h}</TableCell>
                    <TableCell>
                      <Select 
                        value={mapping[h] || "ignore"} 
                        onValueChange={(val) => setMapping(prev => ({...prev, [h]: val || ""}))}
                      >
                        <SelectTrigger className="w-[300px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore" className="text-muted-foreground">-- Ignore Column --</SelectItem>
                          {NEXUS_FIELDS.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={proceedToValidation}>
              Validate Data <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: VALIDATION */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
             <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{stats.matched}</div><p className="text-xs text-muted-foreground">Clean Rows</p></CardContent></Card>
             <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{stats.missingEmployee}</div><p className="text-xs text-muted-foreground">Missing/Fuzzy Employees</p></CardContent></Card>
             <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{stats.missingProject}</div><p className="text-xs text-muted-foreground">Missing Projects</p></CardContent></Card>
             <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{stats.duplicates}</div><p className="text-xs text-muted-foreground">Duplicates (Ignored)</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Required</CardTitle>
              <CardDescription>Fix any unmapped employees or projects before importing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row #</TableHead>
                      <TableHead>Problem</TableHead>
                      <TableHead>Row Data</TableHead>
                      <TableHead>Resolution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.filter(r => r.problem || r.actionRequired || r.skip).map((r, i) => (
                      <TableRow key={r._id} className={r.skip ? "opacity-50 bg-muted/50" : ""}>
                        <TableCell>{r._id + 2}</TableCell>
                        <TableCell>
                          <Badge variant={r.skip ? "secondary" : "destructive"}>{r.problem || "Skipped"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-1">
                          <div>Name: <span className="font-medium">{String(r.rawDisplay.name)}</span></div>
                          <div>Date: {String(r.rawDisplay.date)}</div>
                          <div>Project: {String(r.rawDisplay.proj)}</div>
                        </TableCell>
                        <TableCell>
                          {r.skip ? (
                            <Button variant="outline" size="sm" onClick={() => toggleSkip(r._id)}>Restore Row</Button>
                          ) : (
                            <div className="space-y-2">
                              {!r.payload.employee_id && (
                                <Select onValueChange={(val) => updateRowPayload(r._id, 'employee_id', val)} value={r.payload.employee_id || ""}>
                                  <SelectTrigger className="w-[200px] h-8 text-xs">
                                    <SelectValue placeholder="Select Employee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                              {r.rawDisplay.proj && !r.payload.project_id && (
                                <Select onValueChange={(val) => updateRowPayload(r._id, 'project_id', val)} value={r.payload.project_id || ""}>
                                  <SelectTrigger className="w-[200px] h-8 text-xs">
                                    <SelectValue placeholder="Select Project" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                              <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => toggleSkip(r._id)}>
                                <XCircle className="mr-2 h-3 w-3" /> Skip Row
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {validationResults.filter(r => r.problem || r.actionRequired || r.skip).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          All rows are clean! No resolution needed.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">
                Ready to import {validationResults.filter(r => !r.skip && r.payload.employee_id && r.payload.work_date).length} rows.
              </span>
              <Button onClick={handleImport} disabled={isImporting || validationResults.some(r => !r.skip && r.actionRequired)}>
                {isImporting ? "Importing..." : "Final Import"} <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETE */}
      {step === 4 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
            <p className="text-muted-foreground mb-6">Your attendance records have been imported to the database.</p>
            <Button onClick={() => window.location.href = "/attendance"}>
              Go to Attendance Records
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
