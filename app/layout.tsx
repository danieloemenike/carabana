import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import localFont from 'next/font/local'
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/AppProviders";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// const inter = Inter({ subsets: ["latin"] });

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const gv = localFont({
  src: '../fonts/greatvibes/GreatVibes-Regular.ttf',
  display: 'swap',
  variable: '--font-gv'
})

export const metadata: Metadata = {
  title: "Carabana Club",
  description: "Carabana Club",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={  `${inter.variable} ${gv.variable} ` }>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
