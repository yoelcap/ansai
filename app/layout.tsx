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
  title: "Replyo — Responde a las reseñas de tu restaurante con IA",
  description:
    "Replyo lee, analiza y responde automáticamente a las reseñas de tu negocio en Google con tu propio tono. Ahorra horas cada semana y mantén tu reputación impecable.",
  keywords: [
    "gestión de reseñas",
    "respuestas automáticas",
    "IA para restaurantes",
    "Google Reviews",
    "reputación online",
    "HoReCa",
  ],
  openGraph: {
    title: "Replyo — Tus reseñas, respondidas como tú las responderías",
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
