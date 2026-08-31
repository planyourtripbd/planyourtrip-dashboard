import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from '@/components/LogoutButton'

async function confirmBooking(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const admin = createAdminClient()

  await admin.from('bookings').update({ status: 'confirmed' }).eq('id', id)

  const { data: booking } = await admin
    .from('bookings')
    .select('customer_id')
    .eq('id', id)
    .single()

  if (booking?.customer_id) {
    const { data: customer } = await admin
      .from('customers')
      .select('id, email, auth_user_id')
      .eq('id', booking.customer_id)
      .single()

    if (customer && !customer.auth_user_id && customer.email) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(
          customer.email,
          { redirectTo: `${siteUrl}/setup-account` }
        )

        if (!error && invited?.user) {
          await admin
            .from('customers')
            .update({ auth_user_id: invited.user.id })
            .eq('id', customer.id)

          await admin
            .from('user_roles')
            .insert({ user_id: invited.user.id, role: 'customer' })
        }
      } catch (err) {
        console.error('Invite email failed:', err)
      }
    }
  }

  revalidatePath('/admin/bookings')
}

async function markAsPaid(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const admin = createAdminClient()
  await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', id)
  revalidatePath('/admin/bookings')
}

async function markAsUnpaid(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const admin = createAdminClient()
  await admin.from('bookings').update({ payment_status: 'unpaid' }).eq('id', id)
  revalidatePath('/admin/bookings')
}

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'admin') {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data: bookings } = await admin
    .from('bookings')
    .select(
      'id, num_people, status, payment_status, notes, created_at, trips ( name, slug ), customers ( full_name, phone, email )'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
            <a href="/admin/customers" className="text-sm text-teal-700 hover:underline">
              View Customers →
            </a>
          </div>
          <LogoutButton />
        </div>

        {(!bookings || bookings.length === 0) && (
          <p className="text-gray-600">No bookings yet.</p>
        )}

        {bookings && bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">People</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Booked At</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 text-gray-900">{b.customers?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.customers?.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.customers?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.trips?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.num_people}</td>
                    <td className="px-4 py-3 text-gray-900">{b.status}</td>
                    <td className="px-4 py-3 text-gray-900">{b.payment_status}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {b.status !== 'confirmed' && (
                          <form action={confirmBooking}>
                            <input type="hidden" name="id" value={b.id} />
                            <button
                              type="submit"
                              className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 w-full"
                            >
                              Confirm
                            </button>
                          </form>
                        )}
                        {b.payment_status === 'paid' ? (
                          <form action={markAsUnpaid}>
                            <input type="hidden" name="id" value={b.id} />
                            <button
                              type="submit"
                              className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 w-full"
                            >
                              Mark as Unpaid
                            </button>
                          </form>
                        ) : (
                          <form action={markAsPaid}>
                            <input type="hidden" name="id" value={b.id} />
                            <button
                              type="submit"
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full"
                            >
                              Mark as Paid
                            </button>
                          </form>
                        )}
                      </div>
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