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
  title: "Frontend Engineer Portfolio | Crafting Digital Experiences",
  description: "Frontend Engineer specializing in React, Next.js, and TypeScript. Crafting thoughtful digital experiences with modern web technologies.",
  keywords: ["Frontend Engineer", "React Developer", "Next.js", "TypeScript", "Web Development", "UI/UX"],
  authors: [{ name: "Frontend Engineer" }],
  openGraph: {
    title: "Frontend Engineer Portfolio",
    description: "Crafting thoughtful digital experiences with modern web technologies.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
