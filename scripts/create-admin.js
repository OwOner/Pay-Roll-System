const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Security Error: Cannot run development admin seed in production environment.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// For admin actions, we MUST use the Service Role Key, not the Anon Key!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' 

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  console.log('Creating admin user...')
  
  // 1. Create the user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@nexus.com',
    password: 'password123',
    email_confirm: true
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
        console.log('User admin@nexus.com already exists.')
    } else {
        console.error('Error creating user:', authError)
        return
    }
  }

  // Get the user ID (either newly created or existing)
  let userId
  if (authData?.user) {
      userId = authData.user.id
  } else {
      // Fetch existing user if already created
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users.find(u => u.email === 'admin@nexus.com')
      if (existingUser) userId = existingUser.id
  }

  if (!userId) {
      console.error('Could not determine user ID')
      return
  }

  // 2. Get the Super Admin role ID
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'Super Admin')
    .single()

  if (roleError) {
    console.error('Error fetching role:', roleError)
    return
  }

  // 3. Update the user's profile with the role ID
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role_id: roleData.id, full_name: 'Nexus Admin' })
    .eq('id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  } else {
    console.log('✅ Super Admin created successfully!')
    console.log('Email: admin@nexus.com')
    console.log('Password: password123')
  }
}

createAdmin()
