'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface ReqItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const minRequirements: ReqItem[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
    label: 'Sistema',
    value: 'Windows 10+ (64-bit) ou Linux (Ubuntu 20.04+)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6v6H9z" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
      </svg>
    ),
    label: 'Processador',
    value: 'Qualquer CPU x64 moderno',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 19v-8a6 6 0 0 1 12 0v8" />
        <path d="M6 19h12" />
        <path d="M6 15h12" />
      </svg>
    ),
    label: 'Memória RAM',
    value: '8 GB',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 5H3v14h18V5z" />
        <path d="M7 5V3M17 5V3M7 19v2M17 19v2" />
      </svg>
    ),
    label: 'Disco',
    value: '~4 GB livres',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    label: 'Internet',
    value: 'Apenas no primeiro uso (~3 GB)',
  },
];

export default function Requirements() {
  return (
    <section id="requisitos" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl text-white md:text-5xl"
          >
            Requisitos do <span className="text-gradient">sistema</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-zinc-400"
          >
            Disponível para Windows e Linux. macOS não é suportado.
          </motion.p>
        </div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Minimum Requirements Card */}
          <motion.div variants={cardVariants} className="glass glow-card rounded-2xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Requisitos Mínimos</h3>
            </div>

            <div className="space-y-4">
              {minRequirements.map((req) => (
                <div key={req.label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-brand-cyan">{req.icon}</span>
                  <div className="min-w-0">
                    <span className="block text-xs text-zinc-500 uppercase tracking-wide">{req.label}</span>
                    <span className="text-sm font-medium text-white">{req.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recommended / Performance Card */}
          <motion.div
            variants={cardVariants}
            className="relative rounded-2xl p-[1px] bg-gradient-to-br from-brand-green via-brand-teal to-brand-blue"
          >
            <div className="h-full rounded-2xl bg-surface-1 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-green via-brand-teal to-brand-blue text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recomendado para Performance</h3>
                  <span className="text-xs text-brand-cyan">Até 10x mais rápido</span>
                </div>
              </div>

              {/* GPU Spec */}
              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-brand-green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M6 10h4v4H6z" />
                      <path d="M14 10h1M17 10h1M14 14h1M17 14h1" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-xs text-zinc-500 uppercase tracking-wide">GPU</span>
                    <span className="text-sm font-medium text-white">NVIDIA com suporte CUDA (driver 560+)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-brand-green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 19v-8a6 6 0 0 1 12 0v8" />
                      <path d="M6 19h12" />
                      <path d="M6 15h12" />
                    </svg>
                  </span>
                  <div>
                    <span className="block text-xs text-zinc-500 uppercase tracking-wide">Memória RAM</span>
                    <span className="text-sm font-medium text-white">16 GB</span>
                  </div>
                </div>
              </div>

              {/* Performance comparison bars */}
              <div className="rounded-xl bg-black/40 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Tempo para transcrever 1h de áudio
                </p>

                {/* GPU bar */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-brand-green font-medium">GPU NVIDIA</span>
                    <span className="text-zinc-400">3–10 min</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-cyan"
                      initial={{ width: 0 }}
                      whileInView={{ width: '90%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* CPU bar */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Somente CPU</span>
                    <span className="text-zinc-500">30–60 min</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-zinc-600"
                      initial={{ width: 0 }}
                      whileInView={{ width: '15%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Auto-setup banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 glass rounded-2xl p-5 sm:p-6 border border-brand-teal/10"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 text-brand-teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-white mb-1">
                Setup automático no primeiro uso
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                O app instala Python, ffmpeg, PyTorch e WhisperX automaticamente na primeira execução.
                O processo leva entre 10 e 30 minutos, dependendo da velocidade da sua internet.
                Após o setup inicial, o app abre instantaneamente. Funciona sem GPU (modo CPU), porém mais lento.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
