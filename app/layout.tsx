import type { Metadata, Viewport } from "next";
import { Fraunces, Zen_Maru_Gothic } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { TopNav } from "@/components/layout/top-nav";
import { PlayerDock } from "@/components/music/player-dock";
import { MixerSheet } from "@/components/ambience/mixer-sheet";

const display = Fraunces({
  variable: "--font-display-face",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const body = Zen_Maru_Gothic({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Study Paws",
  description: "A cozy virtual study room. Focus with your cat, rain on the window and friends by your side.",
  applicationName: "Study Paws",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EFE6" },
    { media: "(prefers-color-scheme: dark)", color: "#1D1916" },
  ],
};

// Applies the saved theme before first paint so there is no flash.
const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem('sp-preferences')||'{}').state||{};var t=p.theme||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="grain min-h-full">
        <Providers>
          <div className="relative z-10 flex min-h-dvh flex-col">
            <a
              href="#main"
              className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
              Skip to content
            </a>
            <TopNav />
            <main id="main" className="flex-1 pb-28">
              {children}
            </main>
            <PlayerDock />
            <MixerSheet />
          </div>
        </Providers>
      </body>
    </html>
  );
}
