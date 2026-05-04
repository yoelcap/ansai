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
  title: "Ansai — Gestión automática de reseñas con IA",
  description:
    "Ansai usa inteligencia artificial para responder automáticamente a tus reseñas de Google. Para restaurantes, bares y hoteles.",
  keywords: [
    "gestión de reseñas",
    "respuestas automáticas",
    "IA para restaurantes",
    "Google Reviews",
    "reputación online",
    "HoReCa",
  ],
  openGraph: {
    title: "Ansai — Tus reseñas, respondidas como tú las responderías",
    description:
      "El asistente de IA que mantiene tu reputación impecable. Para restaurantes, bares y hoteles.",
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
