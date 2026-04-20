"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GITHUB_RELEASES_URL =
  "https://github.com/marcosmarf27/tecjustica-transcribe-desktop-releases/releases/latest";

/* ------------------------------------------------------------------ */
/*  CodeBlock — bloco de terminal PowerShell com botão copiar         */
/* ------------------------------------------------------------------ */
function CodeBlock({
  command,
  output,
  label = "PowerShell",
}: {
  command: string;
  output?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a] my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e0e]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="text-[11px] text-zinc-500 font-mono ml-2">
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-all duration-200 cursor-pointer"
          style={{
            color: copied ? "#00e676" : "#71717a",
            background: copied ? "rgba(0,230,118,0.08)" : "transparent",
          }}
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      {/* Body */}
      <div className="px-4 py-3.5 font-mono text-sm leading-relaxed overflow-x-auto">
        <div className="flex items-start gap-2">
          <span className="text-brand-cyan select-none shrink-0">PS&gt;</span>
          <span className="text-emerald-300">{command}</span>
        </div>
        {output && (
          <div className="mt-2 text-zinc-500 text-xs leading-relaxed whitespace-pre-wrap">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tip — bloco de dica / aviso                                       */
/* ------------------------------------------------------------------ */
function Tip({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  const styles = {
    info: {
      border: "border-brand-cyan/20",
      bg: "bg-brand-cyan/[0.03]",
      icon: "💡",
      label: "Dica",
      labelColor: "text-brand-cyan",
    },
    warning: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/[0.03]",
      icon: "⚠️",
      label: "Atenção",
      labelColor: "text-amber-400",
    },
    success: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.03]",
      icon: "✅",
      label: "Resultado",
      labelColor: "text-emerald-400",
    },
  };

  const s = styles[variant];

  return (
    <div
      className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 my-4 flex gap-3`}
    >
      <span className="text-base shrink-0 mt-0.5">{s.icon}</span>
      <div className="text-sm text-zinc-400 leading-relaxed">
        <span className={`font-semibold ${s.labelColor}`}>{s.label}: </span>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Steps data                                                        */
/* ------------------------------------------------------------------ */
const steps = [
  {
    number: 1,
    title: "Abrir o PowerShell",
    badge: null,
    description:
      "O PowerShell é o terminal de comandos do Windows. Vamos usá-lo para verificar se seu computador está pronto.",
    content: (
      <>
        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              1
            </span>
            <span>
              Pressione as teclas <kbd className="font-mono text-white bg-zinc-700 px-2 py-0.5 rounded text-xs border border-zinc-600">Windows</kbd> + <kbd className="font-mono text-white bg-zinc-700 px-2 py-0.5 rounded text-xs border border-zinc-600">X</kbd> ao mesmo tempo
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              2
            </span>
            <span>
              No menu que aparecer, clique em <strong className="text-white">Terminal</strong> ou <strong className="text-white">Windows PowerShell</strong>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              3
            </span>
            <span>
              Uma janela escura com texto vai abrir — é ali que você vai digitar os comandos
            </span>
          </div>
        </div>
        <Tip variant="info">
          Outra forma: clique no <strong className="text-white">Menu Iniciar</strong>, digite <strong className="text-white">PowerShell</strong> e pressione Enter.
        </Tip>
      </>
    ),
  },
  {
    number: 2,
    title: "Verificar o Python",
    badge: null,
    description:
      "O Python é a linguagem que o motor de transcrição usa por baixo dos panos. Verifique se já está instalado:",
    content: (
      <>
        <CodeBlock
          command="python --version"
          output="Python 3.11.9"
        />
        <Tip variant="success">
          Se aparecer <code className="font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">Python 3.10.x</code> até{" "}
          <code className="font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">3.13.x</code>, está tudo certo! Pule para o Passo 3.
        </Tip>
        <p className="text-sm text-zinc-400 mt-4 mb-1">
          Se aparecer um erro ou abrir a Microsoft Store, tente este comando alternativo:
        </p>
        <CodeBlock
          command="py --version"
          output="Python 3.11.9"
        />
        <p className="text-sm text-zinc-400 mt-4 mb-2">
          Se nenhum dos dois comandos funcionou, instale o Python com este comando:
        </p>
        <CodeBlock
          command="winget install Python.Python.3.11"
          output={`Encontrado Python 3.11 [Python.Python.3.11]\nIniciando instalação...\nInstalação concluída com sucesso.`}
        />
        <Tip variant="warning">
          Após instalar, <strong className="text-white">feche o PowerShell e abra novamente</strong> (senão ele não encontra o Python). Depois verifique com{" "}
          <code className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">python --version</code>.
        </Tip>
        <Tip variant="info">
          Não se preocupe se não conseguir instalar — o app também tenta instalar o Python automaticamente no primeiro uso.
        </Tip>
      </>
    ),
  },
  {
    number: 3,
    title: "Verificar o FFmpeg",
    badge: null,
    description:
      "O FFmpeg é um programa que permite ao app ler arquivos de áudio e vídeo (MP3, MP4, etc). Verifique se está instalado:",
    content: (
      <>
        <CodeBlock
          command="ffmpeg -version"
          output="ffmpeg version 7.1 Copyright (c) 2000-2025 the FFmpeg developers"
        />
        <Tip variant="success">
          Se aparecer a versão do FFmpeg, está OK! Pule para o Passo 4.
        </Tip>
        <p className="text-sm text-zinc-400 mt-4 mb-2">
          Se aparecer um erro dizendo que o comando não foi reconhecido, instale com:
        </p>
        <CodeBlock
          command="winget install Gyan.FFmpeg"
          output={`Encontrado FFmpeg [Gyan.FFmpeg]\nIniciando instalação...\nInstalação concluída com sucesso.`}
        />
        <Tip variant="warning">
          Feche o PowerShell e abra novamente após a instalação. Depois verifique com{" "}
          <code className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">ffmpeg -version</code>.
        </Tip>
        <Tip variant="info">
          Assim como o Python, o app também tenta instalar o FFmpeg automaticamente se não encontrar.
        </Tip>
      </>
    ),
  },
  {
    number: 4,
    title: "Verificar GPU NVIDIA",
    badge: "Opcional",
    description:
      "Se o seu computador tem uma placa de vídeo NVIDIA, a transcrição fica até 10x mais rápida. Sem GPU, o app funciona normalmente — só demora mais.",
    content: (
      <>
        <CodeBlock
          command="nvidia-smi"
          output={`+-----------------------------------------------------------------------------------------+\n| NVIDIA-SMI 561.09     Driver Version: 561.09     CUDA Version: 12.6                    |\n|   GPU Name              TCC/WDDM   | Bus-Id      Disp.  Volatile Uncorr. ECC           |\n|   NVIDIA GeForce RTX 3060   WDDM   | 00000000:01:00.0  On                 N/A           |\n+-----------------------------------------------------------------------------------------+`}
        />
        <Tip variant="info">
          Confira dois valores importantes:{" "}
          <strong className="text-white">Driver Version</strong> (deve ser 560 ou superior) e{" "}
          <strong className="text-white">CUDA Version</strong> (deve ser 12.6 ou superior).
        </Tip>
        <Tip variant="warning">
          Se o comando retornar erro, significa que você <strong className="text-white">não tem GPU NVIDIA</strong> ou o driver não está instalado. O app ainda funciona, mas usará a CPU (mais lento). Se tem GPU NVIDIA, atualize o driver em{" "}
          <a
            href="https://www.nvidia.com/drivers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-cyan hover:underline"
          >
            nvidia.com/drivers
          </a>.
        </Tip>
      </>
    ),
  },
  {
    number: 5,
    title: "Baixar e Instalar o App",
    badge: null,
    description:
      "Agora que verificamos seu sistema, vamos baixar e instalar o TecJustiça Transcribe:",
    content: (
      <>
        <div className="my-4">
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 btn-gradient py-3 px-6 rounded-xl font-medium text-sm"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar TecJustiça Transcribe (.exe)
          </a>
        </div>

        <div className="space-y-3 mt-5">
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              1
            </span>
            <span>
              Execute o instalador <code className="font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">.exe</code> baixado
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              2
            </span>
            <span>
              Se o Windows Defender exibir aviso, clique em{" "}
              <strong className="text-white">&quot;Mais informações&quot;</strong> → {" "}
              <strong className="text-white">&quot;Executar assim mesmo&quot;</strong>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              3
            </span>
            <span>
              O app será instalado e ficará disponível no <strong className="text-white">Menu Iniciar</strong>
            </span>
          </div>
        </div>

        <Tip variant="info">
          O aviso do Windows Defender é normal — acontece porque o instalador não possui assinatura digital. O app é seguro e todo o processamento é local.
        </Tip>
      </>
    ),
  },
  {
    number: 6,
    title: "Ativar Licença",
    badge: null,
    description:
      "Na primeira vez que abrir o app, ele vai pedir uma chave de licença para funcionar:",
    content: (
      <>
        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              1
            </span>
            <span>Abra o app pelo Menu Iniciar</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              2
            </span>
            <span>Insira sua chave de licença no campo exibido</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              3
            </span>
            <span>
              Clique em <strong className="text-white">Ativar</strong> — requer conexão com internet
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            href="/trial"
            className="btn-gradient py-2.5 px-5 rounded-xl text-sm font-medium inline-block"
          >
            Teste grátis (7 dias)
          </Link>
          <Link
            href="/#precos"
            className="btn-ghost py-2.5 px-5 rounded-xl text-sm font-medium inline-block"
          >
            Ver planos
          </Link>
        </div>

        <Tip variant="info">
          Após ativação, o app funciona offline por até 72h (assinaturas) ou ilimitado (licença vitalícia).
        </Tip>
      </>
    ),
  },
  {
    number: 7,
    title: "Configurar Token HuggingFace",
    badge: "Opcional",
    description:
      "Este passo é necessário apenas se você quer identificar quem está falando (ex: Juiz, Promotor, Advogado). Sem ele, a transcrição de texto funciona normalmente.",
    content: (
      <>
        <div className="space-y-3 mt-2">
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              1
            </span>
            <span>
              Crie uma conta em{" "}
              <a
                href="https://huggingface.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan hover:underline"
              >
                huggingface.co
              </a>{" "}
              e <strong className="text-white">verifique seu email</strong>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              2
            </span>
            <span>
              Gere um token em{" "}
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan hover:underline"
              >
                huggingface.co/settings/tokens
              </a>
            </span>
          </div>
        </div>

        <Tip variant="warning">
          <strong className="text-white">IMPORTANTE:</strong> Escolha o tipo{" "}
          <strong className="text-white">&quot;Read&quot;</strong> (acesso de leitura). Tokens do tipo &quot;Fine-grained&quot; <strong className="text-white">não funcionam</strong>.
        </Tip>

        <div className="space-y-3 mt-3">
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              3
            </span>
            <span>
              Aceite os termos dos modelos:{" "}
              <a
                href="https://huggingface.co/pyannote/speaker-diarization-3.1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan hover:underline"
              >
                speaker-diarization-3.1
              </a>{" "}
              e{" "}
              <a
                href="https://huggingface.co/pyannote/segmentation-3.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan hover:underline"
              >
                segmentation-3.0
              </a>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              4
            </span>
            <span>
              No app, vá em{" "}
              <strong className="text-white">Configurações</strong> → cole o token →{" "}
              <strong className="text-white">Salvar Alterações</strong>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              5
            </span>
            <span>
              Vá em <strong className="text-white">Diagnóstico</strong> para confirmar que aparece{" "}
              <span className="text-emerald-400 font-medium">&quot;Válido&quot;</span>
            </span>
          </div>
        </div>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GuiaPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-teal/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-zinc-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              Windows 10 / Windows 11
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4">
              Guia de{" "}
              <span className="text-gradient">Instalação</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
              Prepare seu Windows para o TecJustiça Transcribe em poucos minutos. Siga o passo a passo abaixo.
            </p>

            <div className="mt-8 inline-flex items-start gap-3 glass rounded-xl px-5 py-4 text-left max-w-lg border border-white/[0.04]">
              <span className="text-lg shrink-0">🤖</span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300">O app instala dependências automaticamente</strong> no primeiro uso. Este guia ajuda a verificar e resolver previamente, evitando problemas.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-line max-w-3xl mx-auto" />

      {/* Steps timeline */}
      <section className="relative max-w-3xl mx-auto px-4 py-16">
        {/* Vertical line */}
        <div className="absolute left-[27px] sm:left-[31px] top-16 bottom-16 w-px bg-gradient-to-b from-brand-cyan/30 via-brand-teal/20 to-transparent" />

        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative pl-16 sm:pl-20 pb-12 last:pb-0"
            >
              {/* Step number */}
              <div className="absolute left-0 top-0 w-[54px] sm:w-[62px] flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#0e0e0e] border border-white/[0.08] flex items-center justify-center font-mono text-sm font-bold text-brand-cyan shadow-lg shadow-brand-cyan/5">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-xl font-semibold text-white tracking-tight">
                    {step.title}
                  </h2>
                  {step.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  {step.description}
                </p>
                <div className="glass rounded-2xl p-5 sm:p-6 border border-white/[0.04]">
                  {step.content}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="section-line max-w-3xl mx-auto" />

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
            Pronto para começar?
          </h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            Com Python, FFmpeg e o app instalados, você está pronto para transcrever audiências com IA.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/trial"
              className="btn-gradient py-3 px-7 rounded-xl text-sm font-medium"
            >
              Começar teste grátis
            </Link>
            <Link
              href="/download"
              className="btn-ghost py-3 px-7 rounded-xl text-sm font-medium"
            >
              Página de download
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
