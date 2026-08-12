import Link from "next/link";

import { Brand } from "@/components/brand";

const appLinks = [["Home", "/dashboard"], ["Perspectives", "/guides"], ["Companion", "/companion"], ["Library", "/library"], ["Journal", "/journal"], ["Insights", "/insights"]] as const;
const publicLinks = [["Home", "/"], ["How it works", "/#how-it-works"], ["Perspectives", "/#perspectives"], ["Privacy", "/#privacy"], ["Sign in", "/login"], ["Create account", "/signup"]] as const;

export function AppFooter({ publicHome = false }: { publicHome?: boolean }) {
  const quickLinks = publicHome ? publicLinks : appLinks;
  return (
    <footer className="mt-16 grid gap-7 border-t pt-7 text-sm md:grid-cols-[1.1fr_1fr]">
      <div><Brand className="text-lg" href={publicHome ? "/" : "/dashboard"} /><p className="mt-3 max-w-md text-xs leading-6 text-muted-foreground">A quieter place to notice what you feel, meet a fitting perspective, and keep the words worth returning to.</p></div>
      <div><h2 className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick links</h2><nav aria-label="Footer" className="mt-3 grid grid-cols-3 gap-x-5 gap-y-2">{quickLinks.map(([label, href]) => <Link className="text-xs font-semibold text-muted-foreground hover:text-foreground" href={href} key={href}>{label}</Link>)}</nav></div>
      <div className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground md:col-span-2 md:flex-row md:items-center md:justify-between"><span>Built with ❤️ by Ekagra.</span><div className="flex gap-4 font-semibold"><a href="https://ekagrazi.com" rel="noreferrer" target="_blank">Website</a><a href="https://github.com/ekagrazi" rel="noreferrer" target="_blank">GitHub</a><a href="https://www.linkedin.com/in/ekagrazi/" rel="noreferrer" target="_blank">LinkedIn</a></div></div>
    </footer>
  );
}
