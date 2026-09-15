"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()
  const adminAuth = await createAdminClient()

  // 1. Prepare Employee Data
  const rawDept = formData.get('department_id') as string
  const rawPos = formData.get('position_id') as string
  
  const department_id = rawDept && rawDept !== 'none' ? rawDept : null
  const position_id = rawPos && rawPos !== 'none' ? rawPos : null

  const newEmployee: any = {
    first_name: formData.get("first_name") as string,
    middle_name: formData.get("middle_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    gender: formData.get("gender") as string,
    location: formData.get("location") as string,
    employee_code: formData.get("employee_code") as string,
    date_hired: formData.get("date_hired") as string,
    employment_type: formData.get("employment_type") as string,
    employment_status: formData.get("employment_status") as string,
    department_id,
    position_id,
    sss_number: formData.get("sss_number") as string,
    philhealth_number: formData.get("philhealth_number") as string,
    pagibig_number: formData.get("pagibig_number") as string,
    tin_number: formData.get("tin_number") as string,
  }

  if (!newEmployee.employee_code) {
    // Auto-generate employee code based on total count
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
    
    // Add 1 and pad with zeros. Also append a random char to avoid race conditions.
    const newId = (count || 0) + 1
    const randomChar = Math.random().toString(36).substring(2, 4).toUpperCase()
    newEmployee.employee_code = `EMP-${newId.toString().padStart(4, '0')}-${randomChar}`
  }

  // Remove empty strings
  Object.keys(newEmployee).forEach(key => {
    if (newEmployee[key] === "") {
      delete newEmployee[key]
    }
  })

  // Handle Avatar Upload First (so we have the URL)
  const avatarFile = formData.get("avatar") as File
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // We upload with the standard client, which is fine since the user uploading is an admin
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile)

    if (uploadError) {
      console.error("Avatar upload failed:", uploadError)
    } else {
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      newEmployee.avatar_url = publicUrlData.publicUrl
    }
  }

  // 2. Insert Employee
  const { data: employeeData, error: empError } = await supabase
    .from("employees")
    .insert(newEmployee)
    .select("id")
    .single()

  if (empError) {
    throw new Error(`Failed to create employee record: ${empError.message}`)
  }

  const employeeId = employeeData.id

  // 2b. Insert Initial Statutory Profile
  const { error: profileStatError } = await supabase
    .from('employee_statutory_profiles')
    .insert({
      employee_id: employeeId,
      sss_applicable: formData.get("sss_applicable") === "true",
      philhealth_applicable: formData.get("philhealth_applicable") === "true",
      pagibig_applicable: formData.get("pagibig_applicable") === "true",
      effective_from: newEmployee.date_hired,
      reason: 'Initial setup on hire'
    })

  if (profileStatError) {
    console.error("Failed to set statutory profile:", profileStatError)
  }

  // 3. Provision System Account if requested
  const createAccount = formData.get("create_account") === "true"
  
  if (createAccount) {
    const initialPassword = formData.get("initial_password") as string
    
    // 3a. Create Auth Account
    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email: newEmployee.email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${newEmployee.first_name} ${newEmployee.last_name}`
      }
    })

    if (authError) {
      // Rollback employee if Auth creation fails
      await supabase.from("employees").delete().eq("id", employeeId)
      throw new Error(`Failed to provision system account: ${authError.message}. Employee creation was rolled back.`)
    }

    const userId = authData.user.id

    // 3b. Build Permissions JSON
    const permissions = {
      dashboard: formData.get("perm_dashboard") === "true",
      employees: formData.get("perm_employees") === "true",
      attendance: formData.get("perm_attendance") === "true",
      leave: formData.get("perm_leave") === "true",
      payroll: formData.get("perm_payroll") === "true",
      history: formData.get("perm_history") === "true",
      reports: formData.get("perm_reports") === "true",
      settings: formData.get("perm_settings") === "true",
      users: formData.get("perm_users") === "true",
      audit: formData.get("perm_audit") === "true",
    }

    // 3c. Get 'Employee' role id
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Viewer') // Fallback to viewer or 'Employee' if it exists. For now let's use Viewer if Employee doesn't exist
      .single()

    // 3d. Update Profile
    // The handle_new_user trigger already created a profile. We just need to update it.
    const { error: profileError } = await adminAuth
      .from('profiles')
      .update({
        employee_id: employeeId,
        permissions: permissions,
        role_id: roleData?.id
      })
      .eq('id', userId)

    if (profileError) {
      console.error("Failed to link profile:", profileError)
    }
  }

  // 2c. Insert Initial Compensation Profile (if provided)
  const salaryBasis = formData.get("salary_basis") as string
  const rate = formData.get("rate") as string
  const payFrequency = formData.get("pay_frequency") as string

  if (salaryBasis && rate && parseFloat(rate) > 0) {
    const { error: compError } = await supabase
      .from('employee_compensation_history')
      .insert({
        employee_id: employeeId,
        salary_basis: salaryBasis,
        rate: parseFloat(rate),
        pay_frequency: payFrequency || 'Semi-Monthly',
        effective_from: newEmployee.date_hired,
        reason: 'Initial setup on hire'
      })

    if (compError) {
      console.error("Error inserting compensation profile:", compError)
      // Non-fatal, we continue
    }
  }

  // Redirect to the new employee's profile
  redirect(`/employees/${employeeId}`)
}
