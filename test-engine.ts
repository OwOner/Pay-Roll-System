import { loadPayrollContext } from "./src/lib/payroll/service";
import { calculatePayroll } from "./src/lib/payroll/engine";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  try {
    const employeeId = "1e55e8ce-f087-4fa5-a74e-ebcbccacc3d5"; // reen Es[anp
    const start = "2026-07-26";
    const end = "2026-09-05";
    const freq = "Weekly";
    
    console.log("Loading context...");
    const context = await loadPayrollContext(employeeId, start, end, freq as any);
    
    console.log("Context loaded.");
    console.log("Attendance count:", context.attendance.length);
    if (context.attendance.length > 0) {
      console.log("First attendance record date:", context.attendance[0].record_date);
    }
    console.log("Active comp:", context.employee.history[0]);
    
    const result = calculatePayroll(context, { id: "policy-1", name: "Standard", scheduled_hours_per_day: 8, scheduled_days_per_week: 5, rest_days: ["Saturday", "Sunday"], rest_days_paid: false, daily_rate_method: "annualized_261", annualization_factor: 261, custom_day_rules: {} } as any);
    console.log("Gross Pay:", result.gross_pay.toString());
    console.log("Net Pay:", result.net_pay.toString());
  } catch (err) {
    console.error("Engine Error:", err);
  }
}

run();
