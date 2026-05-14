import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ansai — Responde a tus reseñas de Google automáticamente",
  description:
    "Para restaurantes, hoteles y grupos hosteleros. Ansai responde a tus reseñas con tu tono. Tú solo apruebas. Beta cerrada — 50 plazas en Bélgica.",
  keywords: [
    "gestión reseñas restaurante",
    "respuesta automática reseñas Google",
    "reseñas hotel",
    "reputación online HoReCa",
    "herramienta reseñas Bélgica",
  ],
  alternates: {
    canonical: "https://ansaii.vercel.app",
    languages: {
      es: "https://ansaii.vercel.app/es",
      en: "https://ansaii.vercel.app/en",
      nl: "https://ansaii.vercel.app/nl",
      fr: "https://ansaii.vercel.app/fr",
      de: "https://ansaii.vercel.app/de",
      "x-default": "https://ansaii.vercel.app",
    },
  },
  openGraph: {
    title: "Ansai — Responde a tus reseñas de Google automáticamente",
    description:
      "Para restaurantes, hoteles y grupos hosteleros. Ansai responde a tus reseñas con tu tono. Tú solo apruebas.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
