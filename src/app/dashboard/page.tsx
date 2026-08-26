import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Dashboard
        </h1>
        <p className="text-gray-600">
          Logged in as: <span className="font-medium text-gray-900">{user.email}</span>
        </p>
      </div>
    </div>
  )
}