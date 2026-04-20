"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const transcriptionLines = [
  { speaker: "JUIZA", color: "#00e676", text: "Neide, a senhora ta me ouvindo bem?" },
  { speaker: "VITIMA", color: "#00bcd4", text: "Sim, Doutora. Estou ouvindo." },
  { speaker: "JUIZA", color: "#00e676", text: "David, voce precisa me retirar daqui, o David, o que que aconteceu?" },
  { speaker: "ACUSADO", color: "#2196f3", text: "Retira dai, David." },
  { speaker: "PROMOTOR", color: "#ff9800", text: "Meritissima, gostaria de registrar que o acusado demonstrou comportamento agressivo." },
  { speaker: "DEFENSOR", color: "#ab47bc", text: "Excelencia, meu cliente nega todas as acusacoes apresentadas." },
];

function AudioWaveform({ active }: { active: boolean }) {
  const bars = 48;
  return (
    <div className="flex items-center justify-center gap-[2px] h-12">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = Math.sin((i / bars) * Math.PI) * 0.7 + 0.3;
        return (
          <motion.div
            key={i}
            className="w-[2px] rounded-full origin-bottom"
            style={{
              background: "linear-gradient(to top, #00e676, #00bcd4, #2196f3)",
              opacity: active ? 0.6 : 0.15,
            }}
            animate={
              active
                ? {
                    height: [
                      `${baseHeight * 20}%`,
                      `${(baseHeight * 0.3 + Math.random() * 0.7) * 100}%`,
                      `${baseHeight * 40}%`,
                      `${(baseHeight * 0.2 + Math.random() * 0.8) * 100}%`,
                      `${baseHeight * 20}%`,
                    ],
                  }
                : { height: `${baseHeight * 15}%` }
            }
            transition={
              active
                ? {
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                    delay: i * 0.02,
                  }
                : { duration: 0.5 }
            }
          />
        );
      })}
    </div>
  );
}

function PipelineStep({
  label,
  icon,
  active,
  completed,
  delay,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  completed: boolean;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: active || completed ? 1 : 0.3 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-500 ${
          completed
            ? "bg-brand-green/20 text-brand-green"
            : active
              ? "bg-brand-cyan/20 text-brand-cyan animate-pulse"
              : "bg-white/5 text-zinc-600"
        }`}
      >
        {completed ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          icon
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors duration-500 ${
          active ? "text-brand-cyan" : completed ? "text-brand-green" : "text-zinc-600"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}

export default function HeroScene() {
  const [phase, setPhase] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [typingText, setTypingText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation cycle
  useEffect(() => {
    function runCycle() {
      setPhase(0);
      setVisibleLines(0);
      setTypingText("");

      const timers = [
        setTimeout(() => setPhase(1), 1500),
        setTimeout(() => setPhase(2), 3000),
        setTimeout(() => setPhase(3), 13000),
        setTimeout(() => setPhase(4), 15000),
      ];

      return timers;
    }

    let timers = runCycle();
    const loop = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = runCycle();
    }, 20000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, []);

  // Typing effect
  useEffect(() => {
    if (phase !== 2) {
      if (phase < 2) {
        setVisibleLines(0);
        setTypingText("");
      }
      return;
    }

    if (visibleLines >= transcriptionLines.length) return;

    const currentLine = transcriptionLines[visibleLines];
    let charIndex = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (charIndex >= currentLine.text.length) {
        clearInterval(intervalRef.current!);
        setTimeout(() => {
          setVisibleLines((v) => v + 1);
          setTypingText("");
        }, 350);
        return;
      }
      charIndex++;
      setTypingText(currentLine.text.substring(0, charIndex));
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, visibleLines]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[180px] transition-all duration-[3000ms]"
        style={{
          background:
            phase >= 2
              ? "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(0,229,255,0.02) 0%, transparent 70%)",
        }}
      />

      {/* Simulated app window */}
      <motion.div
        className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[480px] max-w-[38vw] hidden lg:block"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 0.5, x: 0 }}
        transition={{ duration: 1.2, delay: 0.8 }}
      >
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-sm shadow-2xl shadow-black/60">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a]/80 border-b border-white/[0.04]">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500/60" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <span className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">TecJustica Transcribe</span>
          </div>

          <div className="p-4 space-y-3">
            {/* Pipeline */}
            <div className="flex flex-wrap gap-3 mb-3">
              <PipelineStep label="Audio" icon={<span className="text-[10px]">&#9835;</span>} active={phase === 1} completed={phase > 1} delay={0} />
              <PipelineStep label="Transcrever" icon={<span className="text-[10px]">T</span>} active={phase === 2} completed={phase > 2} delay={0.2} />
              <PipelineStep label="Analisar" icon={<span className="text-[10px]">&#10024;</span>} active={phase === 3} completed={phase > 3} delay={0.4} />
            </div>

            {/* Waveform */}
            <AnimatePresence>
              {phase >= 1 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}>
                  <div className="rounded-lg bg-black/40 p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${phase <= 2 ? "bg-brand-green animate-pulse" : "bg-zinc-600"}`} />
                      <span className="text-[10px] text-zinc-500 font-mono">audiencia_2026-03-21.mp4</span>
                    </div>
                    <AudioWaveform active={phase <= 2} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcription output */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 max-h-[180px] overflow-hidden">
                  {transcriptionLines.slice(0, visibleLines).map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-start">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: line.color, backgroundColor: `${line.color}15` }}>
                        {line.speaker}
                      </span>
                      <span className="text-[11px] text-zinc-400 leading-relaxed">{line.text}</span>
                    </motion.div>
                  ))}

                  {visibleLines < transcriptionLines.length && typingText && (
                    <div className="flex gap-2 items-start">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: transcriptionLines[visibleLines].color, backgroundColor: `${transcriptionLines[visibleLines].color}15` }}>
                        {transcriptionLines[visibleLines].speaker}
                      </span>
                      <span className="text-[11px] text-zinc-300 leading-relaxed">
                        {typingText}
                        <span className="inline-block w-[2px] h-3 bg-brand-cyan ml-0.5 animate-pulse" />
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Analysis */}
            <AnimatePresence>
              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-2 p-3 rounded-lg border border-brand-cyan/10 bg-brand-cyan/[0.03]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-brand-cyan text-xs">&#10024;</span>
                    <span className="text-[10px] font-semibold text-brand-cyan">Analise com IA</span>
                  </div>
                  <motion.p className="text-[10px] text-zinc-500 leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    Audiencia trata de denuncia do MP contra o acusado por perseguicao e ameacas a vitima. 4 falantes identificados.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Done */}
            <AnimatePresence>
              {phase >= 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 mt-2">
                  <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-brand-green font-medium">Transcricao completa — DOCX, SRT, TXT exportados</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
