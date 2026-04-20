"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import VideoModal from "./VideoModal";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    image: "/screenshots/dashboard.png",
    title: "Painel Principal",
    description:
      "Visão completa das suas transcrições, modelo ativo e estatísticas de uso em um painel elegante e intuitivo.",
    bullets: [
      "Estatísticas em tempo real",
      "Histórico completo de transcrições",
      "Status do modelo e GPU",
    ],
  },
  {
    id: "transcricao",
    label: "Transcrição",
    image: "/screenshots/transcricao.png",
    title: "Player + Falantes",
    description:
      "Resultado da transcrição com player de vídeo sincronizado e identificação automática de cada falante.",
    bullets: [
      "Player sincronizado com texto",
      "Cores por falante identificado",
      "Exportação DOCX, SRT, TXT",
    ],
  },
  {
    id: "analise",
    label: "Análise IA",
    image: "/screenshots/analise-ia.png",
    title: "Análise Inteligente",
    description:
      "A IA identifica tópicos, resume pontos-chave e marca timestamps clicáveis automaticamente.",
    bullets: [
      "Resumo por tópicos",
      "Timestamps clicáveis",
      "Detecção de temas relevantes",
    ],
  },
  {
    id: "chat",
    label: "Chat IA",
    image: "/screenshots/chat.png",
    title: "Chat Contextual",
    description:
      "Converse com a IA sobre o conteúdo da audiência. Faça perguntas e obtenha respostas com citações.",
    bullets: [
      "Perguntas em linguagem natural",
      "Respostas com contexto",
      "Citações com timestamps",
    ],
  },
];

export default function AppShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const active = tabs[activeTab];

  return (
    <section id="showcase" className="relative py-24 md:py-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-cyan/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto z-10">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-4">
            Veja o app{" "}
            <span className="text-gradient">em ação</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-6">
            Interface profissional projetada para o fluxo de trabalho do judiciário.
          </p>

          <button
            onClick={() => setShowVideo(true)}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-all duration-300 hover:border-brand-cyan/30 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <span className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-black ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Ver Demo em Vídeo
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-12">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-colors duration-300 ${
                activeTab === index
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === index && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/[0.08] rounded-full border border-white/[0.1]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Screenshot with frame */}
          <div className="lg:col-span-3">
            <motion.div
              className="relative"
              style={{
                perspective: "1200px",
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              {/* Glow behind */}
              <div className="absolute -inset-4 bg-brand-cyan/[0.04] rounded-3xl blur-2xl" />

              {/* Desktop frame */}
              <div
                className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50"
                style={{
                  transform: "rotateY(-2deg) rotateX(1deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono ml-2">
                    TecJustica Transcribe
                  </span>
                </div>

                {/* Screenshot */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="relative aspect-video bg-surface-1"
                  >
                    <Image
                      src={active.image}
                      alt={active.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Reflection */}
              <div
                className="absolute -bottom-12 left-4 right-4 h-24 opacity-[0.07] blur-sm"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,229,255,0.2), transparent)",
                  maskImage:
                    "linear-gradient(to bottom, black, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black, transparent)",
                }}
              />
            </motion.div>
          </div>

          {/* Description panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                  <span className="text-xs text-zinc-400 font-medium">
                    {active.label}
                  </span>
                </div>

                <h3 className="font-display text-2xl md:text-3xl mb-3 text-white">
                  {active.title}
                </h3>

                <p className="text-zinc-400 mb-6 leading-relaxed">
                  {active.description}
                </p>

                <ul className="space-y-3">
                  {active.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />
    </section>
  );
}
