"use client";

import { motion } from "framer-motion";

const plans = [
  {
    id: "mensal",
    name: "Mensal",
    price: "R$ 70",
    period: "/mês",
    description: "Flexibilidade total",
    features: [
      "Transcrições ilimitadas",
      "Suporte a GPU NVIDIA",
      "Exportação DOCX, SRT, TXT",
      "Atualizações incluídas",
    ],
    highlighted: false,
  },
  {
    id: "anual",
    name: "Anual",
    price: "R$ 229",
    period: "/ano",
    description: "Mais popular — economize 73%",
    badge: "Mais popular",
    features: [
      "Tudo do plano Mensal",
      "Equivale a R$ 19,08/mês",
      "Prioridade no suporte",
      "Atualizações incluídas",
    ],
    highlighted: true,
  },
  {
    id: "vitalicio",
    name: "Vitalício",
    price: "R$ 399",
    period: "pagamento único",
    description: "Pague uma vez, use para sempre",
    features: [
      "Tudo do plano Anual",
      "Sem renovação",
      "1 ano de atualizações incluídas",
      "Suporte prioritário",
    ],
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="precos" className="relative py-24 md:py-32 px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Escolha seu <span className="text-gradient">plano</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Comece com um teste grátis de 7 dias. Depois, escolha o plano ideal.
            Cancele a qualquer momento.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-[1px] ${
                plan.highlighted
                  ? "bg-gradient-to-br from-brand-green via-brand-teal to-brand-blue"
                  : ""
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-brand-gradient px-4 py-1 rounded-full text-xs font-bold text-black tracking-wide">
                  {plan.badge}
                </span>
              )}

              <div
                className={`relative rounded-2xl p-8 h-full flex flex-col ${
                  plan.highlighted
                    ? "bg-surface-1"
                    : "glass"
                }`}
              >
                <h3 className="text-xl font-semibold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-zinc-500 mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1.5">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-zinc-300"
                    >
                      <svg
                        className="w-4 h-4 text-brand-cyan mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="/trial"
                  className={`block text-center py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    plan.highlighted
                      ? "btn-gradient"
                      : "btn-ghost"
                  }`}
                >
                  Começar teste grátis
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
