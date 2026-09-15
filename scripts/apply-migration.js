const fs = require('fs');
const { execSync } = require('child_process');

const sql = fs.readFileSync('supabase/migrations/018_cash_advances.sql', 'utf8');
const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

for (let stmt of stmts) {
    console.log('Executing:', stmt.substring(0, 50) + '...');
    try {
        const cmd = `npx supabase db query "${stmt.replace(/"/g, '\\"')}"`;
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error('Failed on', stmt);
        process.exit(1);
    }
}
console.log('All executed');
