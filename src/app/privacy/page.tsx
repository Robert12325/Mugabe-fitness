import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy | Mugabe Fitness",
  description: "What Mugabe Fitness collects through its website and app, how it is used, and how to delete your account.",
};

const CONTACT_EMAIL = "robertmkamarajr@gmail.com";
const UPDATED = "26 October 2026";

type Section = { title: string; body: (string | string[])[] };

const SECTIONS: Section[] = [
  {
    title: "Who we are",
    body: [
      "Mugabe Fitness is a personal coaching service. This policy covers the Mugabe Fitness website and the Mugabe Fitness app, which share one account and one set of data.",
    ],
  },
  {
    title: "What we collect",
    body: [
      [
        "Your account: your name, email address and phone number, and your password, which is stored only as a secure one-way hash.",
        "Bookings: the program, preferred time and goal you choose, your contact details, and, if you pay, your UPI transaction reference and the payment screenshot you upload.",
        "Membership renewals: the amount, reference, screenshot and whether your coach has confirmed the payment.",
        "Daily tracking, if you use it: calories, protein, water, steps, waist, sleep, whether you trained, energy, notes and weight, plus the targets and notes your coach sets for you. Some of this is health information; it is used only for your coaching.",
        "Security: your IP address, used briefly to limit repeated sign-in and booking attempts. These counters expire within an hour.",
      ],
      "We don't use advertising or analytics trackers, and we don't sell or rent your information.",
    ],
  },
  {
    title: "How we use it",
    body: [
      [
        "To provide your coaching: your program, membership, targets and feedback.",
        "To manage bookings and confirm payments.",
        "To show your progress to you and to your coach.",
        "To keep accounts secure.",
      ],
    ],
  },
  {
    title: "Who can see it",
    body: [
      [
        "You, in the app and on the website once signed in.",
        "Your coach, who sees your bookings, payments, membership, daily tracking and the notes they write.",
        "Our service providers, only to run the service on our behalf: Vercel (website and app hosting) and Upstash (database).",
      ],
      "Coaching videos on the website may be played from YouTube or Vimeo, which apply their own privacy policies when you play them. If you contact us by email or WhatsApp, those services handle the messages.",
    ],
  },
  {
    title: "On your device",
    body: [
      "The app keeps your sign-in session in your phone's secure storage. The website remembers your language choice in your browser. Sessions end after 30 days, or when you sign out.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Your account and tracking data are kept for as long as your account exists. Booking and payment records are kept as business and accounting records.",
    ],
  },
  {
    title: "Deleting your account",
    body: [
      "In the app, open Profile and tap “Delete my account”, then confirm with your password. This permanently deletes your profile, email and password, your daily log, weigh-ins, targets and your coach's notes, and your membership with its payment screenshots, and signs you out on every device.",
      "Bookings you sent through the website's booking form stay with your coach as payment records, no longer linked to any account. To have those removed too, or to ask for a copy or correction of your information, email us.",
    ],
  },
  {
    title: "Security",
    body: [
      "Everything travels over HTTPS. Passwords and session tokens are stored only as hashes, so they can't be read back even from the database.",
    ],
  },
  {
    title: "Children",
    body: ["Mugabe Fitness is intended for adults. Please don't create an account if you are under 18."],
  },
  {
    title: "Changes",
    body: ["If this policy changes, the new version will be posted here with a new date."],
  },
];

/** The privacy policy the app and the stores link to. */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 font-[family-name:var(--font-display)] text-white sm:px-6">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-white/60 transition hover:text-white">
          ← Mugabe Fitness
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">Privacy</p>
        <h1 className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">Privacy policy</h1>
        <p className="mt-4 text-sm text-white/50">Last updated {UPDATED}</p>

        {SECTIONS.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-xl font-bold text-[#f3c969]">{section.title}</h2>
            {section.body.map((part, index) =>
              Array.isArray(part) ? (
                <ul key={index} className="mt-3 list-disc space-y-2 pl-5 text-white/75">
                  {part.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={index} className="mt-3 leading-relaxed text-white/75">
                  {part}
                </p>
              ),
            )}
          </section>
        ))}

        <section className="mt-10 rounded-2xl border border-[#e0b54a]/30 bg-[#100d05] p-6">
          <h2 className="text-xl font-bold text-[#f3c969]">Contact</h2>
          <p className="mt-3 text-white/75">
            Questions or requests about your information:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#f3c969] underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
