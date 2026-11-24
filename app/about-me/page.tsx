import type { Metadata } from 'next'
import Image from 'next/image'
import { secondaryButton } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Me',
  description: 'Meet Mohammad Arif Ul Huda Khan, the creator of Connect to Masjid, and learn about NextWis Digital Skills Education.',
}

export default function AboutMePage() {
  return (
    <section aria-labelledby="about-creator" className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 id="about-creator" className="text-3xl font-bold text-navy">About Me</h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          I’m <strong className="text-navy">Mohammad Arif Ul Huda Khan</strong>, the creator of this website. I design and build websites, automate workflows across websites and applications, and develop custom AI agents for independent professionals and businesses. I work with lawyers, consultants, real estate professionals, clinics, and other service-based businesses.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="rounded-xl bg-surface p-5">
            <h2 className="font-bold text-navy">Website development</h2>
            <p className="mt-2 text-muted-foreground">I build websites that clearly present your services and make it easy for prospective clients to get in touch, request a consultation, or book an appointment.</p>
          </li>
          <li className="rounded-xl bg-surface p-5">
            <h2 className="font-bold text-navy">Workflow automation</h2>
            <p className="mt-2 text-muted-foreground">I connect websites and business applications to streamline lead capture, client intake, scheduling, and follow-up. For example, a website inquiry can trigger a confirmation, create a record, and notify the right person.</p>
          </li>
          <li className="rounded-xl bg-surface p-5">
            <h2 className="font-bold text-navy">Custom AI agents</h2>
            <p className="mt-2 text-muted-foreground">I develop AI agents that answer common questions using your approved information, collect intake details, and hand off requests to your team when a person needs to respond.</p>
          </li>
        </ul>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">
          Each project starts with how your business operates today. I identify where a website, an automated workflow, or an AI agent can reduce manual work and make it easier for clients to take the next step.
        </p>
        <p className="mt-5 text-muted-foreground"><strong className="text-navy">Have a project in mind?</strong> Get in touch to discuss what you’d like to build or automate.</p>
        <address className="mt-3 flex flex-wrap gap-x-5 gap-y-2 break-all not-italic">
          <a className="font-semibold text-teal underline" href="mailto:mohammad.arifkhan10@outlook.com">mohammad.arifkhan10@outlook.com</a>
          <a className="font-semibold text-teal underline" href="tel:+14169395525">+1 416-939-5525</a>
        </address>
      </div>
      <div aria-labelledby="about-sponsor" className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <a href="https://www.nextwis.ca/" aria-label="Visit NextWis Digital Skills Education">
            <Image
              unoptimized
              src="https://www.nextwis.ca/wp-content/themes/nextwis-complete-v3/assets/images/nextwis-circle.png"
              alt=""
              width={72}
              height={72}
              className="rounded-full object-contain"
            />
          </a>
          <div className="min-w-0 flex-1">
            <h2 id="about-sponsor" className="text-2xl font-bold text-navy">Our Sponsor</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              This website is sponsored by <strong className="text-navy">NextWis Digital Skills Education</strong>, which provides AI-powered digital skills education for students, parents, educators, job seekers, school boards, community centres, and libraries.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy p-5 text-white">
          <div>
            <h3 className="text-lg font-bold">More than coding</h3>
            <p className="mt-1">Build real projects in Python, AI, data science, and automation.</p>
            <p className="mt-1 text-sm text-white/85">Project-based learning · Ages 8–16+</p>
          </div>
          <a href="https://www.nextwis.ca/programs/" className={secondaryButton}>Explore NextWis programs</a>
        </div>
      </div>
    </section>
  )
}
