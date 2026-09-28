import type { Metadata } from 'next'
import { Mail, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/site/page-header'
import { ContactForm } from '@/components/contact/contact-form'
import { contactInfo, focusRing } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Connect to Masjid team — questions, feedback, or adding your masjid.',
}

export default function ContactPage() {
  const items = [
    { icon: Mail, label: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}` },
    { icon: Phone, label: 'Phone', value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\D/g, '')}` },
    { icon: MapPin, label: 'Location', value: contactInfo.address },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contact Us"
        title="We'd love to hear from you"
        description="Questions, feedback, or want to add your masjid? Send us a message and our team will reply soon, in shaa Allah."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <div>
          <h2 className="text-xl font-bold text-navy">Get in touch</h2>
          <ul className="mt-6 flex flex-col gap-5">
            {items.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-teal">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  {href ? (
                    <a href={href} className={cn('rounded font-medium text-navy hover:text-teal', focusRing)}>
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium text-navy">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </section>
    </>
  )
}
