"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "seu plano";

  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-green-900/30 border border-green-700 rounded-2xl p-8 mb-6">
        <svg
          className="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <h1 className="text-2xl font-bold text-green-400 mb-2">
          Pagamento confirmado!
        </h1>

        <p className="text-zinc-400 mb-4">
          Seu plano <span className="text-white font-medium">{plan}</span> foi
          ativado com sucesso. Sua licença já está atualizada.
        </p>

        <p className="text-zinc-500 text-sm">
          Você pode fechar esta página e continuar usando o aplicativo
          normalmente.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href="/download"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          Baixar o aplicativo
        </a>
        <a
          href="/"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
