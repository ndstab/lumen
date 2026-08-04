import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Masthead from "@/components/Masthead";
import Tracker from "@/components/Tracker";
import { getCurrentUser } from "@/lib/session";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lumen",
    template: "%s · Lumen",
  },
  description:
    "Interactive science for Classes 8 and 9. Read it, watch it, then prove you have it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3e3",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Masthead user={user} />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="shell row-between">
            <span>
              Lumen. Built for the learning analytics project, Classes 8 and 9 science.
            </span>
            <span className="mono" style={{ fontSize: "var(--text-xs)" }}>
              Every action on this site is logged to the clickstream.
            </span>
          </div>
        </footer>
        <Tracker signedIn={Boolean(user)} />
      </body>
    </html>
  );
}
