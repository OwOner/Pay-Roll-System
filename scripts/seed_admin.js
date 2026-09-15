import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54531';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  console.log("Seeding admin user...");
  
  // 1. Create User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@nexus.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'System Admin' }
  });

  if (authError) {
    console.error("Error creating user:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Created user with ID:", userId);

  // 2. Assign Role
  // Wait a second for trigger to create profile
  await new Promise(r => setTimeout(r, 1000));
  
  const { data: role } = await supabase.from('roles').select('id').eq('name', 'Super Admin').single();
  
  if (role) {
    const { error: profileError } = await supabase.from('profiles').update({ role_id: role.id, role: 'Super Admin' }).eq('id', userId);
    if (profileError) {
       console.error("Error updating profile role:", profileError);
    } else {
       console.log("Successfully assigned Super Admin role!");
    }
  }
  
  console.log("Done.");
}

seedAdmin();
