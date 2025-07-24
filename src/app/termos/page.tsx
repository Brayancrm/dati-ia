'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TermosPage() {
  const [activeSection, setActiveSection] = useState('aceitacao');

  const sections = [
    { id: 'aceitacao', title: 'Aceitação', icon: '✅' },
    { id: 'servico', title: 'Serviço', icon: '🔍' },
    { id: 'uso', title: 'Uso Aceitável', icon: '📋' },
    { id: 'pagamento', title: 'Pagamento', icon: '💳' },
    { id: 'privacidade', title: 'Privacidade', icon: '🔒' },
    { id: 'responsabilidades', title: 'Responsabilidades', icon: '⚖️' },
    { id: 'limites', title: 'Limitações', icon: '🚫' },
    { id: 'encerramento', title: 'Encerramento', icon: '🔚' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Termos de Uso
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Estes termos estabelecem as condições para uso dos serviços da DatiIA. 
            Ao usar nossos serviços, você concorda com estes termos.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Navegação</h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2">{section.icon}</span>
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {activeSection === 'aceitacao' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ✅ Aceitação dos Termos
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        1.1 Aceitação
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Ao acessar e usar os serviços da DatiIA ("Serviço"), você concorda em cumprir 
                        e estar vinculado a estes Termos de Uso ("Termos"). Se você não concordar com 
                        qualquer parte destes termos, não deve usar nossos serviços.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        1.2 Modificações
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                        As modificações entrarão em vigor imediatamente após sua publicação. 
                        Seu uso continuado do serviço após as modificações constitui aceitação 
                        dos novos termos.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        1.3 Elegibilidade
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Para usar nossos serviços, você deve:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Ter pelo menos 18 anos de idade</li>
                        <li>Ter capacidade legal para celebrar contratos</li>
                        <li>Fornecer informações verdadeiras e precisas</li>
                        <li>Usar o serviço apenas para fins legais</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'servico' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔍 Descrição do Serviço
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        2.1 Serviço de Busca
                      </h3>
                      <p className="text-gray-700 mb-4">
                        A DatiIA fornece um serviço de busca e consulta de dados pessoais 
                        através de nossa plataforma online. O serviço permite que você 
                        realize buscas por informações de pessoas com base em critérios específicos.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        2.2 Sistema de Créditos
                      </h3>
                      <p className="text-gray-700 mb-4">
                        O serviço opera através de um sistema de créditos:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Cada busca consome um crédito</li>
                        <li>Créditos são adquiridos através de pagamento</li>
                        <li>Créditos não utilizados não expiram</li>
                        <li>Créditos não são reembolsáveis após uso</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        2.3 Disponibilidade
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Nos esforçamos para manter o serviço disponível 24/7, mas não 
                        garantimos disponibilidade ininterrupta. Podemos realizar 
                        manutenções programadas com aviso prévio.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'uso' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📋 Uso Aceitável
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        3.1 Uso Permitido
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Você pode usar nossos serviços para:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Buscar informações para fins legítimos de negócio</li>
                        <li>Verificar dados para compliance e due diligence</li>
                        <li>Localizar pessoas para fins comerciais legais</li>
                        <li>Pesquisas de mercado e prospecção</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        3.2 Uso Proibido
                      </h3>
                      <p className="text-gray-700 mb-4">
                        É estritamente proibido usar nossos serviços para:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Atividades ilegais ou fraudulentas</li>
                        <li>Assédio, perseguição ou intimidação</li>
                        <li>Violar direitos de privacidade de terceiros</li>
                        <li>Discriminação ou práticas discriminatórias</li>
                        <li>Spam ou marketing não autorizado</li>
                        <li>Violar leis de proteção de dados</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        ⚠️ Violação dos Termos
                      </h4>
                      <p className="text-red-700">
                        A violação destes termos pode resultar em suspensão ou encerramento 
                        imediato da conta, sem reembolso de créditos não utilizados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'pagamento' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    💳 Pagamento e Créditos
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        4.1 Preços e Pagamento
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Os preços dos créditos são exibidos em nossa plataforma e podem 
                        ser alterados a qualquer momento. O pagamento deve ser realizado 
                        através dos métodos aceitos antes da disponibilização dos créditos.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        4.2 Política de Reembolso
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Créditos não utilizados podem ser reembolsados em até 30 dias 
                        após a compra, desde que não tenham sido utilizados. Créditos 
                        já utilizados não são reembolsáveis.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        4.3 Impostos
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Todos os preços são expressos em Reais (R$) e incluem impostos 
                        aplicáveis. Você é responsável por qualquer imposto adicional 
                        que possa ser devido em sua jurisdição.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacidade' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔒 Privacidade e Dados
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        5.1 Política de Privacidade
                      </h3>
                      <p className="text-gray-700 mb-4">
                        O uso de seus dados pessoais é regido por nossa Política de 
                        Privacidade, que faz parte integrante destes termos. 
                        <Link href="/privacidade" className="text-blue-600 hover:underline ml-1">
                          Clique aqui para ler nossa Política de Privacidade.
                        </Link>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        5.2 Dados das Buscas
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Mantemos registros de todas as buscas realizadas para fins de:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Auditoria e compliance</li>
                        <li>Prevenção de fraudes</li>
                        <li>Melhoria do serviço</li>
                        <li>Cumprimento de obrigações legais</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        5.3 LGPD Compliance
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Nossos serviços são totalmente compatíveis com a Lei Geral de 
                        Proteção de Dados (LGPD). Você tem direitos específicos sobre 
                        seus dados pessoais, conforme detalhado em nossa Política de Privacidade.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'responsabilidades' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ⚖️ Responsabilidades
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        6.1 Suas Responsabilidades
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Você é responsável por:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Manter a confidencialidade de sua conta</li>
                        <li>Usar o serviço apenas para fins legais</li>
                        <li>Não compartilhar dados obtidos de forma inadequada</li>
                        <li>Respeitar os direitos de privacidade de terceiros</li>
                        <li>Pagar pelos serviços utilizados</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        6.2 Nossas Responsabilidades
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Nos comprometemos a:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Fornecer o serviço conforme descrito</li>
                        <li>Proteger seus dados pessoais</li>
                        <li>Manter a segurança da plataforma</li>
                        <li>Fornecer suporte técnico adequado</li>
                        <li>Cumprir com as leis aplicáveis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'limites' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🚫 Limitações de Responsabilidade
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        7.1 Limitações Gerais
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Em nenhuma circunstância a DatiIA será responsável por:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Danos indiretos, incidentais ou consequenciais</li>
                        <li>Perda de lucros ou dados</li>
                        <li>Interrupções temporárias do serviço</li>
                        <li>Uso inadequado dos dados obtidos</li>
                        <li>Violações de privacidade por parte do usuário</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        7.2 Limite de Indenização
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Nossa responsabilidade total será limitada ao valor pago por você 
                        pelos serviços nos últimos 12 meses, ou R$ 1.000,00, o que for menor.
                      </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Exclusões
                      </h4>
                      <p className="text-yellow-700">
                        Estas limitações não se aplicam a danos causados por nossa 
                        negligência grave ou violação intencional de direitos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'encerramento' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔚 Encerramento da Conta
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        8.1 Encerramento pelo Usuário
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Você pode encerrar sua conta a qualquer momento através de nossa 
                        plataforma. Créditos não utilizados podem ser reembolsados conforme 
                        nossa política de reembolso.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        8.2 Encerramento pela DatiIA
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Podemos encerrar sua conta imediatamente se você:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Violar estes termos</li>
                        <li>Usar o serviço para fins ilegais</li>
                        <li>Não pagar pelos serviços</li>
                        <li>Assediar outros usuários</li>
                        <li>Comprometer a segurança da plataforma</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        8.3 Efeitos do Encerramento
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Após o encerramento:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Seu acesso será imediatamente revogado</li>
                        <li>Seus dados serão excluídos conforme nossa política</li>
                        <li>Créditos não utilizados podem ser reembolsados</li>
                        <li>Obrigações pendentes devem ser cumpridas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
} 