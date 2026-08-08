import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dream Weavers PMS",
    template: "%s · Dream Weavers PMS",
  },
  description: "Task assignment, daily work tracking, and client updates for Dream Weavers.",
  icons: { icon: "/logo.jpeg" },
};

export const viewport = {
  themeColor: "#2E6373",
};

// Runs before hydration so the page never flashes light-then-dark (or vice versa) on load.
// `suppressHydrationWarning` on <html> is required because this script mutates the class
// attribute before React hydrates — otherwise React would flag a client/server markup mismatch.
// Always defaults to light on first visit — the OS/browser's prefers-color-scheme is
// intentionally ignored so a visitor whose system is set to dark still lands on the light
// theme; dark mode only turns on once they explicitly toggle it (saved in localStorage).
const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
