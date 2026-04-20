'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'A ferramenta cumpre a LGPD e a Resolução nº 615 do CNJ?',
    answer:
      'Sim. A transcrição, diarização e exportação são 100% locais — nenhum dado de áudio, vídeo ou texto sai do seu computador. Isso atende à LGPD (Lei nº 13.709/2018) e à Resolução CNJ nº 615/2025. Observação importante: os recursos de Análise Inteligente e Chat com IA utilizam a API do Google Gemini, o que envolve o envio do texto transcrito para os servidores do Google. Para usar esses recursos, é necessário configurar sua própria chave de API Gemini. O Google processa os dados conforme seus termos de serviço, que incluem criptografia em trânsito e compromisso de não usar dados de APIs pagas para treinamento de modelos. Para processos sigilosos, recomendamos utilizar apenas a transcrição local, sem ativar a análise por IA.',
  },
  {
    question: 'Posso usar em processos sigilosos?',
    answer:
      'A transcrição em si é 100% segura para processos sigilosos — roda offline no seu computador sem enviar dados para nenhum servidor. Porém, se você ativar os recursos de Análise Inteligente ou Chat com IA (que usam o Google Gemini), o texto transcrito será enviado à API do Google para processamento. Para processos sob sigilo, utilize normalmente a transcrição, diarização e exportação (que são 100% locais) e evite os recursos de análise por IA. Dessa forma, não há risco ao sigilo processual ou à privacidade dos dados.',
  },
  {
    question: 'Funciona sem placa de vídeo NVIDIA?',
    answer:
      'Sim! O app funciona em modo CPU, porém a transcrição será significativamente mais lenta. Para 1 hora de áudio, espere entre 30 e 60 minutos com CPU, contra 3 a 10 minutos com GPU NVIDIA.',
  },
  {
    question: 'Funciona no macOS?',
    answer:
      'Não. Atualmente o TecJustiça Transcribe está disponível apenas para Windows 10+ e Linux (Ubuntu 20.04+). Não há previsão de suporte a macOS.',
  },
  {
    question: 'Preciso instalar Python manualmente?',
    answer:
      'No Windows, o app instala Python automaticamente via winget se necessário. No Linux, você precisa instalar antes com: sudo apt install python3 python3-venv',
  },
  {
    question: 'Quanto tempo demora o setup inicial?',
    answer:
      'Entre 10 e 30 minutos no primeiro uso, dependendo da velocidade da sua internet. São baixados cerca de 3 GB de dependências (PyTorch, WhisperX, modelos de IA). Após o setup, o app abre instantaneamente.',
  },
  {
    question: 'Meus áudios são enviados para a nuvem?',
    answer:
      'Não. O processamento é 100% local e offline. Seus arquivos nunca saem do seu computador. A internet só é necessária no primeiro uso para baixar as dependências.',
  },
  {
    question: 'Quais formatos de áudio e vídeo são suportados?',
    answer:
      'MP4, MP3, WAV, MKV, WebM, OGG, FLAC, AAC e todos os demais formatos suportados pelo ffmpeg.',
  },
  {
    question: 'Posso usar em mais de um computador?',
    answer:
      'Cada licença permite ativação em 1 computador. Para usar em outro dispositivo, você precisará de uma licença adicional.',
  },
  {
    question: 'Como funciona o período de teste?',
    answer:
      'O teste grátis dura 7 dias com acesso completo a todas as funcionalidades, sem necessidade de cartão de crédito. Basta informar seu nome e email para receber a chave de licença.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl text-white md:text-5xl"
          >
            Perguntas <span className="text-gradient">frequentes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-zinc-400"
          >
            Tire suas dúvidas antes de começar
          </motion.p>
        </div>

        {/* Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-3"
        >
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className={`glass rounded-xl border transition-colors duration-300 ${
                  isOpen ? 'border-brand-teal/30' : 'border-white/[0.06] hover:border-brand-teal/20'
                }`}
              >
                {/* Question header */}
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-white">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isOpen ? 'text-brand-cyan' : 'text-zinc-500'
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </motion.span>
                </button>

                {/* Answer body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-0">
                        <p className="text-sm leading-relaxed text-zinc-400">
                          {item.answer.includes('sudo apt') ? (
                            <>
                              {item.answer.split('sudo apt')[0]}
                              <code className="font-mono text-brand-cyan bg-white/[0.05] px-1.5 py-0.5 rounded text-xs">
                                sudo apt install python3 python3-venv
                              </code>
                            </>
                          ) : (
                            item.answer
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
