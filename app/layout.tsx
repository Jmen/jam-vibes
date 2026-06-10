import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { NavigationBar } from "@/components/layout/NavigationBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jam Vibes",
  description: "Layer loops with friends — record, mix and share jams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <NavigationBar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
