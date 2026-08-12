export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="absolute -left-28 top-[-9rem] size-96 rounded-full bg-guide-gita/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-28 bottom-[-10rem] size-96 rounded-full bg-guide-buddha/10 blur-3xl" />
      {children}
    </div>
  );
}
