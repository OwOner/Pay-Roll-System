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

async function createAdmin() {
  console.log('Creating admin@nexus.com...');
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@nexus.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' }
  });

  let userId = user?.user?.id;

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
      console.log('User already exists in auth. Fetching from profiles...');
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', 'admin@nexus.com').single();
      if (existingUser) {
        userId = existingUser.id;
      } else {
        console.error('User exists in auth but not in profiles.');
        return;
      }
    } else {
      console.error('Auth error:', authError);
      return;
    }
  }

  console.log('User ID:', userId);

  const { data: role } = await supabase.from('roles').select('id').eq('name', 'Super Admin').single();
  if (role) {
    const { error: updateError } = await supabase.from('profiles').update({ role_id: role.id }).eq('id', userId);
    if (updateError) {
       console.error('Error assigning role:', updateError);
    } else {
       console.log('Assigned Super Admin role.');
    }
  } else {
    console.log('Super Admin role not found.');
  }
}

createAdmin();
