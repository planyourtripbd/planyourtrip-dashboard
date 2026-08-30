import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { ReactNode, CSSProperties } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export default async function BookTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = createAdminClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (!trip) {
    return (
      <main className={`${body.className} min-h-screen flex items-center justify-center bg-[#0f1c28] text-center px-6`}>
        <div>
          <h1 className={`${display.className} text-2xl text-white mb-2`}>Trip not found</h1>
          <p className="text-white/60">This link looks incorrect or the trip is no longer available.</p>
        </div>
      </main>
    )
  }

  async function submitBooking(formData: FormData) {
    'use server'

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const numPeople = Number(formData.get('numPeople')) || 1
    const notes = formData.get('notes') as string

    const supabase = createAdminClient()

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ full_name: fullName, phone, email: email || null })
      .select()
      .single()

    if (customerError || !customer) {
      throw new Error('Could not save your details. Please try again.')
    }

    const { error: bookingError } = await supabase.from('bookings').insert({
      trip_id: tripId,
      customer_id: customer.id,
      num_people: numPeople,
      notes: notes || null,
    })

    if (bookingError) {
      throw new Error('Could not save your booking. Please try again.')
    }

    redirect(`/book/${tripId}/success`)
  }

  return (
    <main className={`${body.className} relative min-h-screen overflow-hidden px-6 py-16`}>
      <Atmosphere />

      <div className="relative max-w-md mx-auto">
        <a
          href="https://planyourtripbd.github.io/"
          className="inline-block text-[13px] font-medium text-[#2dd4bf] hover:text-white transition-colors mb-8"
        >
          &larr; Plan Your Trip
        </a>

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#2dd4bf]">
              Booking Request
            </span>
            <span className="flex-1 h-px bg-white/25 max-w-[60px]" />
          </div>
          <h1 className={`${display.className} text-[28px] leading-tight tracking-tight text-white mb-2`}>
            {trip.title}
          </h1>
          <p className="text-[14px] text-white/75">
            {trip.departure_date} &middot; &#2547;{trip.price} per person
          </p>
        </div>

        <form action={submitBooking} style={cardStyle} className="rounded-2xl p-6 space-y-5">
          <Field label="Full Name">
            <input name="fullName" required style={inputStyle} />
          </Field>
          <Field label="Phone Number">
            <input name="phone" required style={inputStyle} />
          </Field>
          <Field label="Email (optional)">
            <input name="email" type="email" style={inputStyle} />
          </Field>
          <Field label="Number of People">
            <input name="numPeople" type="number" min={1} defaultValue={1} required style={inputStyle} />
          </Field>
          <Field label="Notes (optional)">
            <textarea name="notes" rows={3} style={inputStyle} />
          </Field>

          <button
            type="submit"
            className="w-full hover:opacity-90 hover:-translate-y-0.5 transition-all text-[#14212c] font-bold text-[14px] tracking-wide py-3.5 rounded-lg"
            style={{ background: '#2dd4bf' }}
          >
            Request to Book
          </button>
        </form>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/80 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

/** The exact sky / mountain / sea scene from the main site's CTA section, as a full-page backdrop */
export function Atmosphere() {
  return (
    <>
      <div
        className="fixed inset-0 -z-30"
        style={{
          background:
            'linear-gradient(180deg, #060f1d 0%, #0e2138 28%, #234863 52%, #a8562f 78%, #e0975a 100%)',
        }}
      />
      <div
        className="fixed inset-0 -z-20 opacity-80"
        style={{
          background: `
            radial-gradient(1.4px 1.4px at 10% 14%, #fff 100%, transparent),
            radial-gradient(1.4px 1.4px at 24% 8%, #fff 100%, transparent),
            radial-gradient(1px 1px at 38% 20%, #fff 100%, transparent),
            radial-gradient(1.4px 1.4px at 63% 10%, #fff 100%, transparent),
            radial-gradient(1px 1px at 78% 17%, #fff 100%, transparent),
            radial-gradient(1.4px 1.4px at 92% 24%, #fff 100%, transparent),
            radial-gradient(1px 1px at 50% 6%, #fff 100%, transparent),
            radial-gradient(1px 1px at 15% 38%, #fff 100%, transparent),
            radial-gradient(1.2px 1.2px at 85% 42%, #fff 100%, transparent)
          `,
        }}
      />
      <svg
        className="fixed left-0 right-0 -z-20 w-full"
        style={{ bottom: '22%', height: '40%' }}
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="rgba(12,24,40,0.45)" d="M0,220 L150,120 L300,200 L420,90 L560,190 L700,60 L850,180 L1000,110 L1200,210 L1200,300 L0,300 Z" />
        <path fill="rgba(10,20,34,0.65)" d="M0,260 L180,170 L350,240 L520,150 L680,230 L860,140 L1050,220 L1200,180 L1200,300 L0,300 Z" />
        <path fill="rgba(6,13,23,0.9)" d="M0,290 L200,230 L400,280 L620,210 L820,270 L1000,220 L1200,260 L1200,300 L0,300 Z" />
      </svg>
      <div
        className="fixed left-0 right-0 bottom-0 -z-20"
        style={{ height: '22%', background: 'linear-gradient(180deg, #0c2836 0%, #071722 100%)' }}
      />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 22%, transparent 68%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </>
  )
}

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(10,20,29,0.55)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  color: '#ffffff',
}