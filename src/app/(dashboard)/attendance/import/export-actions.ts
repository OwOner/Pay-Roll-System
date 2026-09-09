import * as ExcelJS from 'exceljs';
import { VALID_SHORTCODES, LEGEND_TEXT, COUNTABLE_STATUS_SHORTCODES, STATUS_MAPPING } from './weekly-constants';

function addInstructionsSheet(workbook: ExcelJS.Workbook) {
  const instSheet = workbook.addWorksheet('Instructions');
  instSheet.getColumn(1).width = 30;
  instSheet.getColumn(2).width = 70;
  
  instSheet.addRow(['HOW TO USE THIS FILE', '']);
  instSheet.getRow(1).font = { bold: true, size: 14 };
  instSheet.addRow([]);
  
  instSheet.addRow(['1.', 'Do not modify Employee Code.']);
  instSheet.addRow(['2.', 'Do not rename or delete the date header rows.']);
  instSheet.addRow(['3.', 'Use the dropdown to select an attendance status.']);
  instSheet.addRow(['4.', 'Do not type custom status names.']);
  instSheet.addRow(['5.', 'Enter OT and Undertime as decimal numbers (e.g. 1.5).']);
  instSheet.addRow(['6.', 'Save the file as .xlsx.']);
  instSheet.addRow(['7.', 'Upload the file to Nexus.']);
  instSheet.addRow([]);
  instSheet.addRow(['STATUS LEGEND', '']);
  instSheet.getRow(10).font = { bold: true, size: 12 };
  
  Object.entries(STATUS_MAPPING).forEach(([k, v]) => {
    instSheet.addRow([k, v]);
  });
}

function applyStatusConditionalFormatting(sheet: ExcelJS.Worksheet, range: string) {
  sheet.addConditionalFormatting({
    ref: range,
    rules: [
      {
        type: 'cellIs' as any, priority: 1, operator: 'equal', formulae: ['"PRE"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE6F4EA' } } }
      },
      {
        type: 'cellIs' as any, priority: 2, operator: 'equal', formulae: ['"ABS"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFCE8E6' } }, font: { color: { argb: 'FFC5221F' } } }
      },
      {
        type: 'cellIs' as any, priority: 3, operator: 'equal', formulae: ['"LVE"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE8F0FE' } } }
      },
      {
        type: 'cellIs' as any, priority: 4, operator: 'equal', formulae: ['"WFH"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE6F4EA' } } }
      },
      {
        type: 'cellIs' as any, priority: 5, operator: 'equal', formulae: ['"RD"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF1F3F4' } }, font: { color: { argb: 'FF5F6368' } } }
      },
      {
        type: 'cellIs' as any, priority: 6, operator: 'equal', formulae: ['"HOL"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF3E8FD' } } }
      },
      {
        type: 'cellIs' as any, priority: 7, operator: 'equal', formulae: ['"MIS"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF7E0' } } }
      }
    ]
  });
}

/**
 * Common builder for Horizontal-layout sheets (Weekly and Semi-Monthly)
 */
function buildHorizontalGridSheet(workbook: ExcelJS.Workbook, title: string, periodText: string, dates: Date[], employees: any[]) {
  const sheet = workbook.addWorksheet(title, { 
    views: [{ state: 'frozen', xSplit: 2, ySplit: 9 }] // Freeze top 9 rows and first 2 cols
  });
  
  sheet.addRow(['NEXUS']);
  sheet.getRow(1).font = { bold: true, size: 16 };
  sheet.addRow([title.toUpperCase()]);
  sheet.getRow(2).font = { bold: true, size: 14 };
  sheet.addRow([]);
  
  const formatShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  sheet.addRow([periodText]);
  sheet.getRow(4).font = { bold: true };
  sheet.addRow([]);
  sheet.addRow(['Legend:']);
  sheet.getRow(6).font = { bold: true };
  sheet.addRow([LEGEND_TEXT]);
  sheet.addRow([]);

  // Row 9 is Date Headers
  const dateHeaderRow = ['Employee Code', 'Employee'];
  const colSpans: any[] = [];
  let colIndex = 3;
  
  dates.forEach((d) => {
    dateHeaderRow.push(`${daysOfWeek[d.getDay()]} ${formatShort(d)}`, '', '');
    colSpans.push({ start: colIndex, end: colIndex + 2 });
    colIndex += 3;
  });
  dateHeaderRow.push('Days Present');
  
  const dHeader = sheet.addRow(dateHeaderRow);
  dHeader.font = { bold: true };
  dHeader.alignment = { horizontal: 'center' };

  colSpans.forEach(span => {
     sheet.mergeCells(9, span.start, 9, span.end);
  });

  // Row 10 is Subheaders
  const subHeaderRow = ['', ''];
  dates.forEach(() => {
    subHeaderRow.push('Status', 'OT', 'UT');
  });
  subHeaderRow.push('');
  
  const sHeader = sheet.addRow(subHeaderRow);
  sHeader.font = { bold: true, size: 10 };
  sHeader.alignment = { horizontal: 'center' };

  // Setup Column Widths
  sheet.getColumn(1).width = 15;
  sheet.getColumn(2).width = 30;
  for(let c=3; c<3+(dates.length*3); c+=3) {
      sheet.getColumn(c).width = 10;   // Status
      sheet.getColumn(c+1).width = 8;  // OT
      sheet.getColumn(c+2).width = 8;  // UT
  }
  const totalColIndex = 3+(dates.length*3);
  sheet.getColumn(totalColIndex).width = 15;

  // Add Employees
  employees.forEach((emp, index) => {
    const rowIndex = 11 + index;
    const rowData: any[] = [emp.employee_code, `${emp.first_name} ${emp.last_name}`];
    
    for(let i=0; i<dates.length; i++) {
        rowData.push('', '', '');
    }
    
    // Days Present formula
    const statusCols: any[] = [];
    for(let c=3; c<totalColIndex; c+=3) {
        statusCols.push(sheet.getColumn(c).letter + rowIndex); 
    }
    const countIfs = COUNTABLE_STATUS_SHORTCODES.map(code => 
        statusCols.map(col => `COUNTIF(${col},"${code}")`).join(' + ')
    ).join(' + ');

    rowData.push({ formula: `SUM(${countIfs})` });
    
    const row = sheet.addRow(rowData);
    
    // Add validations and styling
    for (let c = 3; c < totalColIndex; c += 3) {
      const cell = row.getCell(c);
      cell.dataValidation = {
        type: 'list', allowBlank: true, formulae: [`"${VALID_SHORTCODES.join(',')}"`],
        showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Invalid Status', error: 'Please select a valid status.'
      };
      cell.alignment = { horizontal: 'center' };
      row.getCell(c+1).alignment = { horizontal: 'center' };
      row.getCell(c+2).alignment = { horizontal: 'center' };
      
      row.getCell(c+1).numFmt = '0.0';
      row.getCell(c+2).numFmt = '0.0';
    }
    
    row.getCell(totalColIndex).font = { bold: true };
    row.getCell(totalColIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  });

  // Apply conditional formatting
  for(let c=3; c<totalColIndex; c+=3) {
      const colLetter = sheet.getColumn(c).letter;
      applyStatusConditionalFormatting(sheet, `${colLetter}11:${colLetter}${10 + employees.length}`);
  }
  
  // Protect structure
  sheet.protect('nexus123', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false, formatColumns: false, formatRows: false,
    insertColumns: false, insertRows: false,
    deleteColumns: false, deleteRows: false
  });

  // Unlock editable cells
  for(let r=11; r<=10+employees.length; r++) {
      for(let c=3; c<totalColIndex; c++) { // Unlocks Status, OT, UT
         sheet.getCell(r, c).protection = { locked: false };
      }
  }
}

export async function generateWeeklyExcelTemplate(weekStartDate: Date, employees: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus Payroll System';
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periodText = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;

  buildHorizontalGridSheet(workbook, 'Weekly Attendance', periodText, dates, employees);
  addInstructionsSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function generateSemiMonthlyExcelTemplate(periodStart: Date, periodEnd: Date, employees: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus Payroll System';
  
  const dates = [];
  const current = new Date(periodStart);
  while(current <= periodEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
  }

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periodText = `${formatDate(dates[0])} – ${formatDate(dates[dates.length-1])}`;

  buildHorizontalGridSheet(workbook, 'Semi-Monthly Attendance', periodText, dates, employees);
  addInstructionsSheet(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function generateMonthlyExcelTemplate(year: number, month: number, employees: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus Payroll System';
  
  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Monthly Summary');
  summarySheet.addRow(['NEXUS']);
  summarySheet.getRow(1).font = { bold: true, size: 16 };
  
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  summarySheet.addRow([`MONTHLY ATTENDANCE SUMMARY — ${monthName.toUpperCase()} ${year}`]);
  summarySheet.getRow(2).font = { bold: true, size: 14 };
  summarySheet.addRow([]);
  
  summarySheet.addRow(['Employee Code', 'Employee', 'Present', 'Absent', 'Leave', 'Rest Day', 'OT Hrs', 'UT Hrs']);
  summarySheet.getRow(4).font = { bold: true };
  
  employees.forEach(emp => {
      // We leave these blank; they act as placeholders for the export
      summarySheet.addRow([emp.employee_code, `${emp.first_name} ${emp.last_name}`, '', '', '', '', '', '']);
  });
  
  summarySheet.columns.forEach(c => { c.width = 12; });
  summarySheet.getColumn(1).width = 15;
  summarySheet.getColumn(2).width = 30;
  
  summarySheet.protect('nexus123', { selectLockedCells: true, selectUnlockedCells: true });

  // Sheet 2: Calendar
  const calSheet = workbook.addWorksheet('Monthly Calendar', {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }]
  });
  
  calSheet.addRow(['Employee Code', 'Employee', 'Mon', '', '', 'Tue', '', '', 'Wed', '', '', 'Thu', '', '', 'Fri', '', '', 'Sat', '', '', 'Sun', '', '']);
  const daysOfWeekHeader = calSheet.getRow(1);
  daysOfWeekHeader.font = { bold: true };
  daysOfWeekHeader.alignment = { horizontal: 'center' };
  
  let startCol = 3;
  for(let i=0; i<7; i++) {
      calSheet.mergeCells(1, startCol, 1, startCol+2);
      startCol += 3;
  }
  
  const subHeader = ['',''];
  for(let i=0; i<7; i++) subHeader.push('Status','OT','UT');
  const subHeaderRow = calSheet.addRow(subHeader);
  subHeaderRow.font = { bold: true, size: 10 };
  subHeaderRow.alignment = { horizontal: 'center' };

  calSheet.getColumn(1).width = 15;
  calSheet.getColumn(2).width = 30;
  for(let c=3; c<24; c+=3) {
      calSheet.getColumn(c).width = 10;
      calSheet.getColumn(c+1).width = 8;
      calSheet.getColumn(c+2).width = 8;
  }

  // Generate weeks
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const currentWeekStart = new Date(startDate);
  const day = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart.setDate(diff); 
  
  let currentRow = 3;
  let weekNum = 1;
  const formatShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  while(currentWeekStart <= endDate) {
      calSheet.addRow([`Week ${weekNum}`]);
      calSheet.getRow(currentRow).font = { bold: true };
      calSheet.mergeCells(currentRow, 1, currentRow, 23);
      calSheet.getRow(currentRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0D0D0' } };
      currentRow++;
      
      const weekDatesRow = ['',''];
      const weekDates: Date[] = [];
      for(let i=0; i<7; i++) {
          const d = new Date(currentWeekStart);
          d.setDate(d.getDate() + i);
          weekDates.push(d);
          weekDatesRow.push(formatShort(d), '', '');
      }
      const wdr = calSheet.addRow(weekDatesRow);
      wdr.font = { bold: true, color: { argb: 'FF555555' } };
      wdr.alignment = { horizontal: 'center' };
      wdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      
      let mergeCol = 3;
      for(let i=0; i<7; i++) {
          calSheet.mergeCells(currentRow, mergeCol, currentRow, mergeCol+2);
          mergeCol += 3;
      }
      currentRow++;

      employees.forEach(emp => {
          const empRow = [emp.employee_code, `${emp.first_name} ${emp.last_name}`];
          for(let i=0; i<7; i++) {
              if (weekDates[i].getMonth() + 1 === month) {
                  empRow.push('', '', ''); // Editable
              } else {
                  empRow.push('N/A', '', ''); // Out of month
              }
          }
          const row = calSheet.addRow(empRow);
          
          for(let c=3; c<24; c+=3) {
              const cell = row.getCell(c);
              if (cell.value !== 'N/A') {
                  cell.dataValidation = { type: 'list', allowBlank: true, formulae: [`"${VALID_SHORTCODES.join(',')}"`], showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Invalid', error: 'Please select a valid status.' };
                  row.getCell(c+1).numFmt = '0.0';
                  row.getCell(c+2).numFmt = '0.0';
              } else {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
              }
              cell.alignment = { horizontal: 'center' };
              row.getCell(c+1).alignment = { horizontal: 'center' };
              row.getCell(c+2).alignment = { horizontal: 'center' };
          }
          currentRow++;
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNum++;
  }

  // Protect Calendar sheet structure
  calSheet.protect('nexus123', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false, formatColumns: false, formatRows: false,
    insertColumns: false, insertRows: false,
    deleteColumns: false, deleteRows: false
  });

  // Unlock all editable cells in Calendar sheet
  calSheet.eachRow((row, rowNumber) => {
      // Row 1 & 2 are headers. Sub-headers are also locked. 
      // We only unlock employee rows. Employee rows always have the employee code in column 1.
      const firstCell = row.getCell(1).value;
      if (typeof firstCell === 'string' && firstCell.startsWith('EMP-')) {
          for(let c=3; c<=23; c++) {
              if (row.getCell(c).value !== 'N/A') {
                  row.getCell(c).protection = { locked: false };
              }
          }
      }
  });

  addInstructionsSheet(workbook);
  
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
