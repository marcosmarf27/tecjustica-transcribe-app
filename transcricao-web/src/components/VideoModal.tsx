"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Milestone icons (inline SVGs matching Features.tsx style) ── */
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  interface: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  transcricao: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  resultado: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  analise: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
      <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
      <path d="M8.56 13.44A6 6 0 0 0 6 18h12a6 6 0 0 0-2.56-4.56" />
      <path d="m15 9 .88 1.75L17.5 11.5l-1.62.75L15 14l-.88-1.75-1.62-.75 1.62-.75Z" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  ),
};

/* ── Milestones synced to video timestamps ── */
const milestones = [
  {
    id: "dashboard" as const,
    startTime: 0,
    endTime: 25,
    title: "Painel Inteligente",
    description:
      "Estatísticas em tempo real, modelo ativo e histórico completo de transcrições.",
    bullets: [
      "Horas transcritas e modelo favorito",
      "Histórico com status de cada transcrição",
      "Info de GPU e backend na status bar",
    ],
  },
  {
    id: "interface" as const,
    startTime: 55,
    endTime: 115,
    title: "Interface Profissional",
    description:
      "Design dark inspirado em VS Code, com sidebar navegável e layout limpo.",
    bullets: [
      "Tema escuro otimizado para longas sessões",
      "Sidebar colapsável com ícones",
      "Navegação intuitiva entre seções",
    ],
  },
  {
    id: "transcricao" as const,
    startTime: 115,
    endTime: 140,
    title: "Transcrição Simples",
    description:
      "Arraste o arquivo, escolha idioma e modelo, ative diarização. Um clique para iniciar.",
    bullets: [
      "Drag & drop de áudio e vídeo",
      "Seleção de idioma e modelo de IA",
      "Diarização de falantes opcional",
    ],
  },
  {
    id: "resultado" as const,
    startTime: 140,
    endTime: 170,
    title: "Player + Falantes",
    description:
      "Vídeo sincronizado com texto, cores por falante, exportação em múltiplos formatos.",
    bullets: [
      "Player sincronizado com segmentos",
      "Cores únicas por falante identificado",
      "Exportação DOCX, SRT, TXT, JSON",
    ],
  },
  {
    id: "analise" as const,
    startTime: 170,
    endTime: 200,
    title: "Análise Inteligente",
    description:
      "A IA resume a audiência, identifica tópicos e marca momentos-chave automaticamente.",
    bullets: [
      "Resumo automático por tópicos",
      "Momentos-chave com timestamps",
      "Insights sobre a audiência",
    ],
  },
  {
    id: "chat" as const,
    startTime: 200,
    endTime: 230,
    title: "Chat Contextual",
    description:
      "Pergunte sobre a audiência em linguagem natural e receba respostas com citações.",
    bullets: [
      "Perguntas em linguagem natural",
      "Respostas com contexto e citações",
      "Timestamps clicáveis nas respostas",
    ],
  },
];

/* ── Animation variants ── */
const bulletVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

/* ── Component ── */
interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    const duration = video.duration || 230;
    setProgress((t / duration) * 100);

    const idx = milestones.findIndex(
      (m) => t >= m.startTime && t < m.endTime
    );
    setActiveIndex(idx >= 0 ? idx : null);
  }, []);

  // Autoplay on open, pause on close
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isOpen) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setActiveIndex(0);
      setProgress(0);
    } else {
      video.pause();
    }
  }, [isOpen]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      video.play().catch(() => {});
    }
  };

  const active = activeIndex !== null ? milestones[activeIndex] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* ── Overlay with radial glow ── */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-cyan/[0.03] rounded-full blur-[180px] pointer-events-none" />

          {/* ── Modal container ── */}
          <motion.div
            className="relative z-10 flex flex-col lg:flex-row gap-5 w-full max-w-[1200px] mx-4 md:mx-8"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* ── Close button ── */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 lg:-top-4 lg:-right-4 z-20 w-9 h-9 rounded-full glass border border-white/[0.1] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ── Video panel ── */}
            <div className="lg:w-[62%] flex-shrink-0">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/70">
                {/* Title bar (matching AppShowcase) */}
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-[11px] text-zinc-600 font-mono ml-2 select-none">
                    TecJustica Transcribe
                  </span>
                </div>

                <video
                  ref={videoRef}
                  className="w-full aspect-video bg-surface-0"
                  poster="/demo/demo-poster.jpg"
                  controls
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                >
                  <source src="/demo/demo.mp4" type="video/mp4" />
                </video>
              </div>

              {/* ── Timeline bar ── */}
              <div className="mt-4 px-1">
                <div className="relative h-1 bg-surface-3 rounded-full overflow-visible">
                  {/* Progress fill */}
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-brand-green via-brand-teal to-brand-cyan"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                  {/* Milestone markers */}
                  {milestones.map((m, i) => {
                    const pos = (m.startTime / 230) * 100;
                    return (
                      <button
                        key={m.id}
                        onClick={() => seekTo(m.startTime)}
                        className="absolute top-1/2 -translate-y-1/2 group"
                        style={{ left: `${pos}%` }}
                        title={m.title}
                      >
                        <span
                          className={`block w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                            activeIndex === i
                              ? "bg-brand-cyan border-brand-cyan scale-125 shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                              : "bg-surface-3 border-zinc-600 group-hover:border-zinc-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                {/* Milestone labels */}
                <div className="flex justify-between mt-2.5">
                  {milestones.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => seekTo(m.startTime)}
                      className={`text-[10px] font-mono transition-colors duration-200 ${
                        activeIndex === i ? "text-brand-cyan" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      {m.title.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Feature card panel ── */}
            <div className="lg:w-[38%] flex items-start lg:items-center lg:pt-0 pt-2">
              <div className="w-full min-h-[300px] flex items-center">
                <AnimatePresence mode="wait">
                  {active ? (
                    <motion.div
                      key={active.id}
                      className="relative w-full glass glow-card rounded-2xl p-7"
                      initial={{ opacity: 0, x: 40, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.96 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      {/* Glow behind card */}
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-brand-green/10 via-transparent to-brand-cyan/10 -z-10 blur-sm" />

                      {/* Icon + step */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green via-brand-teal to-brand-blue text-white shadow-lg shadow-brand-teal/10">
                          {icons[active.id]}
                        </div>
                        <div className="flex items-center gap-2">
                          {milestones.map((_, i) => (
                            <span
                              key={i}
                              className={`block h-1 rounded-full transition-all duration-300 ${
                                i === activeIndex
                                  ? "w-5 bg-brand-cyan"
                                  : i < (activeIndex ?? 0)
                                    ? "w-1.5 bg-zinc-500"
                                    : "w-1.5 bg-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <h3 className="font-display text-2xl lg:text-[1.7rem] mb-2 text-white leading-tight">
                        {active.title}
                      </h3>

                      <p className="text-zinc-400 text-sm leading-relaxed mb-5 font-body">
                        {active.description}
                      </p>

                      <ul className="space-y-2.5">
                        {active.bullets.map((bullet, i) => (
                          <motion.li
                            key={bullet}
                            custom={i}
                            variants={bulletVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex items-center gap-3 text-sm text-zinc-300 font-body"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-black"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            {bullet}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="transition"
                      className="w-full glass rounded-2xl p-7 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-zinc-600 mx-auto mb-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <p className="text-zinc-600 text-sm font-body">
                        Assista ao vídeo — os recursos aparecem<br />conforme a demo avança
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
