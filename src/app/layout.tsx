import type { Metadata } from "next";
import { Mulish, Staatliches } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { CartProvider } from "@/context/CartContext";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const staatliches = Staatliches({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jersey Perfume | Luxury Fragrances",
  description: "Experience the essence of luxury with Jersey Perfume. Exquisite fragrances for the modern soul.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mulish.variable} ${staatliches.variable}`}>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ChatBot />
        </CartProvider>
      </body>
    </html>
  );
}
