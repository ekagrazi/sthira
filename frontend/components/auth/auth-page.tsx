import { Compass, LockKeyhole, Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/brand";

const benefits = [
  { icon: LockKeyhole, label: "Private reflection" },
  { icon: Compass, label: "Fitting perspectives" },
  { icon: Sparkles, label: "Gentle patterns" },
];

export function AuthPage({ mode, nextPath, error }: { mode: "login" | "signup"; nextPath: string; error?: string }) {
  const isLogin = mode === "login";
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,2fr)_minmax(24rem,1fr)]">
      <section className="relative hidden overflow-hidden border-r bg-primary p-10 text-primary-foreground lg:flex lg:flex-col xl:p-14">
        <div aria-hidden="true" className="absolute -bottom-44 -right-36 size-[32rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-20 -right-12 size-[20rem] rounded-full border border-guide-gita/35" />
        <Brand className="relative text-xl text-primary-foreground" href="/" />
        <div className="relative my-auto max-w-3xl py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-guide-gita">Return to yourself</p>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl font-medium leading-[1.08] tracking-[-0.045em] xl:text-6xl">A quiet account for the thoughts that matter.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-primary-foreground/68">Your check-ins, conversations, and saved passages stay together—ready when you want perspective, never asking you to perform.</p>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, label }) => <div className="rounded-2xl border border-white/10 bg-white/5 p-4" key={label}><Icon className="size-5 text-guide-gita" /><p className="mt-5 text-sm font-semibold">{label}</p></div>)}
          </div>
        </div>
        <figure className="relative max-w-2xl border-l border-guide-gita pl-6"><blockquote className="font-serif text-xl italic leading-8 text-primary-foreground/88">“You have power over your mind—not outside events. Realize this, and you will find strength.”</blockquote><figcaption className="mt-3 text-xs text-primary-foreground/55">Marcus Aurelius · Meditations</figcaption></figure>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">
          <Brand className="mb-10 text-xl lg:hidden" href="/" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-guide-gita-ink">{isLogin ? "Welcome back" : "Begin where you are"}</p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-[-0.04em]">{isLogin ? "Return to your space." : "Create your account."}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{isLogin ? "Your journal and conversations are ready when you are." : "Create a private reflection space in a moment."}</p>
          <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
            {error && <p className="mb-4 text-sm text-destructive" role="alert">{error === "oauth_unavailable" ? "Google sign-in is not available right now." : "The sign-in callback could not be completed. Try again."}</p>}
            <AuthForm mode={mode} nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
  );
}
