"use client"

import { useState, useEffect } from "react"
import { read, utils } from "xlsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, CheckCircle2, Save, Download, RefreshCw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { fetchImportContext } from "./actions"
import { generateWeeklyExcelTemplate, generateSemiMonthlyExcelTemplate, generateMonthlyExcelTemplate } from "./export-actions"
import { validateExcelBatch, commitExcelBatch, ParsedAttendanceRow, ExcelValidationResult } from "./import-actions"

type Step = 1 | 2 | 3
type PeriodType = 'weekly' | 'semi-monthly' | 'monthly'

export function ExcelImportTab() {
  const [step, setStep] = useState<Step>(1)
  const [employees, setEmployees] = useState<any[]>([])
  
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  )
  const [semiHalf, setSemiHalf] = useState<'first' | 'second'>('first')

  const [isDownloading, setIsDownloading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const [validationResults, setValidationResults] = useState<ExcelValidationResult[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [stats, setStats] = useState({ newCount: 0, updateCount: 0 })

  useEffect(() => {
    fetchImportContext().then(res => {
      setEmployees(res.employees)
    })
  }, [])

  const getMonday = (d: string) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      let blob: Blob;
      let filename = "Attendance_Template.xlsx";

      if (periodType === 'weekly') {
        const mon = getMonday(selectedDate);
        blob = await generateWeeklyExcelTemplate(mon, employees);
        filename = `Weekly_Attendance_${mon.toISOString().split('T')[0]}.xlsx`;
      } else if (periodType === 'semi-monthly') {
        const [y, m] = selectedMonth.split('-');
        const start = new Date(Number(y), Number(m) - 1, semiHalf === 'first' ? 1 : 16);
        const end = semiHalf === 'first' ? new Date(Number(y), Number(m) - 1, 15) : new Date(Number(y), Number(m), 0);
        blob = await generateSemiMonthlyExcelTemplate(start, end, employees);
        filename = `SemiMonthly_Attendance_${start.toISOString().split('T')[0]}.xlsx`;
      } else {
        const [y, m] = selectedMonth.split('-');
        blob = await generateMonthlyExcelTemplate(Number(y), Number(m), employees);
        filename = `Monthly_Attendance_${y}_${m}.xlsx`;
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
      alert("Failed to download template.")
    }
    setIsDownloading(false)
  }

  const parseHorizontalGrid = (ws: any, baseYear: number): ParsedAttendanceRow[] => {
    const rawData = utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" })
    
    let headerRowIndex = -1
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i][0] === "Employee Code" && rawData[i][1] === "Employee") {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) return []

    const dateHeaders = rawData[headerRowIndex]
    const parsedRows: ParsedAttendanceRow[] = []

    const getIsoDate = (headerText: string) => {
        const parts = headerText.split(' ')
        if (parts.length >= 2) {
           const m = parts[parts.length-2];
           const d = parts[parts.length-1];
           const dt = new Date(`${m} ${d} ${baseYear}`)
           if (!isNaN(dt.getTime())) {
               const year = dt.getFullYear()
               const month = String(dt.getMonth() + 1).padStart(2, '0')
               const day = String(dt.getDate()).padStart(2, '0')
               return `${year}-${month}-${day}`
           }
        }
        return null
    }

    // Parse date columns (grouped in 3s: Status, OT, UT) starting at index 2
    const dateCols: { date: string, startIdx: number }[] = []
    let currentIdx = 2;
    while(currentIdx < dateHeaders.length) {
        if (dateHeaders[currentIdx] && dateHeaders[currentIdx] !== 'Days Present') {
            const dt = getIsoDate(dateHeaders[currentIdx]);
            if (dt) {
                dateCols.push({ date: dt, startIdx: currentIdx });
            }
            currentIdx += 3;
        } else {
            currentIdx++;
        }
    }

    for (let i = headerRowIndex + 2; i < rawData.length; i++) {
      const row = rawData[i]
      const empCode = row[0]
      const empName = row[1]
      
      if (!empCode || String(empCode).trim() === '') continue

      for (const dc of dateCols) {
         const statusShort = row[dc.startIdx]?.trim() || null
         const ot = parseFloat(row[dc.startIdx + 1]) || 0
         const ut = parseFloat(row[dc.startIdx + 2]) || 0

         if (statusShort && statusShort !== 'N/A') {
             parsedRows.push({
                 employee_code: empCode,
                 employee_name: empName,
                 date_iso: dc.date,
                 status_shortcode: statusShort,
                 ot_hours: ot,
                 ut_hours: ut
             })
         }
      }
    }
    return parsedRows;
  }

  const parseMonthlyCalendar = (ws: any, baseYear: number): ParsedAttendanceRow[] => {
    const rawData = utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" })
    const parsedRows: ParsedAttendanceRow[] = []

    let currentRow = 0;
    while(currentRow < rawData.length) {
        if (String(rawData[currentRow][0]).startsWith('Week ')) {
            // Found a week block
            const dateHeaders = rawData[currentRow + 1];
            
            // Build date column map for this week
            const dateCols: { date: string, startIdx: number }[] = []
            let cIdx = 2;
            for(let d = 0; d < 7; d++) {
                if (dateHeaders[cIdx]) {
                    const txt = String(dateHeaders[cIdx]).trim();
                    const dt = new Date(`${txt} ${baseYear}`);
                    if (!isNaN(dt.getTime())) {
                        const year = dt.getFullYear()
                        const month = String(dt.getMonth() + 1).padStart(2, '0')
                        const day = String(dt.getDate()).padStart(2, '0')
                        dateCols.push({ date: `${year}-${month}-${day}`, startIdx: cIdx });
                    }
                }
                cIdx += 3;
            }
            
            // Read employees for this week
            let empRowIdx = currentRow + 3;
            while (empRowIdx < rawData.length && String(rawData[empRowIdx][0]).startsWith('EMP-')) {
                const row = rawData[empRowIdx];
                for(const dc of dateCols) {
                    const statusShort = String(row[dc.startIdx]).trim();
                    const ot = parseFloat(row[dc.startIdx + 1]) || 0;
                    const ut = parseFloat(row[dc.startIdx + 2]) || 0;

                    if (statusShort && statusShort !== 'N/A' && statusShort !== '') {
                        parsedRows.push({
                             employee_code: row[0],
                             employee_name: row[1],
                             date_iso: dc.date,
                             status_shortcode: statusShort,
                             ot_hours: ot,
                             ut_hours: ut
                        });
                    }
                }
                empRowIdx++;
            }
            currentRow = empRowIdx; // Skip to next week or end
        } else {
            currentRow++;
        }
    }
    return parsedRows;
  }

  const processFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = read(bstr, { type: "binary", cellDates: true })
      
      const wsname = wb.SheetNames.find(n => n.includes('Attendance') || n.includes('Calendar'));
      if (!wsname) {
        alert("This doesn't look like a valid Nexus Attendance template.")
        return
      }

      const ws = wb.Sheets[wsname]
      
      const isMonthly = wsname === 'Monthly Calendar';
      const baseYear = new Date().getFullYear();

      const parsedRows = isMonthly ? parseMonthlyCalendar(ws, baseYear) : parseHorizontalGrid(ws, baseYear);

      if (parsedRows.length === 0) {
        alert("No valid attendance data found in the template.")
        return
      }

      const results = await validateExcelBatch(parsedRows)
      setValidationResults(results)
      setStep(2)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx')) { alert('Please upload the .xlsx template.'); return }
    processFile(file)
  }

  const toggleConflictOverride = (key: string) => {
    setValidationResults(prev => prev.map(r => {
      if (r.key === key) return { ...r, override_conflict: !r.override_conflict, skip: r.override_conflict }
      return r
    }))
  }

  const toggleSkip = (key: string) => {
    setValidationResults(prev => prev.map(r => {
      if (r.key === key) return { ...r, skip: !r.skip }
      return r
    }))
  }

  const handleImport = async () => {
    setIsImporting(true)
    const batchId = `EXCEL-BATCH-${new Date().getTime()}`
    const result = await commitExcelBatch(validationResults, batchId)
    
    setIsImporting(false)
    if (result.success) {
      setStats({ newCount: result.newCount || 0, updateCount: result.updateCount || 0 })
      setStep(3)
    } else {
      alert("Error: " + result.error)
    }
  }

  const getBadgeColor = (action: string) => {
    switch (action) {
      case 'New': return 'default'
      case 'Update': return 'secondary'
      case 'Conflict': return 'destructive'
      case 'Invalid': return 'destructive'
      case 'Duplicate': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        {[
          { num: 1, label: "Template & Upload" },
          { num: 2, label: "Preview & Import" },
          { num: 3, label: "Complete" }
        ].map((s) => (
          <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= s.num ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              {s.num}
            </div>
            <span className="font-medium text-sm hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Download Excel Template</CardTitle>
              <CardDescription>Generate an editable attendance workbook for HR.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <Label>Select Template Format</Label>
                <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semi-monthly" id="semi" />
                    <Label htmlFor="semi">Semi-Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                </RadioGroup>
              </div>

              {periodType === 'weekly' && (
                <div className="space-y-2">
                  <Label>Select any date in the target week</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  <p className="text-xs text-muted-foreground">The template will automatically start on Monday.</p>
                </div>
              )}

              {periodType === 'semi-monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={semiHalf} onChange={e => setSemiHalf(e.target.value as 'first'|'second')}>
                      <option value="first">1st - 15th</option>
                      <option value="second">16th - End of Month</option>
                    </select>
                  </div>
                </div>
              )}

              {periodType === 'monthly' && (
                <div className="space-y-2">
                  <Label>Select Month & Year</Label>
                  <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </div>
              )}

            </CardContent>
            <CardFooter>
              <Button onClick={handleDownload} disabled={isDownloading || employees.length === 0} className="w-full">
                {isDownloading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Template
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Upload Completed Template</CardTitle>
              <CardDescription>Upload the edited Excel file back to Nexus.</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`h-[150px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center transition-colors ${isDragging ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <Label htmlFor="weekly-upload" className="cursor-pointer text-primary hover:underline font-medium">
                  Click to browse
                  <Input id="weekly-upload" type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop your .xlsx here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Attendance Import</CardTitle>
            <CardDescription>Review the changes before committing them to the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
               <Badge variant="default">{validationResults.filter(r => r.action === 'New' && !r.skip).length} New</Badge>
               <Badge variant="secondary">{validationResults.filter(r => r.action === 'Update' && !r.skip).length} Updates</Badge>
               <Badge variant="destructive">{validationResults.filter(r => r.action === 'Conflict' && !r.skip).length} Conflicts</Badge>
               <Badge variant="outline">{validationResults.filter(r => r.skip).length} Skipped/Ignored</Badge>
            </div>
            
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.map((r) => (
                    <TableRow key={r.key} className={r.skip ? "opacity-50 bg-muted/50" : ""}>
                      <TableCell>
                        <div className="font-medium">{r.employee_name}</div>
                        <div className="text-xs text-muted-foreground">{r.employee_code}</div>
                      </TableCell>
                      <TableCell>{r.date_iso}</TableCell>
                      <TableCell>
                         <span className="font-bold">{r.status_full}</span>
                         {(r.ot_hours ?? 0) > 0 && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">OT: {r.ot_hours}</span>}
                         {(r.ut_hours ?? 0) > 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">UT: {r.ut_hours}</span>}
                         
                         {r.existing_status && r.existing_status !== r.status_full && (
                            <div className="text-xs text-destructive mt-1">
                               Existing: {r.existing_status} 
                               {(r.existing_ot ?? 0) > 0 && ` (OT: ${r.existing_ot})`}
                               ({r.existing_source})
                            </div>
                         )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeColor(r.action)}>{r.action}</Badge>
                        {r.reason && <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{r.reason}</div>}
                      </TableCell>
                      <TableCell>
                         {r.action === 'Conflict' && (
                             <div className="flex gap-2">
                               {r.override_conflict ? (
                                   <Button variant="outline" size="sm" onClick={() => toggleConflictOverride(r.key)}>Revert to Existing</Button>
                               ) : (
                                   <Button variant="destructive" size="sm" onClick={() => toggleConflictOverride(r.key)}>Force Overwrite</Button>
                               )}
                             </div>
                         )}
                         {r.action !== 'Conflict' && r.action !== 'Invalid' && r.action !== 'Duplicate' && (
                             <Button variant="ghost" size="sm" onClick={() => toggleSkip(r.key)}>
                                {r.skip ? "Restore" : "Skip"}
                             </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Cancel</Button>
            <Button onClick={handleImport} disabled={isImporting || validationResults.filter(r => !r.skip).length === 0}>
              {isImporting ? "Importing..." : `Import ${validationResults.filter(r => !r.skip).length} Records`} <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
            <p className="text-muted-foreground mb-6">
               Created {stats.newCount} new records and updated {stats.updateCount} existing records.
            </p>
            <Button onClick={() => window.location.href = "/attendance"}>
              View Attendance Grid
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
