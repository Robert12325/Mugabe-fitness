import type { Metadata } from "next";
import Link from "next/link";
import { readAndroidRelease, type ApkRelease } from "@/lib/app-release";

export const metadata: Metadata = {
  title: "Download the Android app | Mugabe Fitness",
  description: "The official place to download the Mugabe Fitness app for Android, and how to install and update it.",
};

/**
 * The official Android download. Its contents come from
 * public/app-release/production.json, the file the app also reads to tell
 * people a new version is out, so the page and the app always agree.
 */
export default function DownloadPage() {
  const { apk, playStoreUrl } = readAndroidRelease();

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 font-[family-name:var(--font-display)] text-white sm:px-6">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-white/60 transition hover:text-white">
          ← Mugabe Fitness
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-[#e0b54a]">Android app</p>
        <h1 className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight sm:text-5xl">
          Get the app
        </h1>

        {playStoreUrl ? (
          <section className="mt-10 rounded-2xl border border-[#e0b54a]/30 bg-[#100d05] p-6">
            <h2 className="text-xl font-bold text-[#f3c969]">Google Play</h2>
            <p className="mt-3 leading-relaxed text-white/75">
              The easiest way: Google Play installs the app and keeps it up to date for you.
            </p>
            <a
              href={playStoreUrl}
              className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#d4af37] px-6 text-sm font-extrabold uppercase tracking-widest text-[#050505] transition hover:bg-[#f3c969]"
            >
              Get it on Google Play
            </a>
          </section>
        ) : null}

        {apk ? <ApkDownload apk={apk} /> : <NotYetAvailable />}

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#f3c969]">Updates</h2>
          <p className="mt-3 leading-relaxed text-white/75">
            Small improvements arrive inside the app by themselves: it downloads them in the background and uses them
            the next time it starts.
          </p>
          <p className="mt-3 leading-relaxed text-white/75">
            Bigger changes need a new version of the app. When one is out, the app tells you and links to this page.
            Download it and install it over the app you have: your sign-in and your daily log stay.
            {playStoreUrl ? " If you installed the app from Google Play, update it from Google Play instead." : ""}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#f3c969]">Staying safe</h2>
          <p className="mt-3 leading-relaxed text-white/75">
            Download the app only from this page{playStoreUrl ? " or Google Play" : ""}. Don&apos;t install copies of
            it sent as files by messaging apps or email: there is no way to know what they contain.
          </p>
        </section>

        <p className="mt-10 text-sm text-white/50">
          Read how your information is handled in our{" "}
          <Link href="/privacy" className="font-semibold text-[#f3c969] underline">
            privacy policy
          </Link>
          .
        </p>
      </article>
    </main>
  );
}

function ApkDownload({ apk }: { apk: ApkRelease }) {
  const released = new Date(`${apk.releasedAt}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <section className="mt-10 rounded-2xl border border-[#e0b54a]/30 bg-[#100d05] p-6">
        <h2 className="text-xl font-bold text-[#f3c969]">Download for Android</h2>
        <p className="mt-3 text-white/75">
          Version {apk.versionName} (build {apk.versionCode}) · released {released} ·{" "}
          {(apk.sizeBytes / 1_000_000).toFixed(1)} MB
        </p>
        {apk.notes.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-white/75">
            {apk.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        <a
          href={apk.url}
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#d4af37] px-6 text-sm font-extrabold uppercase tracking-widest text-[#050505] transition hover:bg-[#f3c969]"
        >
          Download the APK
        </a>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[#f3c969]">Installing it</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
          <li>Open this page on your Android phone and tap “Download the APK”.</li>
          <li>Open the downloaded file. If your phone asks, allow your browser to install apps.</li>
          <li>Open Mugabe Fitness and sign in with your account.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[#f3c969]">Checking the file</h2>
        <p className="mt-3 leading-relaxed text-white/75">
          For anyone who wants to confirm the download is exactly the file we published, its SHA-256 checksum is:
        </p>
        <p className="mt-2 break-all rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/80">
          {apk.sha256}
        </p>
        <p className="mt-3 leading-relaxed text-white/75">And the SHA-256 of the certificate it is signed with:</p>
        <p className="mt-2 break-all rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/80">
          {apk.signingCertSha256}
        </p>
      </section>
    </>
  );
}

function NotYetAvailable() {
  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6" data-testid="download-unavailable">
      <h2 className="text-xl font-bold text-[#f3c969]">Coming soon</h2>
      <p className="mt-3 leading-relaxed text-white/75">
        The Android app isn&apos;t available to download yet. Until it is, you can use Mugabe Fitness in your
        phone&apos;s browser and add it to your home screen.
      </p>
      <a
        href="/app"
        className="mt-5 inline-flex min-h-12 items-center rounded-full border border-[#d4af37] px-6 text-sm font-extrabold uppercase tracking-widest text-[#f3c969] transition hover:bg-[#d4af37]/10"
      >
        Open the web app
      </a>
    </section>
  );
}
