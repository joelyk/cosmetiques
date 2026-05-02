import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { CartProvider } from "@/components/providers/cart-provider";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { SiteVisitTracker } from "@/components/ui/site-visit-tracker";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Josy Cosmetics",
  description:
    "Josy Cosmetics, boutique cosmetique extensible construite avec Next.js pour parfums, soins corps et coffrets. Site realise par GeniusClassrooms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${cormorant.variable} antialiased`}>
        <CartProvider>
          <SiteVisitTracker />
          <div className="min-h-screen">
            <SiteHeader />
            <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
              {children}
            </main>
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
