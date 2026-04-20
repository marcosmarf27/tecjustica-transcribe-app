import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Termos de Serviço — TecJustiça Transcribe",
  description:
    "Termos de Serviço e Política de Privacidade do TecJustiça Transcribe. Em conformidade com a Resolução CNJ nº 615/2025 e a LGPD.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-12">
          <a
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors mb-4 inline-block"
          >
            &larr; Voltar ao início
          </a>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
            Termos de Serviço
          </h1>
          <p className="text-zinc-500 text-sm">
            Última atualização: 21 de março de 2026
          </p>
        </div>

        <div className="prose-custom space-y-10">
          {/* 1 */}
          <Section title="1. Definições">
            <p>
              <strong>&quot;TecJustiça Transcribe&quot;</strong> ou <strong>&quot;Aplicativo&quot;</strong>: software desktop para transcrição automática de audiências judiciais, desenvolvido pela parceria TecJustiça × Projurista.
            </p>
            <p>
              <strong>&quot;Usuário&quot;</strong>: pessoa física ou jurídica que adquire licença e utiliza o Aplicativo.
            </p>
            <p>
              <strong>&quot;Licença&quot;</strong>: direito de uso concedido mediante aquisição de plano (mensal, anual ou vitalício) ou teste gratuito.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Aceitação dos Termos">
            <p>
              Ao instalar, ativar ou utilizar o TecJustiça Transcribe, o Usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Serviço e com a Política de Privacidade abaixo descrita.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Licenciamento e Uso">
            <ul>
              <li>Cada licença permite a ativação em <strong>1 (um) computador</strong> por vez.</li>
              <li>Para utilizar em outro dispositivo, o Usuário deverá desativar o dispositivo anterior ou adquirir uma licença adicional.</li>
              <li>O teste gratuito tem duração de <strong>7 dias corridos</strong> com acesso completo a todas as funcionalidades.</li>
              <li>Licenças mensais e anuais são renovadas automaticamente até o cancelamento pelo Usuário.</li>
              <li>A licença vitalícia garante uso perpétuo da versão adquirida, com 1 ano de atualizações incluídas.</li>
              <li>É vedada a redistribuição, sublicenciamento, engenharia reversa ou descompilação do Aplicativo.</li>
            </ul>
          </Section>

          {/* 4 */}
          <Section title="4. Conformidade com a Resolução CNJ nº 615/2025">
            <p>
              O TecJustiça Transcribe foi projetado em conformidade com as diretrizes da <strong>Resolução CNJ nº 615/2025</strong>, que regulamenta o uso de inteligência artificial no Poder Judiciário brasileiro. Em particular:
            </p>
            <ul>
              <li>
                <strong>IA como apoio, nunca como decisora:</strong> O Aplicativo é ferramenta auxiliar e complementar. Todas as transcrições, análises e sugestões geradas pela IA devem ser verificadas e validadas pelo operador humano (art. 3º, §1º).
              </li>
              <li>
                <strong>Transcrição 100% local:</strong> A transcrição de áudio, diarização (identificação de falantes) e exportação são processadas integralmente no computador do Usuário. Nenhum dado de áudio ou vídeo é transmitido para servidores externos, em conformidade com a vedação de compartilhamento de dados custodiados pelo Judiciário sem anonimização prévia (art. 8º).
              </li>
              <li>
                <strong>Ressalva — Análise com IA (Google Gemini):</strong> Os recursos opcionais de Análise Inteligente e Chat com IA utilizam a API do Google Gemini, o que envolve o envio do texto transcrito para os servidores do Google. Esses recursos requerem configuração de chave de API pelo Usuário e são de uso voluntário. O Google processa os dados conforme seus termos de serviço, com criptografia em trânsito e compromisso de não utilizar dados de APIs pagas para treinamento de modelos. <strong>Para processos sigilosos, recomenda-se utilizar apenas a transcrição local, sem ativar a análise por IA.</strong>
              </li>
              <li>
                <strong>Transparência e rastreabilidade:</strong> Os modelos de IA utilizados (WhisperX, pyannote) são de código aberto, em conformidade com a preferência por modelos open source e interoperáveis (art. 12, V).
              </li>
              <li>
                <strong>Sem treinamento com dados judiciais:</strong> Os dados processados pelo Aplicativo não são utilizados para treinamento, aperfeiçoamento ou qualquer outro fim além da transcrição solicitada pelo Usuário (art. 7º, §2º).
              </li>
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Política de Privacidade e LGPD">
            <p>
              Em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong>:
            </p>

            <h4>5.1 Dados processados localmente (nunca saem do computador)</h4>
            <ul>
              <li>Arquivos de áudio e vídeo das audiências</li>
              <li>Transcrições geradas (texto, segmentos, timestamps)</li>
              <li>Identificação de falantes (diarização)</li>
            </ul>
            <p>
              <strong>Estes dados permanecem exclusivamente no computador do Usuário</strong> e não são transmitidos, coletados ou armazenados por servidores da TecJustiça, Projurista ou terceiros. O princípio de <em>privacy by design</em> é aplicado desde a concepção do sistema (art. 46, LGPD).
            </p>

            <h4>5.2 Dados enviados à API do Google Gemini (recurso opcional)</h4>
            <p>
              Os recursos de <strong>Análise Inteligente</strong> e <strong>Chat com IA</strong> são opcionais e utilizam a API do Google Gemini. Quando ativados, o <strong>texto transcrito</strong> (não o áudio/vídeo original) é enviado aos servidores do Google para processamento. O uso desses recursos requer que o Usuário configure sua própria chave de API Gemini.
            </p>
            <ul>
              <li>O Google processa os dados conforme seus <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">termos de serviço da API Gemini</a></li>
              <li>APIs pagas do Google incluem compromisso de não utilizar dados do usuário para treinamento de modelos</li>
              <li>A comunicação é protegida por criptografia em trânsito (TLS)</li>
              <li><strong>Para processos sigilosos, recomenda-se não ativar a análise por IA</strong>, utilizando apenas a transcrição local</li>
            </ul>

            <h4>5.3 Outros dados transmitidos pela internet</h4>
            <p>Além do item 5.2, os únicos dados transmitidos são:</p>
            <ul>
              <li><strong>Chave de licença:</strong> enviada ao serviço Keygen.sh para validação e ativação. Nenhum dado de audiência é incluído nesta comunicação.</li>
              <li><strong>Token HuggingFace:</strong> utilizado exclusivamente para download de modelos de IA. Nenhum dado de audiência é transmitido.</li>
              <li><strong>Dados de pagamento:</strong> processados diretamente pelo Stripe. A TecJustiça não armazena dados de cartão de crédito.</li>
              <li><strong>E-mail e nome:</strong> coletados no cadastro para envio da chave de licença e comunicações essenciais do serviço.</li>
            </ul>

            <h4>5.4 Direitos do Titular (art. 18, LGPD)</h4>
            <p>O Usuário pode, a qualquer momento:</p>
            <ul>
              <li>Solicitar confirmação da existência de tratamento de seus dados pessoais</li>
              <li>Solicitar acesso, correção ou exclusão dos dados cadastrais</li>
              <li>Revogar consentimento para comunicações por e-mail</li>
              <li>Solicitar portabilidade dos dados cadastrais</li>
            </ul>
            <p>
              Solicitações devem ser encaminhadas para{" "}
              <strong>contato@tecjustica.com.br</strong>.
            </p>

            <h4>5.5 Segurança da Informação (art. 46, LGPD)</h4>
            <ul>
              <li>Comunicação com APIs externas via HTTPS (TLS 1.2+)</li>
              <li>Chave de licença armazenada localmente com validação de fingerprint por máquina</li>
              <li>Sem coleta de telemetria, analytics ou rastreadores no Aplicativo desktop</li>
              <li>Código do motor de transcrição (WhisperX) é open source e auditável</li>
            </ul>
          </Section>

          {/* 6 */}
          <Section title="6. Limitações de Responsabilidade">
            <ul>
              <li>A transcrição automática é gerada por inteligência artificial e pode conter imprecisões. <strong>O Usuário é responsável por revisar e validar todo o conteúdo gerado</strong> antes de utilizá-lo em documentos oficiais.</li>
              <li>O Aplicativo não substitui o trabalho do profissional qualificado (magistrado, servidor, advogado).</li>
              <li>A TecJustiça não se responsabiliza por decisões tomadas exclusivamente com base em transcrições ou análises geradas pela IA.</li>
              <li>A disponibilidade do serviço de validação de licença depende de conectividade com a internet. Licenças ativadas funcionam offline por período limitado (72h para assinaturas, ilimitado para vitalícia).</li>
            </ul>
          </Section>

          {/* 7 */}
          <Section title="7. Propriedade Intelectual">
            <p>
              O TecJustiça Transcribe, incluindo interface, código proprietário, marca e assets visuais, é de propriedade exclusiva da parceria TecJustiça × Projurista. Os motores de IA utilizados (WhisperX, pyannote) são projetos open source licenciados por seus respectivos mantenedores.
            </p>
            <p>
              As transcrições e análises geradas a partir dos arquivos do Usuário são de propriedade exclusiva do Usuário.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Cancelamento e Reembolso">
            <ul>
              <li>Assinaturas (mensal e anual) podem ser canceladas a qualquer momento. O acesso permanece ativo até o fim do período pago.</li>
              <li>Solicitações de reembolso serão avaliadas caso a caso, dentro de 7 dias da compra.</li>
              <li>O teste gratuito não requer dados de pagamento e é cancelado automaticamente ao fim dos 7 dias.</li>
            </ul>
          </Section>

          {/* 9 */}
          <Section title="9. Modificações nos Termos">
            <p>
              A TecJustiça reserva-se o direito de atualizar estes Termos. Alterações significativas serão comunicadas por e-mail ou no Aplicativo. O uso continuado após a notificação constitui aceitação dos novos termos.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Foro e Legislação Aplicável">
            <p>
              Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de domicílio do Usuário para dirimir eventuais controvérsias, conforme o Código de Defesa do Consumidor (Lei nº 8.078/1990).
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Contato">
            <p>
              Para dúvidas, suporte ou exercício dos direitos previstos na LGPD:
            </p>
            <ul>
              <li><strong>E-mail:</strong> contato@tecjustica.com.br</li>
              <li><strong>Site:</strong> transcricao-web.vercel.app</li>
            </ul>
          </Section>
        </div>
      </article>

      <Footer />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Section helper                                                     */
/* ------------------------------------------------------------------ */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4 tracking-tight">
        {title}
      </h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_h4]:text-white [&_h4]:font-medium [&_h4]:mt-5 [&_h4]:mb-2 [&_strong]:text-zinc-200 [&_a]:text-brand-cyan [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
