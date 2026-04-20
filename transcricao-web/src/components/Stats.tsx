'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;

    const start = performance.now();

    function update(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }, [inView, target, duration]);

  return { count, ref };
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 10, suffix: 'x', label: 'Mais rápido com GPU' },
  { value: 95, suffix: '%+', label: 'Precisão de transcrição' },
  { value: 100, suffix: '%', label: 'Offline e privado' },
  { value: 6, suffix: '', label: 'Formatos de exportação' },
];

const techBadges = ['WhisperX', 'NVIDIA CUDA', 'PyTorch', 'FastAPI'];

/* ------------------------------------------------------------------ */
/*  Individual stat component                                          */
/* ------------------------------------------------------------------ */

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const { count, ref } = useCountUp(stat.value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
      className="flex flex-col items-center py-6"
    >
      <span className="text-gradient font-display text-5xl md:text-6xl">
        {count}
        {stat.suffix}
      </span>
      <span className="mt-2 text-sm text-zinc-400">{stat.label}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats section                                                      */
/* ------------------------------------------------------------------ */

export default function Stats() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Radial glow background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,229,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <StatItem key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* Tech badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {techBadges.map((badge) => (
            <span
              key={badge}
              className="glass rounded-full px-4 py-1.5 text-xs text-zinc-500"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Section separator */}
      <div className="section-line mx-auto mt-24 max-w-4xl sm:mt-32" />
    </section>
  );
}
