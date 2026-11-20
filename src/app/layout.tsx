import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Movilidad Diversa - Transporte Inclusivo",
  description: "Servicios especializados de transporte para personas con movilidad reducida. Reserva fácil, precios transparentes, atención profesional en Medellín.",
  // Chrome's automatic translation rewrites text nodes React owns, which makes
  // React crash on the next update ("removeChild"/"insertBefore" NotFoundError).
  other: { google: "notranslate" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" translate="no" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
