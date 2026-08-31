import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from '@/components/LogoutButton'

async function updateProfile(formData: FormData) {
  'use server'
  const userId = formData.get('user_id') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const admin = createAdminClient()
  await admin
    .from('customers')
    .update({ full_name: fullName, phone })
    .eq('auth_user_id', userId)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers')
    .select('id, full_name, phone, email')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <LogoutButton />
        </div>

        <form action={updateProfile} className="bg-white rounded-lg shadow p-6 space-y-4">
          <input type="hidden" name="user_id" value={user.id} />

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Full Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={customer?.full_name || ''}
              required
              className="w-full px-3 py-2 border rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Phone</label>
            <input
              type="text"
              name="phone"
              defaultValue={customer?.phone || ''}
              required
              className="w-full px-3 py-2 border rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
            <input
              type="email"
              value={customer?.email || ''}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email can&apos;t be changed here. Contact us if you need to update it.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>

          <a href="/dashboard" className="block text-center text-sm text-gray-600 hover:underline">
            Cancel
          </a>
        </form>
      </div>
    </div>
  )
}