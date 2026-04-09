import type { Metadata } from "next";
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

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${anton.variable} font-sans antialiased bg-transparent text-gray-900`} style={{ minWidth: 320 }}>
        {children}
      </body>
    </html>
  );
}
