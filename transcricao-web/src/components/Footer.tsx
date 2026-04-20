import Image from "next/image";

const links = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Requisitos", href: "#requisitos" },
  { label: "Precos", href: "#precos" },
  { label: "FAQ", href: "#faq" },
  { label: "Teste gratis", href: "/trial" },
  { label: "Download", href: "/download" },
  { label: "Guia de Instalação", href: "/guia" },
  { label: "Termos de Serviço", href: "/termos" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-surface-0">
      {/* Gradient top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/tecjustica-logo.jpeg"
                alt="TecJustica"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <span className="font-display text-lg text-white">TecJustica</span>
                <span className="text-brand-cyan text-sm ml-1.5 font-medium">Transcribe</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              Transcricao automatica de audiencias judiciais com inteligencia
              artificial. 100% offline, acelerado por GPU.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
              Navegacao
            </h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Partnership */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
              Parceria
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/projurista.jpeg"
                alt="Projurista"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <p className="text-sm text-white font-medium">Projurista</p>
                <p className="text-xs text-zinc-500">Tecnologia para o Judiciario</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Desenvolvido em parceria para modernizar o fluxo de trabalho do
              Poder Judiciario brasileiro.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} TecJustica. Todos os direitos reservados.
          </p>
          <p className="text-xs text-zinc-700">
            Parceria TecJustica &times; Projurista
          </p>
        </div>
      </div>
    </footer>
  );
}
