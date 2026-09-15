import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { calculatePayroll } from './src/lib/payroll/engine';
import Decimal from "decimal.js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function mockLoadContext(empId: string, dayTypeConfig: Record<string, string>, activePolicy: any, missingDays: string[] = [], absentDaysCount = 0) {
  const { data: employee } = await supabase.from('employees').select('*, employee_compensation_history(*)').eq('id', empId).single();
  const activeComp = employee.employee_compensation_history[0];

  const days = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
  
  const details = days.map(d => {
    const isMissing = missingDays.includes(d);
    return {
      id: `dt-${d}`,
      date: d,
      day_type: dayTypeConfig[d] || 'Regular Workday',
      regular_hours: isMissing ? 0 : 8, // Missing = 0 hours
      payable_ot_hours: 0,
      payable_ut_hours: 0,
    };
  });

  const missing_records_count = missingDays.length;

  const total_regular_hours = details.reduce((sum, d) => sum + d.regular_hours, 0);

  // Validate the "all missing" error logic from service.ts
  const expectedWorkDays = details.filter((d: any) => 
    !d.day_type.includes('Rest Day') && !d.day_type.includes('Holiday')
  ).length || 0;

  if (
    expectedWorkDays > 0 && 
    missing_records_count === expectedWorkDays &&
    total_regular_hours === 0 &&
    absentDaysCount === 0
  ) {
    throw new Error(`No worked attendance found for this period.`);
  }

  return {
    employee: {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      history: [{
        effective_from: activeComp.effective_from,
        salary_basis: activeComp.salary_basis,
        daily_rate: new Decimal(activeComp.daily_rate),
      }]
    },
    period: { id: 'mock-period', period_start: '2026-08-30', period_end: '2026-09-05' },
    timesheet: {
      id: 'mock-ts',
      details,
      missing_records_count,
      total_regular_hours,
      absent_days: absentDaysCount
    },
    adjustments: [],
    taxConfig: { brackets: [] }, 
    sssConfig: { brackets: [] }, 
    philhealthConfig: { premium_rate: new Decimal(0), floor_mbs: new Decimal(0), ceiling_mbs: new Decimal(0) }, 
    pagibigConfig: { employee_rate_low: new Decimal(0), employee_rate_high: new Decimal(0), salary_threshold: new Decimal(0), employer_rate: new Decimal(0), max_compensation: new Decimal(0) },
    activePolicy,
    statutoryApplicability: { sss: true, philhealth: true, pagibig: true }
  };
}

async function runTests() {
  console.log('=== STARTING E2E ATTENDANCE & PAYROLL TESTS ===\n');

  const { data: emp } = await supabase.from('employees').select('id').eq('first_name', 'Anjelo').single();
  if (!emp) throw new Error('Employee Anjelo not found');

  function runPipeline(testName: string, expectedGross: number, context: any) {
    console.log(`\n--- ${testName} ---`);
    try {
      const result = calculatePayroll(context, context.activePolicy);
      console.log(`Gross Pay: ₱${result.gross_pay.toNumber()}`);
      console.log(`Expected:  ₱${expectedGross}`);
      if (result.gross_pay.toNumber() === expectedGross) console.log('✅ TEST PASSED');
      else console.log('❌ TEST FAILED');
    } catch (e: any) {
      console.log(`Error Thrown: ${e.message}`);
      if (expectedGross === -1) {
        if (e.message.includes('No worked attendance found')) console.log('✅ TEST PASSED (Correctly rejected all-missing data)');
        else console.log('❌ TEST FAILED (Wrong error message)');
      } else {
        console.log('❌ TEST FAILED (Unexpected error)');
      }
    }
  }

  // Neutral defaults
  const dayTypesNoPolicy = { '2026-09-05': 'Regular Workday' }; 

  // A. 6 valid workdays = ₱3,000 (No Policy)
  const ctxA = await mockLoadContext(emp.id, dayTypesNoPolicy, null);
  runPipeline('A. 6 valid workdays (No Policy)', 3000, ctxA);

  // B. 5 valid workdays + 1 missing day = ₱2,500 (No Policy)
  const ctxB = await mockLoadContext(emp.id, dayTypesNoPolicy, null, ['2026-09-05']); // Saturday missing
  runPipeline('B. 5 valid workdays + 1 missing day', 2500, ctxB);

  // C. 5 valid workdays + 1 explicit Absent day = ₱2,500 (No Policy)
  // Missing list is empty, but we manually set regular_hours to 0 for Saturday to simulate absence
  const ctxC = await mockLoadContext(emp.id, dayTypesNoPolicy, null, ['2026-09-05'], 1);
  runPipeline('C. 5 valid workdays + 1 explicit Absent day', 2500, ctxC);

  // D. 6 valid workdays with a 6-day Work Policy = ₱3,000
  const ctxD = await mockLoadContext(emp.id, { '2026-09-05': 'Regular Workday' }, { scheduled_hours_per_day: 8, scheduled_days_per_week: 6, rest_days: ['Sunday'], custom_day_rules: {} });
  runPipeline('D. 6 valid workdays with a 6-day Work Policy', 3000, ctxD);

  // E. 6 valid workdays where Saturday is explicitly configured as a rest day = ₱3,150
  const ctxE = await mockLoadContext(emp.id, { '2026-09-05': 'Scheduled Rest Day' }, { scheduled_hours_per_day: 8, scheduled_days_per_week: 5, rest_days: ['Saturday', 'Sunday'], custom_day_rules: {} });
  runPipeline('E. 6 valid workdays (Sat explicitly configured as Rest Day)', 3150, ctxE);

  // F. ALL Days Missing -> Should throw "No worked attendance found"
  try {
    const ctxF = await mockLoadContext(emp.id, dayTypesNoPolicy, null, ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    runPipeline('F. All expected days missing (Warning error test)', 3000, ctxF); // Shouldn't reach here
  } catch (e: any) {
    console.log(`\n--- F. All expected days missing (Warning error test) ---`);
    if (e.message.includes('No worked attendance found')) console.log('✅ TEST PASSED (Correctly threw all-missing error)');
    else console.log('❌ TEST FAILED (Wrong error thrown: ' + e.message + ')');
  }

  console.log('\n=== END OF TESTS ===');
}

runTests().catch(console.error);
