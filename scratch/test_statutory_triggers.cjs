const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
let url, key;
lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function runTests() {
  console.log('--- Verifying Phase 6A Task 2: Statutory Schedules & Immutability ---');

  // 1. Create a dummy schedule
  const { data: schedule, error: schErr } = await supabase.from('company_statutory_schedules').insert({
    name: 'Test Schedule ' + Date.now(),
    pay_frequency: 'Semi-Monthly',
    effective_from: '2026-01-01',
    is_active: true
  }).select().single();

  if (schErr) throw new Error('Failed to create schedule: ' + schErr.message);
  console.log('✅ Schedule created:', schedule.id);

  // 2. Create allocations
  await supabase.from('statutory_schedule_allocations').insert({
    schedule_id: schedule.id,
    period_sequence: 1,
    contribution_type: 'SSS',
    allocation_percentage: 100
  });
  console.log('✅ Allocations created.');

  // 3. Create a Payroll Period
  const { data: period, error: perErr } = await supabase.from('payroll_periods').insert({
    period_start: '2026-09-01',
    period_end: '2026-09-15',
    pay_date: '2026-09-15',
    pay_frequency: 'Semi-Monthly',
    statutory_schedule_id: schedule.id,
    contribution_month: '2026-09-01',
    period_sequence: 1,
    statutory_configuration_status: 'Configured'
  }).select().single();

  if (perErr) throw new Error('Failed to create period: ' + perErr.message);
  console.log('✅ Payroll Period created linked to schedule.');

  // 4. Test Immutability: Initially, we CAN edit the schedule because payroll isn't Approved
  const { error: editErr1 } = await supabase.from('company_statutory_schedules')
    .update({ name: 'Edited Name' }).eq('id', schedule.id);
  if (editErr1) throw new Error('Failed to edit schedule BEFORE locking: ' + editErr1.message);
  console.log('✅ Schedule successfully edited before locking.');

  // 5. Create a Payroll Run and set to Approved
  const { data: run, error: runErr } = await supabase.from('payroll_runs').insert({
    payroll_period_id: period.id,
    status: 'Approved'
  }).select().single();
  if (runErr) throw new Error('Failed to create run: ' + runErr.message);
  console.log('✅ Payroll Run created and Approved.');

  // 6. Test Immutability: Now we CANNOT edit the schedule
  const { error: editErr2 } = await supabase.from('company_statutory_schedules')
    .update({ name: 'Should Fail' }).eq('id', schedule.id);
  
  if (!editErr2) {
    throw new Error('❌ IMMUTABILITY FAILURE: Was able to edit a schedule linked to an Approved payroll run.');
  } else {
    console.log('✅ Immutability verified on company_statutory_schedules (Expected Error:', editErr2.message, ')');
  }

  // 7. Test Immutability: Cannot edit allocations
  const { error: allocErr } = await supabase.from('statutory_schedule_allocations')
    .update({ allocation_percentage: 50 }).eq('schedule_id', schedule.id);
  if (!allocErr) {
    throw new Error('❌ IMMUTABILITY FAILURE: Was able to edit allocations linked to an Approved payroll run.');
  } else {
    console.log('✅ Immutability verified on statutory_schedule_allocations (Expected Error:', allocErr.message, ')');
  }

  // 8. Test Immutability: Cannot edit payroll_period's statutory config
  const { error: ppErr } = await supabase.from('payroll_periods')
    .update({ statutory_schedule_id: null }).eq('id', period.id);
  if (!ppErr) {
    throw new Error('❌ IMMUTABILITY FAILURE: Was able to modify payroll_period config linked to an Approved payroll run.');
  } else {
    console.log('✅ Immutability verified on payroll_periods (Expected Error:', ppErr.message, ')');
  }

  // Cleanup
  await supabase.from('payroll_runs').delete().eq('id', run.id);
  await supabase.from('payroll_periods').delete().eq('id', period.id);
  await supabase.from('company_statutory_schedules').delete().eq('id', schedule.id);
  console.log('✅ Cleanup successful. All Phase 6A Task 2 tests passed.');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
