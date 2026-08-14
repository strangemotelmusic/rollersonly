import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { ChatProvider } from "@/lib/chat-context";
import { ListingNotificationsProvider } from "@/lib/listing-notifications-context";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RollersOnly — The Elite Roller Pigeon Marketplace",
  description:
    "Live auctions. Verified pedigrees. Escrow-protected transactions. The global platform the roller pigeon community has always deserved.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning>
        <ChatProvider>
          <ListingNotificationsProvider>
            <CartProvider>{children}</CartProvider>
          </ListingNotificationsProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
