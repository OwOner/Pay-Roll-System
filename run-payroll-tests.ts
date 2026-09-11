import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { calculatePayroll } from './src/lib/payroll/engine';
import Decimal from "decimal.js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Fully mock the context in memory
async function mockLoadContext(empId: string, dayTypeConfig: Record<string, string>, activePolicy: any) {
  const { data: employee } = await supabase.from('employees').select('*, employee_compensation_history(*)').eq('id', empId).single();
  const activeComp = employee.employee_compensation_history[0];

  const days = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
  const details = days.map(d => ({
    id: `dt-${d}`,
    date: d,
    day_type: dayTypeConfig[d] || 'Regular Workday',
    regular_hours: 8,
    payable_ot_hours: 0,
    payable_ut_hours: 0,
  }));

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
      details
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
  console.log('=== STARTING END-TO-END PAYROLL PIPELINE TESTS ===\n');

  const { data: emp } = await supabase.from('employees').select('id').eq('first_name', 'Anjelo').single();
  if (!emp) throw new Error('Employee Anjelo not found');

  function runPipeline(testName: string, expectedGross: number, context: any) {
    console.log(`\n--- ${testName} ---`);
    const result = calculatePayroll(context, context.activePolicy);
    console.log(`Gross Pay: ₱${result.gross_pay.toNumber()}`);
    console.log(`Expected:  ₱${expectedGross}`);
    if (result.gross_pay.toNumber() === expectedGross) console.log('✅ TEST PASSED');
    else console.log('❌ TEST FAILED');
  }

  // --- TEST 1: NO POLICY ---
  // No policy, Saturday is worked, defaults to Regular Workday
  const ctx1 = await mockLoadContext(emp.id, {
    '2026-09-05': 'Regular Workday' // timesheet generation without policy defaults to Regular Workday for Saturday
  }, null);
  runPipeline('Test 1: No Policy (6 days worked)', 3000, ctx1);

  // --- TEST 2: 6-DAY POLICY ---
  // Policy has only Sunday as rest day. Saturday is Regular Workday.
  const ctx2 = await mockLoadContext(emp.id, {
    '2026-09-05': 'Regular Workday'
  }, { scheduled_hours_per_day: 8, scheduled_days_per_week: 6, rest_days: ['Sunday'], custom_day_rules: {} });
  runPipeline('Test 2: Construction 6-Day Policy (6 days worked)', 3000, ctx2);

  // --- TEST 3: 5-DAY POLICY (Saturday Rest) ---
  // Policy has Sat and Sun as rest days. Saturday is Scheduled Rest Day.
  const ctx3 = await mockLoadContext(emp.id, {
    '2026-09-05': 'Scheduled Rest Day'
  }, { scheduled_hours_per_day: 8, scheduled_days_per_week: 5, rest_days: ['Saturday', 'Sunday'], custom_day_rules: {} });
  runPipeline('Test 3: Office 5-Day Policy (5 reg days + 1 Sat rest day worked)', 3150, ctx3);

  console.log('\n=== END OF TESTS ===');
}

runTests().catch(console.error);
