import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://riasat-control-tower.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology",
  description:
    "Executive Management and Departmental Progress Monitoring Dashboard for Ramaiah Institute for Advanced Skills & Technology (RIASAT)",
  applicationName: "RIASAT Executive Dashboard",
  authors: [{ name: "RIASAT Executive Secretariat" }],
  generator: "Next.js",
  keywords: [
    "RIASAT",
    "Ramaiah Institute for Advanced Skills & Technology",
    "Executive Dashboard",
    "Control Tower",
    "Ramaiah",
    "Action Register",
  ],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/ramaiah_logo.png", type: "image/png" },
      { url: "/riasat_logo.jpg", type: "image/jpeg" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "RIASAT Executive Dashboard",
    title: "RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology",
    description:
      "Executive Management and Departmental Progress Monitoring Dashboard for Ramaiah Institute for Advanced Skills & Technology (RIASAT)",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RIASAT - Ramaiah Institute for Advanced Skills & Technology Logo",
        type: "image/png",
      },
      {
        url: "/logo.png",
        width: 1024,
        height: 341,
        alt: "RIASAT Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology",
    description:
      "Executive Management and Departmental Progress Monitoring Dashboard for Ramaiah Institute for Advanced Skills & Technology (RIASAT)",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fallback social & link preview meta tags for WhatsApp, Instagram, Telegram & Twitter */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RIASAT Executive Dashboard" />
        <meta
          property="og:title"
          content="RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology"
        />
        <meta
          property="og:description"
          content="Executive Management and Departmental Progress Monitoring Dashboard for Ramaiah Institute for Advanced Skills & Technology (RIASAT)"
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:secure_url" content="/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="RIASAT - Ramaiah Institute for Advanced Skills & Technology Logo"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology"
        />
        <meta
          name="twitter:description"
          content="Executive Management and Departmental Progress Monitoring Dashboard for RIASAT"
        />
        <meta name="twitter:image" content="/og-image.png" />
        <link rel="image_src" href="/og-image.png" />
      </head>
      <body className="antialiased bg-slate-50 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  );
}
