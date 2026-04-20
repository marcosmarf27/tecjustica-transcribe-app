import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TecJustica Transcribe - Transcricao de Audiencias com IA",
  description:
    "Transcreva audiencias judiciais automaticamente com inteligencia artificial. Identificacao de falantes, analise por IA, chat inteligente. 100% offline, acelerado por GPU NVIDIA. Parceria TecJustica x Projurista.",
  keywords: [
    "transcricao",
    "audiencia judicial",
    "whisperx",
    "inteligencia artificial",
    "TecJustica",
    "Projurista",
    "transcricao automatica",
    "diarizacao",
  ],
  openGraph: {
    title: "TecJustica Transcribe",
    description:
      "Transcricao automatica de audiencias judiciais com IA. Offline, GPU acelerada, identificacao de falantes.",
    type: "website",
    locale: "pt_BR",
  },
  other: {
    "theme-color": "#030303",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
