import { ArrowRight, BookOpenText, Compass, Feather, LockKeyhole, Quote } from "lucide-react";
import Link from "next/link";

import { AppFooter } from "@/components/app-footer";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

const principles = [
  { icon: Feather, label: "Notice what is present", text: "Name the feeling and the moment in your own words." },
  { icon: Compass, label: "Meet a fitting perspective", text: "Receive a source-backed passage for the question you carry." },
  { icon: BookOpenText, label: "Keep what matters", text: "Save useful words and notice your patterns over time." },
] as const;

const perspectives = [
  ["Bhagavad Gita", "Purpose", "Duty, action and freedom from outcomes.", "border-guide-gita"],
  ["Buddha", "Awareness", "Mindfulness, compassion and impermanence.", "border-guide-buddha"],
  ["Marcus Aurelius", "Agency", "Control, discipline and acceptance.", "border-guide-marcus"],
  ["Rumi", "Transformation", "Love, longing and the inner search.", "border-guide-rumi"],
  ["Albert Camus", "Meaning", "Freedom, honesty and engagement with life.", "border-guide-camus"],
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden">
      <header className="border-b bg-card/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[82rem] items-center justify-between px-5 sm:px-8">
          <Brand className="text-xl" href="/" />
          <nav aria-label="Public navigation" className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#how-it-works">How it works</a>
            <a href="#perspectives">Perspectives</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/signup">Begin <ArrowRight /></Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[43rem] max-w-[82rem] lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col justify-center px-6 py-20 sm:px-10 lg:px-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A steadier place to reflect</p>
          <h1 className="mt-7 max-w-3xl font-serif text-5xl font-medium leading-[1.02] tracking-[-0.055em] sm:text-7xl">
            Pause before the world <em className="font-normal text-guide-gita-ink">answers for you.</em>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Name what you feel, meet a fitting philosophical perspective, and keep the words worth returning to.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/signup">Begin your reflection <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#perspectives">Explore perspectives</a></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
            <span>● Private by design</span><span>● Verified passages</span><span>● No feed or performance</span>
          </div>
        </div>
        <div className="relative grid min-h-[32rem] place-items-center overflow-hidden border-l bg-[#e9dfd2]/55 px-6 py-16">
          <div aria-hidden="true" className="absolute size-[34rem] rounded-full border border-guide-gita/20" />
          <div aria-hidden="true" className="absolute size-[24rem] rounded-full border border-guide-buddha/25" />
          <figure className="relative w-full max-w-md rotate-[-2deg] rounded-[1.4rem] border bg-card p-8 shadow-[var(--shadow-lifted)] sm:p-11">
            <Quote className="size-8 text-guide-gita" />
            <blockquote className="mt-8 font-serif text-2xl italic leading-10 sm:text-3xl">
              “The mind is restless and difficult to curb, but it is subdued through constant practice.”
            </blockquote>
            <figcaption className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bhagavad Gita · 6.35</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y bg-card/55 px-6 py-24 sm:px-10" id="how-it-works">
        <div className="mx-auto max-w-[74rem]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-guide-gita-ink">A simple rhythm</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Reflection without another system to manage.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {principles.map(({ icon: Icon, label, text }, index) => (
              <article className="rounded-2xl border bg-card p-7 shadow-[var(--shadow-soft)]" key={label}>
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">0{index + 1}</span><Icon className="size-5 text-guide-gita-ink" /></div>
                <h3 className="mt-14 font-serif text-2xl font-medium">{label}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-10" id="perspectives">
        <div className="mx-auto max-w-[74rem]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-guide-gita-ink">Five perspectives</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Different questions need different kinds of wisdom.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {perspectives.map(([name, theme, text, accent]) => (
              <article className={`rounded-2xl border border-t-4 bg-card p-7 shadow-[var(--shadow-soft)] ${accent}`} key={name}>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{theme}</p>
                <h3 className="mt-3 font-serif text-2xl font-medium">{name}</h3>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
            <article className="flex min-h-52 flex-col justify-between rounded-2xl border border-dashed bg-card/45 p-7">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">The collection will grow</p>
              <div>
                <h3 className="font-serif text-2xl font-medium">More perspectives are taking shape.</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">New voices will be added carefully, with clear sources and a distinct purpose.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t bg-primary px-6 py-20 text-primary-foreground sm:px-10" id="privacy">
        <div className="mx-auto grid max-w-[74rem] gap-10 md:grid-cols-[1fr_.8fr] md:items-center">
          <blockquote className="font-serif text-4xl italic leading-tight sm:text-5xl">“A jug fills drop by drop.”</blockquote>
          <div><LockKeyhole className="size-6 text-guide-gita" /><h2 className="mt-5 text-sm font-bold uppercase tracking-[0.16em]">A private practice</h2><p className="mt-4 leading-7 text-primary-foreground/70">Your reflections are not a feed, a score, or a public identity. They remain a quiet record for you.</p><Button asChild className="mt-6 bg-card text-foreground hover:bg-card/90"><Link href="/signup">Create your space</Link></Button></div>
        </div>
      </section>
      <div className="mx-auto max-w-[74rem] px-6 pb-8 sm:px-10">
        <AppFooter publicHome />
      </div>
    </main>
  );
}
