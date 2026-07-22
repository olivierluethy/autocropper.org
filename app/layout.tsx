import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autocropper.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Autocropper — Turn any logo into a perfect icon set in seconds",
    template: "%s · Autocropper",
  },
  description:
    "One upload replaces 5 tools. Autocropper crops, cleans and exports pixel-perfect icons in seconds — entirely in your browser. No uploads, no tracking.",
  keywords: [
    "logo to icon",
    "icon generator",
    "favicon",
    "app icon",
    "transparent background",
    "remove background",
    "image cropper",
  ],
  applicationName: "Autocropper",
  authors: [{ name: "Autocropper" }],
  openGraph: {
    title: "Autocropper — Turn any logo into a perfect icon set",
    description:
      "Drop your logo. Get a clean, transparent icon set in seconds. 100% in-browser.",
    url: SITE_URL,
    siteName: "Autocropper",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autocropper — Logo to icon set in seconds",
    description: "One upload replaces 5 tools. Pixel-perfect icons, in your browser.",
  },
  robots: { index: true, follow: true },
  alternates: {
    // Safe to inherit: every other route defines its own `alternates`, which
    // replaces this block wholesale rather than merging with it.
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050507" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
        <ThemeProvider>{children}</ThemeProvider>
        <PostHogProvider />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        <Analytics />
      </body>
    </html>
  );
}
