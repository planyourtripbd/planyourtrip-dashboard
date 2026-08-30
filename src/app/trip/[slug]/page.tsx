import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: '700' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

type Props = {
  params: Promise<{ slug: string }>
}

async function getTrip(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('trips')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const trip = await getTrip(slug)
  if (!trip) return { title: 'Trip Not Found | Plan Your Trip' }
  return {
    title: trip.meta_title || `${trip.name} | Plan Your Trip`,
    description: trip.meta_description || trip.summary || undefined,
  }
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params
  const trip = await getTrip(slug)
  if (!trip) notFound()

  const waMessage = encodeURIComponent(`Hi! I'm interested in the ${trip.name}.`)
  const paragraphs: string[] = trip.description ? trip.description.split('\n\n') : []
  const highlights: string[] = trip.highlights || []

  return (
    <main style={pageStyle}>
      <div style={heroStyle}>
        {trip.hero_image_url && (
          <img src={trip.hero_image_url} alt={trip.name} style={heroImgStyle} />
        )}
        <div style={heroOverlay} />
        <div style={heroContent}>
          <p style={eyebrowStyle} className={inter.className}>Plan Your Trip</p>
          <h1 style={titleStyle} className={spaceGrotesk.className}>{trip.name}</h1>
          {trip.tagline && (
            <p style={taglineStyle} className={inter.className}>{trip.tagline}</p>
          )}
        </div>
      </div>

      <div style={bodyStyle} className={inter.className}>
        {trip.summary && <p style={summaryStyle}>{trip.summary}</p>}

        {paragraphs.map((para, i) => (
          <p key={i} style={paraStyle}>{para}</p>
        ))}

        {highlights.length > 0 && (
          <div style={highlightsBox}>
            <h2 style={highlightsTitle} className={spaceGrotesk.className}>Trip Highlights</h2>
            <ul style={highlightsList}>
              {highlights.map((h, i) => (
                <li key={i} style={highlightItem}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={ctaRow}>
          <a href={`/book/${trip.id}`} style={bookBtn}>Book Now</a>
          
            <a href={`https://wa.me/8801891505075?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            style={waBtn}
          >
            Chat on WhatsApp
          </a>
        </div>

        <a href="https://planyourtripbd.github.io/" style={backLink}>&larr; Plan Your Trip</a>
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = { minHeight: '100vh', background: '#ffffff' }
const heroStyle: CSSProperties = { position: 'relative', height: '52vh', minHeight: 360, background: '#0f1c28' }
const heroImgStyle: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
const heroOverlay: CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(to bottom, rgba(15,28,40,0.1), rgba(15,28,40,0.9))',
}
const heroContent: CSSProperties = {
  position: 'absolute', bottom: 0, left: 0, right: 0,
  padding: '2.5rem 1.5rem', maxWidth: 780, margin: '0 auto',
}
const eyebrowStyle: CSSProperties = { color: '#2dd4bf', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }
const titleStyle: CSSProperties = { color: '#fff', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, marginBottom: 8 }
const taglineStyle: CSSProperties = { color: 'rgba(255,255,255,0.85)', fontSize: 16 }
const bodyStyle: CSSProperties = { maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }
const summaryStyle: CSSProperties = { fontSize: 18, color: '#0f1c28', fontWeight: 500, marginBottom: 24, lineHeight: 1.6 }
const paraStyle: CSSProperties = { fontSize: 15.5, color: '#374151', lineHeight: 1.75, marginBottom: 18 }
const highlightsBox: CSSProperties = { background: '#f4faf9', border: '1px solid #d7f2ee', borderRadius: 14, padding: '1.5rem 1.75rem', margin: '2rem 0' }
const highlightsTitle: CSSProperties = { fontSize: 18, fontWeight: 700, color: '#0f1c28', marginBottom: 14 }
const highlightsList: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }
const highlightItem: CSSProperties = { fontSize: 14.5, color: '#0f1c28', paddingLeft: 4 }
const ctaRow: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', margin: '2.5rem 0 2rem' }
const bookBtn: CSSProperties = { background: '#2dd4bf', color: '#0f1c28', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }
const waBtn: CSSProperties = { background: '#0f1c28', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }
const backLink: CSSProperties = { display: 'inline-block', fontSize: 13, color: '#2dd4bf', textDecoration: 'none', fontWeight: 500 }