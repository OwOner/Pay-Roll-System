import * as ExcelJS from 'exceljs';
import { format, parseISO, eachDayOfInterval } from 'date-fns';

export async function generateExcelReport(
  startDate: string,
  endDate: string,
  employees: any[],
  records: any[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus Payroll System';
  workbook.lastModifiedBy = 'Nexus';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Compute days in interval
  const days: Date[] = [];
  try {
    days.push(...eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }));
  } catch (e) {
    // invalid dates
  }

  // --- Calculate unified summary ---
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLeave = 0;
  let totalRestDays = 0;
  let totalMissing = 0;
  let totalRegularHrs = 0;
  let totalOtHrs = 0;
  let totalNdHrs = 0;

  // Track exceptions
  let missingTimeInOutCount = 0;
  let overtimeCount = 0;
  let manualEntryCount = 0;

  const empSummaries = new Map<string, any>();

  employees.forEach(emp => {
    let empPresent = 0;
    let empAbsent = 0;
    let empLeave = 0;
    let empRestDays = 0;
    let empMissing = 0;
    let empRegHrs = 0;
    let empOtHrs = 0;
    let empNdHrs = 0;

    days.forEach(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const record = records.find(r => r.employee_id === emp.id && r.work_date === dateStr);
      
      if (!record) {
        empMissing++;
        totalMissing++;
      } else {
        if (record.status === 'Present') { empPresent++; totalPresent++; }
        else if (record.status === 'Absent') { empAbsent++; totalAbsent++; }
        else if (record.status === 'Leave') { empLeave++; totalLeave++; }
        else if (record.status === 'Rest Day' || record.is_rest_day) { empRestDays++; totalRestDays++; }
        
        const regHrs = Number(record.regular_hours || 0);
        const otHrs = Number(record.overtime_hours || 0);
        const ndHrs = Number(record.night_differential_hours || 0);
        
        empRegHrs += regHrs;
        empOtHrs += otHrs;
        empNdHrs += ndHrs;
        totalRegularHrs += regHrs;
        totalOtHrs += otHrs;
        totalNdHrs += ndHrs;

        if (record.status === 'Present' && (!record.time_in || !record.time_out)) {
          missingTimeInOutCount++;
        }
        if (otHrs > 0) {
          overtimeCount++;
        }
        if (record.last_modified_source === 'manual_correction' || record.source === 'manual_entry') {
          manualEntryCount++;
        }
      }
    });

    empSummaries.set(emp.id, {
      empPresent, empAbsent, empLeave, empRestDays, empMissing,
      empRegHrs, empOtHrs, empNdHrs
    });
  });

  // ==========================================
  // SHEET 1: Attendance Summary
  // ==========================================
  const summarySheet = workbook.addWorksheet('Attendance Summary');
  
  // Headers
  summarySheet.getCell('A1').value = 'NEXUS';
  summarySheet.getCell('A1').font = { bold: true, size: 16 };
  summarySheet.getCell('A2').value = 'ATTENDANCE SUMMARY';
  summarySheet.getCell('A2').font = { bold: true, size: 14 };
  
  summarySheet.getCell('A4').value = 'Reporting Period:';
  summarySheet.getCell('B4').value = `${format(parseISO(startDate), 'MMMM d, yyyy')} – ${format(parseISO(endDate), 'MMMM d, yyyy')}`;
  
  summarySheet.getCell('A5').value = 'Generated:';
  summarySheet.getCell('B5').value = format(new Date(), 'MMMM d, yyyy, h:mm a');
  
  summarySheet.getCell('A6').value = 'Employees:';
  summarySheet.getCell('B6').value = employees.length;

  // Stats
  summarySheet.getCell('A8').value = 'Total Records:';
  summarySheet.getCell('B8').value = records.length;
  summarySheet.getCell('A9').value = 'Present:';
  summarySheet.getCell('B9').value = totalPresent;
  summarySheet.getCell('A10').value = 'Absent:';
  summarySheet.getCell('B10').value = totalAbsent;
  summarySheet.getCell('A11').value = 'Leave:';
  summarySheet.getCell('B11').value = totalLeave;
  summarySheet.getCell('A12').value = 'Rest Days:';
  summarySheet.getCell('B12').value = totalRestDays;
  summarySheet.getCell('A13').value = 'Missing:';
  summarySheet.getCell('B13').value = totalMissing;

  summarySheet.getCell('A14').value = 'Total Regular Hrs:';
  summarySheet.getCell('B14').value = totalRegularHrs;
  summarySheet.getCell('A15').value = 'Total Overtime Hrs:';
  summarySheet.getCell('B15').value = totalOtHrs;
  summarySheet.getCell('A16').value = 'Total Night Diff Hrs:';
  summarySheet.getCell('B16').value = totalNdHrs;

  // Exceptions
  summarySheet.getCell('D8').value = 'ATTENTION REQUIRED';
  summarySheet.getCell('D8').font = { bold: true, color: { argb: 'FFFF0000' } };
  summarySheet.getCell('D9').value = `${totalMissing} Missing Attendance Records`;
  summarySheet.getCell('D10').value = `${missingTimeInOutCount} Records with Missing Time In/Out`;
  summarySheet.getCell('D11').value = `${overtimeCount} Records with Overtime`;
  summarySheet.getCell('D12').value = `${manualEntryCount} Manual Entries`;

  // Legend
  summarySheet.getCell('F8').value = 'STATUS LEGEND';
  summarySheet.getCell('F8').font = { bold: true };
  summarySheet.getCell('F9').value = 'Present';
  summarySheet.getCell('F9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
  summarySheet.getCell('F10').value = 'Absent';
  summarySheet.getCell('F10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } };
  summarySheet.getCell('F11').value = 'Leave';
  summarySheet.getCell('F11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
  summarySheet.getCell('F12').value = 'Rest Day';
  summarySheet.getCell('F12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F4' } };
  summarySheet.getCell('F13').value = 'Missing';
  summarySheet.getCell('F13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF7E0' } };

  // Employee Table
  summarySheet.getRow(18).values = [
    'Employee', 'Code', 'Present', 'Absent', 'Leave', 'Rest Day', 'Missing', 'Regular Hrs', 'Overtime Hrs'
  ];
  summarySheet.getRow(18).font = { bold: true };
  
  employees.forEach((emp, index) => {
    const s = empSummaries.get(emp.id);
    const row = summarySheet.getRow(19 + index);
    row.values = [
      `${emp.last_name}, ${emp.first_name}`,
      emp.employee_code || '',
      s.empPresent,
      s.empAbsent,
      s.empLeave,
      s.empRestDays,
      s.empMissing,
      s.empRegHrs,
      s.empOtHrs
    ];
  });

  // Table styling
  summarySheet.columns = [
    { width: 30 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }
  ];

  // ==========================================
  // SHEET 2: Daily Attendance
  // ==========================================
  const dailySheet = workbook.addWorksheet('Daily Attendance', { views: [{ state: 'frozen', ySplit: 1 }] });
  
  dailySheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Employee', key: 'employee', width: 30 },
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Time In', key: 'timeIn', width: 15 },
    { header: 'Time Out', key: 'timeOut', width: 15 },
    { header: 'Regular Hrs', key: 'regHrs', width: 15 },
    { header: 'OT Hrs', key: 'otHrs', width: 15 },
    { header: 'Night Diff', key: 'ndHrs', width: 15 },
    { header: 'Rest Day', key: 'restDay', width: 12 },
    { header: 'Project', key: 'project', width: 20 },
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];
  
  dailySheet.getRow(1).font = { bold: true };
  
  // Flatten records including missing ones
  const dailyRows: any[] = [];
  
  // Sort employees
  const sortedEmployees = [...employees].sort((a,b) => (a.last_name || '').localeCompare(b.last_name || ''));
  
  days.forEach(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    sortedEmployees.forEach(emp => {
      const record = records.find(r => r.employee_id === emp.id && r.work_date === dateStr);
      if (record) {
        let sourceLabel = (record.last_modified_source || record.source || '').replace(/_/g, ' ');
        sourceLabel = sourceLabel.replace(/\b\w/g, (l:string) => l.toUpperCase());

        dailyRows.push({
          date: d,
          employee: `${emp.last_name}, ${emp.first_name}`,
          code: emp.employee_code || '',
          status: record.status || '',
          timeIn: record.time_in ? new Date(`1899-12-31T${record.time_in}`) : null,
          timeOut: record.time_out ? new Date(`1899-12-31T${record.time_out}`) : null,
          regHrs: Number(record.regular_hours || 0),
          otHrs: Number(record.overtime_hours || 0),
          ndHrs: Number(record.night_differential_hours || 0),
          restDay: record.is_rest_day ? 'Yes' : 'No',
          project: record.projects?.project_name || '',
          source: sourceLabel,
          remarks: record.remarks || ''
        });
      } else {
        dailyRows.push({
          date: d,
          employee: `${emp.last_name}, ${emp.first_name}`,
          code: emp.employee_code || '',
          status: 'Missing',
          timeIn: null,
          timeOut: null,
          regHrs: 0,
          otHrs: 0,
          ndHrs: 0,
          restDay: 'No',
          project: '',
          source: '',
          remarks: ''
        });
      }
    });
  });

  dailyRows.forEach(rowData => {
    const row = dailySheet.addRow(rowData);
    
    // Formatting
    row.getCell('date').numFmt = 'mmm d, yyyy';
    if (rowData.timeIn) row.getCell('timeIn').numFmt = 'h:mm AM/PM';
    if (rowData.timeOut) row.getCell('timeOut').numFmt = 'h:mm AM/PM';
    row.getCell('regHrs').numFmt = '0.00';
    row.getCell('otHrs').numFmt = '0.00';
    row.getCell('ndHrs').numFmt = '0.00';

    // Conditional Formatting fallback (manual colors)
    let color = 'FFFFFFFF';
    if (rowData.status === 'Present') color = 'FFE6F4EA';
    else if (rowData.status === 'Absent') color = 'FFFCE8E6';
    else if (rowData.status === 'Leave') color = 'FFE8F0FE';
    else if (rowData.status === 'Rest Day') color = 'FFF1F3F4';
    else if (rowData.status === 'Missing') color = 'FFFEF7E0';

    if (color !== 'FFFFFFFF') {
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color }
      };
    }
  });

  dailySheet.autoFilter = {
    from: 'A1',
    to: 'M1'
  };

  // ==========================================
  // SHEET 3: Employee Attendance
  // ==========================================
  const empSheet = workbook.addWorksheet('Employee Attendance');
  
  empSheet.columns = [
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
  ];

  let currentRow = 1;

  empSheet.getCell(`A${currentRow}`).value = 'EMPLOYEE ATTENDANCE';
  empSheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
  currentRow += 2;

  sortedEmployees.forEach(emp => {
    empSheet.getCell(`A${currentRow}`).value = `${emp.last_name}, ${emp.first_name}`;
    empSheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;
    empSheet.getCell(`A${currentRow}`).value = `Employee Code: ${emp.employee_code || ''}`;
    currentRow += 2;

    // Header
    empSheet.getRow(currentRow).values = ['Date', 'Status', 'Time In', 'Time Out', 'Regular Hrs', 'OT Hrs'];
    empSheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    days.forEach(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const record = records.find(r => r.employee_id === emp.id && r.work_date === dateStr);
      
      const row = empSheet.getRow(currentRow);
      row.getCell(1).value = d;
      row.getCell(1).numFmt = 'mmm d';
      
      if (record) {
        row.getCell(2).value = record.status || '';
        
        if (record.time_in) {
           row.getCell(3).value = new Date(`1899-12-31T${record.time_in}`);
           row.getCell(3).numFmt = 'h:mm AM/PM';
        } else {
           row.getCell(3).value = '—';
        }
        
        if (record.time_out) {
           row.getCell(4).value = new Date(`1899-12-31T${record.time_out}`);
           row.getCell(4).numFmt = 'h:mm AM/PM';
        } else {
           row.getCell(4).value = '—';
        }
        
        row.getCell(5).value = Number(record.regular_hours || 0);
        row.getCell(5).numFmt = '0.00';
        row.getCell(6).value = Number(record.overtime_hours || 0);
        row.getCell(6).numFmt = '0.00';
      } else {
        row.getCell(2).value = 'Missing';
        row.getCell(3).value = '—';
        row.getCell(4).value = '—';
        row.getCell(5).value = 0;
        row.getCell(6).value = 0;
      }
      currentRow++;
    });

    currentRow++;
    const s = empSummaries.get(emp.id);
    empSheet.getCell(`A${currentRow}`).value = 'Summary';
    empSheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;
    
    empSheet.getCell(`A${currentRow}`).value = 'Present:';
    empSheet.getCell(`B${currentRow}`).value = s.empPresent;
    currentRow++;
    empSheet.getCell(`A${currentRow}`).value = 'Absent:';
    empSheet.getCell(`B${currentRow}`).value = s.empAbsent;
    currentRow++;
    empSheet.getCell(`A${currentRow}`).value = 'Missing:';
    empSheet.getCell(`B${currentRow}`).value = s.empMissing;
    currentRow++;
    empSheet.getCell(`A${currentRow}`).value = 'Regular Hours:';
    empSheet.getCell(`B${currentRow}`).value = s.empRegHrs;
    empSheet.getCell(`B${currentRow}`).numFmt = '0.00';
    currentRow++;
    empSheet.getCell(`A${currentRow}`).value = 'OT Hours:';
    empSheet.getCell(`B${currentRow}`).value = s.empOtHrs;
    empSheet.getCell(`B${currentRow}`).numFmt = '0.00';
    
    currentRow += 4;
  });

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return blob;
}
