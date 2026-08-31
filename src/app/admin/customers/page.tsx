import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminCustomersPage() {
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
  const { data: customers } = await admin
    .from('customers')
    .select('id, full_name, phone, email, auth_user_id, created_at')
    .order('created_at', { ascending: false })

  const { data: bookings } = await admin
    .from('bookings')
    .select('customer_id, assigned_agent_id, created_at')
    .order('created_at', { ascending: false })

  const { data: agents } = await admin
    .from('user_roles')
    .select('user_id, name')
    .eq('role', 'sales_agent')

  const agentNameMap: Record<string, string> = {}
  agents?.forEach((a: any) => {
    agentNameMap[a.user_id] = a.name || 'Unnamed'
  })

  const latestAgentByCustomer: Record<string, string | null> = {}
  bookings?.forEach((b: any) => {
    if (!(b.customer_id in latestAgentByCustomer)) {
      latestAgentByCustomer[b.customer_id] = b.assigned_agent_id
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <Link href="/admin/bookings" className="text-sm text-teal-700 hover:underline">
              View Bookings →
            </Link>
          </div>
          <LogoutButton />
        </div>

        {(!customers || customers.length === 0) && (
          <p className="text-gray-600">No customers yet.</p>
        )}

        {customers && customers.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Account Set Up</th>
                  <th className="px-4 py-3">Handled By</th>
                  <th className="px-4 py-3">Added At</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => {
                  const agentId = latestAgentByCustomer[c.id]
                  const handledBy = agentId ? (agentNameMap[agentId] || 'Unnamed') : null

                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 text-gray-900">{c.full_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{c.phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{c.email || '-'}</td>
                      <td className="px-4 py-3">
                        {c.auth_user_id ? (
                          <span className="text-teal-700 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {handledBy ? (
                          <span className="text-gray-900">{handledBy}</span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(c.created_at).toLocaleDateString()}
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