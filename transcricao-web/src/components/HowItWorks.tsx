'use client';

import { motion } from 'framer-motion';

interface Step {
  number: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Instale',
    description: 'Baixe e instale em minutos. Setup automático de todas as dependências.',
  },
  {
    number: 2,
    title: 'Importe',
    description: 'Arraste seu vídeo ou áudio da audiência. MP4, MP3, WAV e mais.',
  },
  {
    number: 3,
    title: 'Transcreva',
    description: 'A IA transcreve com identificação de quem falou. Progresso em tempo real.',
  },
  {
    number: 4,
    title: 'Analise',
    description: 'Revise, edite, converse com IA e exporte em DOCX, SRT ou TXT.',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-24 sm:py-32">
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
            Como funciona
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-zinc-400"
          >
            Da audiência gravada ao texto estruturado em minutos
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col items-start gap-12 md:flex-row md:items-start md:gap-0">
          {/* Connecting line — desktop (horizontal) */}
          <div
            className="absolute left-0 right-0 top-6 z-0 hidden h-px md:block"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--brand-teal), var(--brand-cyan), var(--brand-teal), transparent)',
              opacity: 0.3,
              marginLeft: '6%',
              marginRight: '6%',
            }}
          />

          {/* Connecting line — mobile (vertical) */}
          <div
            className="absolute bottom-0 left-6 top-0 z-0 w-px md:hidden"
            style={{
              background: 'linear-gradient(180deg, transparent, var(--brand-teal), var(--brand-cyan), var(--brand-teal), transparent)',
              opacity: 0.3,
            }}
          />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.2, ease: 'easeOut' }}
              className="relative z-10 flex flex-1 flex-row items-start gap-4 md:flex-col md:items-center md:text-center"
            >
              {/* Number circle */}
              <div className="relative flex-shrink-0">
                {/* Gradient border ring */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#030303] p-px">
                  <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-green), var(--brand-teal), var(--brand-blue))',
                      padding: '1px',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                    }}
                  />
                  <span className="font-mono text-lg font-bold text-brand-cyan">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="pt-0.5 md:mt-5 md:pt-0">
                <h3 className="text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-zinc-400 md:mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section separator */}
      <div className="section-line mx-auto mt-24 max-w-4xl sm:mt-32" />
    </section>
  );
}
