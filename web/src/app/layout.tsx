import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FileShare",
  description:
    "Public library and private vault for files, links, and credentials",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
