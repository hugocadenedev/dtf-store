import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DTF Store — Transferts DTF Professionnels",
  description:
    "Commandez vos transferts DTF au mètre ou au logo. Qualité professionnelle, tarifs dégressifs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/open-runde"
        />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="min-h-[calc(100vh-160px)]">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
