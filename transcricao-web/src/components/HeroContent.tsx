"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const trustItems = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: "Sem cartão de crédito",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    label: "100% Offline",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    label: "GPU NVIDIA Acelerada",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    label: "Windows & Linux",
  },
];

export default function HeroContent() {
  return (
    <div className="relative z-10 max-w-4xl mx-auto text-center">
      {/* Partnership badge */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="inline-flex items-center gap-3 mb-8"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/[0.08]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
          </span>
          <div className="flex items-center gap-2">
            <Image src="/tecjustica-logo.jpeg" alt="TecJustica" width={20} height={20} className="rounded" />
            <span className="text-sm text-zinc-300 font-medium">TecJustica</span>
            <span className="text-zinc-600">&times;</span>
            <Image src="/projurista.jpeg" alt="Projurista" width={20} height={20} className="rounded" />
            <span className="text-sm text-zinc-300 font-medium">Projurista</span>
          </div>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] mb-6 tracking-tight"
      >
        Transcreva audiências
        <br />
        judiciais com{" "}
        <span className="text-gradient-animated">
          inteligência artificial
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        Transcrição automática com identificação de falantes, análise por IA e
        chat inteligente. 100% offline, acelerado por GPU NVIDIA.
      </motion.p>

      {/* CTAs */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
      >
        <a
          href="/trial"
          className="btn-gradient px-8 py-4 rounded-full text-base font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-cyan/10"
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
          href="#showcase"
          className="btn-ghost px-8 py-4 rounded-full text-base inline-flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
            />
          </svg>
          Ver demonstração
        </a>
      </motion.div>

      {/* Compliance badge */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-10"
      >
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04]">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-sm text-zinc-300">
            Em conformidade com a{" "}
            <strong className="text-emerald-400">Resolução CNJ nº 615/2025</strong>
            {" "}e a{" "}
            <strong className="text-emerald-400">LGPD</strong>
            {" "}— transcrição 100% local, sem envio de dados
          </span>
        </div>
      </motion.div>

      {/* Trust indicators */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap justify-center gap-6"
      >
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-zinc-500 text-sm"
          >
            <span className="text-brand-cyan">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
