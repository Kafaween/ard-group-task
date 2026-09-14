import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getInitThemeScript } from "@/lib/theme";
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
  title: "Weather Dashboard",
  description:
    "A beautiful weather dashboard showing current conditions and 5-day forecast for any city",
  keywords: ["weather", "forecast", "dashboard", "temperature", "humidity"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline theme script (below) may add the "dark" class to <html>
      // before React hydrates, based on client-only state (localStorage /
      // matchMedia) the server can't know about. That's an intentional,
      // expected mismatch — suppress the warning for it specifically.
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored/system theme before hydration to avoid a
            flash of the wrong theme on load. */}
        <script dangerouslySetInnerHTML={{ __html: getInitThemeScript() }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
