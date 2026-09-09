import { loadPayrollContext } from "../src/lib/payroll/service";
import { calculatePayroll } from "../src/lib/payroll/engine";

async function run() {
  const empId = "926fa8c6-ce8e-4554-830a-c1f58cf77200"; // Ramon Adion
  const start = "2026-08-30";
  const end = "2026-09-05";
  const freq = "Weekly";

  console.log("Loading context...");
  const ctx = await loadPayrollContext(empId, start, end, freq as any);
  console.log("Context loaded! Active Policy:", ctx.activePolicy ? ctx.activePolicy.name : "None");
  console.log("Timesheet details count:", ctx.timesheet.details?.length ?? 0);
  
  const res = calculatePayroll(ctx, ctx.activePolicy as any);
  console.log("Result gross pay:", res.gross_pay.toString());
}
run().catch(console.error);
