import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Derby Digital - Client Onboarding",
  description: "Get started with Derby Digital. Complete your onboarding in 5 minutes and start dominating your local market with targeted Google Ads.",
  openGraph: {
    title: "Derby Digital - Client Onboarding",
    description: "Get started with Derby Digital. Complete your onboarding in 5 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
