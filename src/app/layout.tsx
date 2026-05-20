import type { Metadata } from "next";
import { Mulish, Staatliches } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";

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
  metadataBase: new URL('https://jerseyperfume.com'),
  title: "Jersey Perfume | Luxury Fragrances",
  description: "Experience the essence of luxury with Jersey Perfume. Exquisite fragrances for the modern soul.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/jersey-logo.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: { url: '/jersey-logo.png', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mulish.variable} ${staatliches.variable}`}>
      <head>
        {/* Auto-reload on ChunkLoadError: new deployment invalidates old cached chunk URLs */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){function isCLE(m){return m&&(m.indexOf('ChunkLoadError')!==-1||m.indexOf('Loading chunk')!==-1||m.indexOf('Failed to load chunk')!==-1);}var K='__cle_ts';function reload(){var t=+(sessionStorage.getItem(K)||0);if(Date.now()-t>15000){sessionStorage.setItem(K,String(Date.now()));location.reload();}}window.addEventListener('error',function(e){if(isCLE(e.message)||(e.filename&&e.filename.indexOf('/_next/static/chunks/')!==-1)){reload();}});window.addEventListener('unhandledrejection',function(e){var m=e.reason&&(e.reason.message||String(e.reason));if(isCLE(m))reload();});})();` }} />
        <link rel="preconnect" href="https://jerseyperfume.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://jerseyperfume.com" />
        <link rel="preconnect" href="https://www.instagram.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.instagram.com" />
      </head>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
        <Script id="charla-widget-loader" strategy="afterInteractive">
          {`
            (function () {
              var projectId = 'ac74e22f-afeb-40b1-8c42-40f0c6865905';

              if (!document.querySelector('charla-widget[p="' + projectId + '"]')) {
                var widgetElement = document.createElement('charla-widget');
                widgetElement.setAttribute('p', projectId);
                document.body.appendChild(widgetElement);
              }

              if (!document.querySelector('script[src="https://app.charla.com/widget/widget.js"]')) {
                var widgetCode = document.createElement('script');
                widgetCode.src = 'https://app.charla.com/widget/widget.js';
                widgetCode.async = true;
                document.body.appendChild(widgetCode);
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
