import TrialForm from "@/components/TrialForm";

export const metadata = {
  title: "Teste Grátis - TecJustiça Transcribe",
  description: "Comece seu teste grátis de 7 dias do TecJustiça Transcribe.",
};

export default function TrialPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <a
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-4 inline-block"
          >
            &larr; Voltar ao início
          </a>
          <h1 className="text-3xl font-bold mb-2">Teste grátis por 7 dias</h1>
          <p className="text-zinc-400">
            Preencha seus dados para receber sua chave de licença.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <TrialForm />
        </div>
      </div>
    </main>
  );
}
