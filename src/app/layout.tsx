import type { Metadata } from "next";
import { Anton, Open_Sans } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Derby Digital - Client Onboarding",
  description: "Get started with your Local Services Ads campaign",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${anton.variable} ${openSans.variable} font-body antialiased min-h-screen bg-derby-dark`}
      >
        <header className="bg-derby-gradient px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="font-heading text-2xl text-white tracking-wide">
              DERBY DIGITAL
            </h1>
            <span className="text-white/70 text-sm font-body">
              Client Onboarding
            </span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
