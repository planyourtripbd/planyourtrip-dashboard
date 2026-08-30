import { Space_Grotesk, Inter } from 'next/font/google'
import { Atmosphere } from '../page'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })
const body = Inter({ subsets: ['latin'], weight: ['400', '500'] })

export default function BookingSuccessPage() {
  return (
    <main className={`${body.className} relative min-h-screen flex items-center justify-center px-6`}>
      <Atmosphere />
      <div className="relative max-w-md text-center">
        <div className="text-5xl mb-5">🎉</div>
        <h1 className={`${display.className} text-2xl text-white mb-3`}>Thanks — request received!</h1>
        <p className="text-white/75 text-[15px] leading-relaxed">
          We&apos;ve got your booking request. Our team will reach out on WhatsApp within 24 hours to confirm your spot.
        </p>
        <a
          href="https://planyourtripbd.github.io/"
          className="inline-block mt-8 text-[13px] font-semibold tracking-wide text-[#2dd4bf] hover:text-white transition-colors"
        >
          ← Back to Plan Your Trip
        </a>
      </div>
    </main>
  )
}