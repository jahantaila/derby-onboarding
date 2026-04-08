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
  description: "Get started with local lead generation for your business",
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
        {children}
      </body>
    </html>
  );
}
