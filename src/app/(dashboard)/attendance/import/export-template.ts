import * as ExcelJS from 'exceljs';

export async function generateExcelTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus Payroll System';
  workbook.lastModifiedBy = 'Nexus';
  workbook.created = new Date();
  
  // Sheet 1: Attendance Import
  const importSheet = workbook.addWorksheet('Attendance Import', { views: [{ state: 'frozen', ySplit: 1 }] });
  
  const headers = [
    'Employee ID / Code',
    'Employee Name (For Matching)',
    'Work Date',
    'Time In',
    'Time Out',
    'Site / Project Name'
  ];
  
  importSheet.addRow(headers);
  importSheet.getRow(1).font = { bold: true };
  
  importSheet.columns = [
    { key: 'emp_id', width: 20 },
    { key: 'emp_name', width: 30 },
    { key: 'work_date', width: 15 },
    { key: 'time_in', width: 15 },
    { key: 'time_out', width: 15 },
    { key: 'project', width: 25 },
  ];
  
  importSheet.getColumn('work_date').numFmt = 'mmm d, yyyy';
  importSheet.getColumn('time_in').numFmt = 'h:mm AM/PM';
  importSheet.getColumn('time_out').numFmt = 'h:mm AM/PM';
  
  // Sheet 2: Instructions
  const instSheet = workbook.addWorksheet('Instructions');
  instSheet.getColumn(1).width = 30;
  instSheet.getColumn(2).width = 70;
  
  instSheet.addRow(['INSTRUCTIONS', 'How to use this template']);
  instSheet.getRow(1).font = { bold: true, size: 14 };
  instSheet.addRow([]);
  
  instSheet.addRow(['Employee ID / Code', 'REQUIRED. Exact match for employee code or system ID.']);
  instSheet.addRow(['Employee Name (For Matching)', 'OPTIONAL. Used as a fallback if ID is not found. Example: "Juan Dela Cruz"']);
  instSheet.addRow(['Work Date', 'REQUIRED. Must be a valid date. Example: "Sep 1, 2026"']);
  instSheet.addRow(['Time In', 'OPTIONAL. Valid time. Blank Time In & Out forces "Absent" status.']);
  instSheet.addRow(['Time Out', 'OPTIONAL. Valid time. If Time Out is earlier than Time In, system assumes Night Shift.']);
  instSheet.addRow(['Site / Project Name', 'OPTIONAL. Will attempt to exact or fuzzy match active projects.']);
  instSheet.addRow([]);
  instSheet.addRow(['Status', 'Automatically calculated by the system. (Present if times exist, Absent if not)']);
  instSheet.addRow(['Hours / Overtime', 'Automatically calculated by the timesheet engine. Import ignores manually entered hours.']);
  
  instSheet.eachRow(row => { row.font = { size: 11 } });
  instSheet.getRow(1).font = { bold: true, size: 14 };

  // Sheet 3: Example Data
  const exSheet = workbook.addWorksheet('Example Data — Delete Before Import');
  exSheet.addRow(headers);
  exSheet.getRow(1).font = { bold: true };
  
  exSheet.columns = [
    { key: 'emp_id', width: 20 },
    { key: 'emp_name', width: 30 },
    { key: 'work_date', width: 15 },
    { key: 'time_in', width: 15 },
    { key: 'time_out', width: 15 },
    { key: 'project', width: 25 },
  ];
  
  exSheet.getColumn('work_date').numFmt = 'mmm d, yyyy';
  exSheet.getColumn('time_in').numFmt = 'h:mm AM/PM';
  exSheet.getColumn('time_out').numFmt = 'h:mm AM/PM';
  
  // Example 1: Standard
  exSheet.addRow([
    'EMP-0001',
    'Juan Dela Cruz',
    new Date('2026-09-01T00:00:00'),
    new Date('1899-12-31T08:00:00'),
    new Date('1899-12-31T17:00:00'),
    'Main Office'
  ]);
  
  // Example 2: Absent (No times)
  exSheet.addRow([
    'EMP-0002',
    'Pedro Penduko',
    new Date('2026-09-01T00:00:00'),
    null,
    null,
    ''
  ]);
  
  // Example 3: Night shift
  exSheet.addRow([
    'EMP-0003',
    'Ana Reyes',
    new Date('2026-09-01T00:00:00'),
    new Date('1899-12-31T20:00:00'),
    new Date('1899-12-31T05:00:00'),
    'Site A'
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generateCsvTemplate() {
  const headers = [
    'Employee ID / Code',
    'Employee Name (For Matching)',
    'Work Date',
    'Time In',
    'Time Out',
    'Site / Project Name'
  ];
  const csvString = headers.join(',') + '\n';
  return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
}
