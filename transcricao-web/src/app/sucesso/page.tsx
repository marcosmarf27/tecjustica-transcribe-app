import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const metadata = {
  title: "Pagamento Confirmado - TecJustiça Transcribe",
};

export default function SucessoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="text-zinc-400 text-center">Carregando...</div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
