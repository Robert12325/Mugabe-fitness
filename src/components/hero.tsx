import HeroScene from "@/components/motion/hero-scene";
import Reveal from "@/components/motion/reveal";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-black"
    >
      <HeroScene />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-36 lg:px-8 lg:pt-40">
        <Reveal className="max-w-4xl">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.4em] text-[#c9a227]">
            Rise. Grind. Shine.
          </p>

          <h1 className="text-[clamp(3.5rem,14vw,9rem)] font-black uppercase leading-[0.88] tracking-[-0.055em] text-white">
  Become
  <br />
  <span className="text-[#d4af37]">Stronger.</span>
</h1>

          <p className="mt-8 max-w-xl text-sm leading-7 text-white/55 sm:text-base lg:text-lg">
  Personal coaching built to help you train with purpose, build strength,
  transform your physique, and become the strongest version of yourself.
</p>

         <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
  href="#programs"
  className="rounded-full bg-[#d4af37] px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-black transition hover:bg-white sm:px-7 sm:text-sm"
>
  Start Your Transformation
</a>

           <a
  href="#method"
  className="rounded-full border border-white/15 px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#d4af37] hover:text-[#d4af37] sm:px-7 sm:text-sm"
>
  Discover The Method
</a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}