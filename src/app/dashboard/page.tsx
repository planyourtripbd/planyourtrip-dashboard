import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
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

  let bookings: any[] = []

  if (customer) {
    const { data } = await admin
      .from('bookings')
      .select('id, num_people, status, payment_status, created_at, trips ( name, slug )')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    bookings = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {customer?.full_name || user.email}
          </h1>
          <LogoutButton />
        </div>
        <p className="text-gray-600 mb-6">Logged in as: {user.email}</p>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Bookings</h2>

        {bookings.length === 0 && (
          <p className="text-gray-600">You have no bookings yet.</p>
        )}

        {bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">People</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Booked At</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 text-gray-900">{b.trips?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.num_people}</td>
                    <td className="px-4 py-3 text-gray-900 capitalize">{b.status}</td>
                    <td className="px-4 py-3 text-gray-900 capitalize">{b.payment_status}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}