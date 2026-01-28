import { Link } from "react-router-dom"
import { FileText } from "lucide-react"

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Termos de Uso
          </h1>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 text-sm sm:text-base text-zinc-700 leading-relaxed">
          <Section
            title="1. Aceitação dos Termos"
            body="Ao utilizar o aplicativo MyStoreDay, o usuário concorda integralmente com estes Termos de Uso. Caso não concorde, recomenda-se não utilizar o aplicativo."
          />

          <Section
            title="2. Finalidade do Aplicativo"
            body="O MyStoreDay tem como finalidade auxiliar no gerenciamento de estoque, permitindo o controle de produtos, quantidades e informações relacionadas."
          />

          <Section
            title="3. Cadastro e Responsabilidade"
            body="O usuário é responsável pelas informações fornecidas durante o cadastro e por manter a confidencialidade de seus dados de acesso."
          />

          <Section
            title="4. Uso Adequado"
            body="É proibido utilizar o aplicativo para fins ilícitos, fraudulentos ou que possam comprometer a segurança e o funcionamento do sistema."
          />

          <Section
            title="5. Limitação de Responsabilidade"
            body="O MyStoreDay não se responsabiliza por perdas, danos ou prejuízos decorrentes do uso inadequado do aplicativo ou de informações incorretas inseridas pelo usuário."
          />

          <Section
            title="6. Disponibilidade"
            body="O aplicativo pode sofrer interrupções temporárias para manutenção, atualizações ou por fatores externos fora do controle do desenvolvedor."
          />

          <Section
            title="7. Alterações nos Termos"
            body="Os Termos de Uso podem ser alterados a qualquer momento. Recomenda-se que o usuário revise este documento periodicamente."
          />

          <Section
            title="8. Contato"
            body="Em caso de dúvidas relacionadas a estes Termos de Uso, entre em contato pelo e-mail: contact@mystoreday.com."
          />

          <p className="text-xs text-zinc-500 pt-2">
            Última atualização: Janeiro de 2025
          </p>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-zinc-900 font-medium"
            >
              Voltar para Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-zinc-900 font-semibold text-lg">{title}</h2>
      <p>{body}</p>
    </div>
  )
}
