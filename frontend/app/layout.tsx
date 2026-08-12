import type { Metadata } from "next";
import localFont from "next/font/local";

import { Toaster } from "@/components/ui/toast";

import "./globals.css";

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const lora = localFont({
  src: "../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
  variable: "--font-lora",
  weight: "400 700",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sthira",
    template: "%s · Sthira",
  },
  description: "A mood-aware wisdom companion.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
