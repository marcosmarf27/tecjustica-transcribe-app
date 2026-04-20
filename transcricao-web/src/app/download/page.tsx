"use client";

import { useEffect, useState } from "react";

const GITHUB_RELEASES_URL =
  "https://github.com/marcosmarf27/tecjustica-transcribe-desktop-releases/releases/latest";

type OS = "windows" | "linux" | "unsupported";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("android")) return "unsupported";
  if (ua.includes("linux")) return "linux";
  return "unsupported";
}

const osInfo: Record<
  "windows" | "linux",
  { label: string; file: string; icon: string; instructions: string[] }
> = {
  windows: {
    label: "Windows",
    file: "TecJustica-Transcribe-Setup.exe", // não renderizado — link vai para /releases/latest
    icon: "🪟",
    instructions: [
      "Baixe o arquivo .exe na página de releases",
      'Execute o instalador e clique em "Instalar"',
      "O app abrirá automaticamente",
      "Cole sua chave de licença na tela de ativação",
    ],
  },
  linux: {
    label: "Linux",
    file: "TecJustica-Transcribe.AppImage", // não renderizado — link vai para /releases/latest
    icon: "🐧",
    instructions: [
      "Baixe o arquivo .AppImage na página de releases",
      "Dê permissão de execução: chmod +x *.AppImage",
      "Execute o arquivo",
      "Cole sua chave de licença na tela de ativação",
    ],
  },
};

const requirements = [
  { label: "Sistema", value: "Windows 10+ ou Linux" },
  { label: "GPU", value: "NVIDIA recomendada (CUDA 560+)" },
  { label: "RAM", value: "8 GB min / 16 GB recomendado" },
  { label: "Disco", value: "~4 GB livres" },
  { label: "Internet", value: "Necessária no primeiro uso" },
];

export default function DownloadPage() {
  const [os, setOS] = useState<OS>("unsupported");

  useEffect(() => {
    setOS(detectOS());
  }, []);

  const isSupported = os === "windows" || os === "linux";
  const info = isSupported ? osInfo[os] : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <a
          href="/"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-4 inline-block"
        >
          &larr; Voltar ao início
        </a>

        <h1 className="text-3xl font-bold mb-2">Baixar TecJustica Transcribe</h1>

        {isSupported && info ? (
          <>
            <p className="text-zinc-400 mb-8">
              Detectamos que você está usando{" "}
              <span className="text-white font-medium">{info.label}</span>
            </p>

            <div className="glass rounded-2xl p-8 mb-6 border border-white/[0.06]">
              <div className="text-4xl mb-4">{info.icon}</div>

              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block btn-gradient py-3 px-8 rounded-lg font-medium mb-6"
              >
                Baixar para {info.label}
              </a>

              <div className="text-left">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Como instalar:
                </h3>
                <ol className="space-y-2">
                  {info.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                      <span className="bg-zinc-800 text-zinc-300 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* OS Switcher */}
            <div className="flex gap-4 justify-center text-sm mb-6">
              {(["windows", "linux"] as const)
                .filter((o) => o !== os)
                .map((o) => (
                  <button
                    key={o}
                    onClick={() => setOS(o)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {osInfo[o].label}
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-400 mb-8">
              Verifique os sistemas suportados abaixo
            </p>

            {/* Unsupported OS warning */}
            <div className="glass rounded-2xl p-8 mb-6 border border-amber-500/20">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Sistema não suportado
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                O TecJustiça Transcribe está disponível apenas para{" "}
                <strong className="text-white">Windows 10+</strong> e{" "}
                <strong className="text-white">Linux</strong> (Ubuntu 20.04+).
                macOS, Android e iOS não são suportados.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setOS("windows")}
                  className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-medium"
                >
                  🪟 Windows
                </button>
                <button
                  onClick={() => setOS("linux")}
                  className="btn-ghost px-6 py-2.5 rounded-lg text-sm font-medium"
                >
                  🐧 Linux
                </button>
              </div>
            </div>
          </>
        )}

        {/* System Requirements Summary */}
        <div className="glass rounded-2xl p-6 border border-white/[0.06] text-left mb-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-cyan">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Requisitos do sistema
          </h3>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div key={req.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{req.label}</span>
                <span className="text-zinc-300">{req.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <a
              href="/#requisitos"
              className="text-xs text-brand-cyan hover:underline transition-colors"
            >
              Ver requisitos completos →
            </a>
          </div>
        </div>

        <p className="text-zinc-600 text-xs">
          Todas as versões disponíveis em{" "}
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 underline"
          >
            GitHub Releases
          </a>
        </p>
      </div>
    </main>
  );
}
