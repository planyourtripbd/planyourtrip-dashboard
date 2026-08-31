import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from '@/components/LogoutButton'

async function assignToMe(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from('bookings')
    .update({ assigned_agent_id: user.id })
    .eq('id', id)
    .is('assigned_agent_id', null)

  revalidatePath('/agent/bookings')
}

async function confirmBooking(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()

  await admin
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .eq('assigned_agent_id', user.id)

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

  revalidatePath('/agent/bookings')
}

async function markAsPaid(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from('bookings')
    .update({ payment_status: 'paid' })
    .eq('id', id)
    .eq('assigned_agent_id', user.id)

  revalidatePath('/agent/bookings')
}

async function markAsUnpaid(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from('bookings')
    .update({ payment_status: 'unpaid' })
    .eq('id', id)
    .eq('assigned_agent_id', user.id)

  revalidatePath('/agent/bookings')
}

export default async function AgentBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, name')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'sales_agent') {
    redirect('/login')
  }

  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('bookings')
    .select(
      'id, num_people, status, payment_status, created_at, assigned_agent_id, trips ( name, slug ), customers ( full_name, phone, email )'
    )
    .order('created_at', { ascending: false })

  const { data: agents } = await admin
    .from('user_roles')
    .select('user_id, name')
    .in('role', ['sales_agent', 'admin'])

  const agentNameMap: Record<string, string> = {}
  agents?.forEach((a: any) => {
    agentNameMap[a.user_id] = a.name || 'Unnamed'
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            My Sales Dashboard — {roleData?.name || 'Agent'}
          </h1>
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
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => {
                  const isMine = b.assigned_agent_id === user.id
                  const isUnassigned = !b.assigned_agent_id
                  const assignedName = isUnassigned
                    ? null
                    : agentNameMap[b.assigned_agent_id] || 'Someone'

                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-3 text-gray-900">{b.customers?.full_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{b.customers?.phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{b.customers?.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{b.trips?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{b.status}</td>
                      <td className="px-4 py-3 text-gray-900">{b.payment_status}</td>
                      <td className="px-4 py-3">
                        {isUnassigned ? (
                          <span className="text-gray-400">Unassigned</span>
                        ) : isMine ? (
                          <span className="text-teal-700 font-medium">You</span>
                        ) : (
                          <span className="text-gray-500">{assignedName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isUnassigned && (
                          <form action={assignToMe}>
                            <input type="hidden" name="id" value={b.id} />
                            <button
                              type="submit"
                              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 w-full"
                            >
                              Assign to Me
                            </button>
                          </form>
                        )}

                        {isMine && (
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
                        )}

                        {!isUnassigned && !isMine && (
                          <span className="text-xs text-gray-400">No access</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}