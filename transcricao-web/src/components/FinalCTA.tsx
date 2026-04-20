"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function FinalCTA() {
  return (
    <section className="relative py-24 md:py-32 px-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-brand-green/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-brand-blue/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Top gradient line */}
      <div className="section-line mb-24" />

      <motion.div
        className="relative max-w-3xl mx-auto text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
          Pronto para transformar suas{" "}
          <span className="text-gradient">audiências em análise profunda?</span>
        </h2>

        <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
          Comece gratuitamente. Sem cartão de crédito. Transcrição com IA
          diretamente no seu computador.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <a
            href="/trial"
            className="btn-gradient px-8 py-3.5 rounded-full text-base font-semibold inline-flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Experimentar grátis por 7 dias
          </a>
          <a
            href="#precos"
            className="btn-ghost px-8 py-3.5 rounded-full text-base inline-flex items-center justify-center"
          >
            Ver planos e preços
          </a>
        </div>

        <p className="text-zinc-500 text-sm mb-10">
          Disponível para Windows e Linux. Requer GPU NVIDIA para máxima performance.{" "}
          <a href="#requisitos" className="text-brand-cyan hover:underline transition-colors">
            Ver requisitos
          </a>
        </p>

        {/* Partnership logos */}
        <div className="flex items-center justify-center gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <Image
              src="/tecjustica-logo.jpeg"
              alt="TecJustica"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-sm text-zinc-500 font-medium">TecJustica</span>
          </div>
          <span className="text-zinc-700">&times;</span>
          <div className="flex items-center gap-2">
            <Image
              src="/projurista.jpeg"
              alt="Projurista"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-sm text-zinc-500 font-medium">Projurista</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
