import type { Metadata, Viewport } from "next";
import { Inter, Anton } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "Derby Digital Onboarding",
  description: "Complete your Derby Digital onboarding.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${anton.variable} font-sans antialiased bg-transparent text-gray-900 overflow-x-hidden`} style={{ minWidth: 0 }}>
        {children}
      </body>
    </html>
  );
}
