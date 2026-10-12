import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RIASAT Executive Dashboard | Ramaiah Institute for Advanced Skills & Technology",
  description: "Executive Management and Departmental Progress Monitoring Dashboard for RIASAT",
  icons: {
    icon: "/riasat_logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-800">
        {children}
      </body>
    </html>
  );
}
