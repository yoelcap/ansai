import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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
    "Para restaurantes, hoteles y grupos hosteleros. Ansai responde a tus reseñas con tu tono. Tú solo apruebas. Prueba 14 días gratis.",
  keywords: [
    "gestión reseñas restaurante",
    "respuesta automática reseñas Google",
    "reseñas hotel",
    "reputación online HoReCa",
    "herramienta reseñas Bélgica",
  ],
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
      <body>{children}</body>
    </html>
  );
}
