const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let changedCount = 0;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('uuid_generate_v4()')) {
    content = content.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
    fs.writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Replaced uuid_generate_v4() with gen_random_uuid() in ${changedCount} files.`);
