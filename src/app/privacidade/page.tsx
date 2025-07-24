'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PrivacidadePage() {
  const [activeSection, setActiveSection] = useState('coleta');

  const sections = [
    { id: 'coleta', title: 'Coleta de Dados', icon: '📊' },
    { id: 'uso', title: 'Uso dos Dados', icon: '🔍' },
    { id: 'compartilhamento', title: 'Compartilhamento', icon: '🤝' },
    { id: 'seguranca', title: 'Segurança', icon: '🔒' },
    { id: 'direitos', title: 'Seus Direitos', icon: '⚖️' },
    { id: 'contato', title: 'Contato', icon: '📞' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sua privacidade é fundamental para nós. Esta política descreve como coletamos, 
            usamos e protegemos suas informações pessoais em conformidade com a LGPD.
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
              {activeSection === 'coleta' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📊 Coleta de Dados
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Dados que Coletamos
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Dados de Cadastro:</strong> Nome, email, CPF/CNPJ, telefone</li>
                        <li><strong>Dados de Pagamento:</strong> Informações de cartão (processadas por gateway seguro)</li>
                        <li><strong>Dados de Uso:</strong> Histórico de buscas, logs de acesso</li>
                        <li><strong>Dados Técnicos:</strong> IP, navegador, dispositivo</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Base Legal para Coleta
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Execução de Contrato:</strong> Para prestação dos serviços</li>
                        <li><strong>Interesse Legítimo:</strong> Para melhorar nossos serviços</li>
                        <li><strong>Consentimento:</strong> Para marketing (quando aplicável)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'uso' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔍 Uso dos Dados
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Finalidades Principais
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Processar e gerenciar sua conta</li>
                        <li>Executar buscas e fornecer resultados</li>
                        <li>Processar pagamentos e emitir faturas</li>
                        <li>Fornecer suporte ao cliente</li>
                        <li>Enviar comunicações importantes sobre o serviço</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Finalidades Secundárias
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Melhorar nossos serviços e funcionalidades</li>
                        <li>Analisar padrões de uso para otimização</li>
                        <li>Prevenir fraudes e garantir segurança</li>
                        <li>Cumprir obrigações legais e regulatórias</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'compartilhamento' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🤝 Compartilhamento de Dados
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Quando Compartilhamos
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Processadores de Pagamento:</strong> Para processar transações</li>
                        <li><strong>Prestadores de Serviços:</strong> Hosting, analytics, suporte</li>
                        <li><strong>Autoridades:</strong> Quando exigido por lei</li>
                        <li><strong>Proteção:</strong> Para prevenir fraudes ou danos</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Importante
                      </h4>
                      <p className="text-yellow-700">
                        <strong>Nunca vendemos, alugamos ou comercializamos</strong> seus dados pessoais 
                        para terceiros. Qualquer compartilhamento é feito apenas para as finalidades 
                        descritas acima e com garantias adequadas de proteção.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'seguranca' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🔒 Segurança dos Dados
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Medidas de Segurança
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Criptografia:</strong> Dados transmitidos e armazenados com criptografia SSL/TLS</li>
                        <li><strong>Controle de Acesso:</strong> Acesso restrito apenas a pessoal autorizado</li>
                        <li><strong>Monitoramento:</strong> Sistemas de detecção de intrusão 24/7</li>
                        <li><strong>Backup Seguro:</strong> Cópias de segurança criptografadas</li>
                        <li><strong>Atualizações:</strong> Sistemas sempre atualizados com patches de segurança</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Retenção de Dados
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Dados de Conta:</strong> Mantidos enquanto a conta estiver ativa</li>
                        <li><strong>Dados de Pagamento:</strong> Retidos conforme exigido por lei fiscal</li>
                        <li><strong>Logs de Acesso:</strong> Mantidos por 12 meses para segurança</li>
                        <li><strong>Exclusão:</strong> Dados são excluídos após período de retenção</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'direitos' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ⚖️ Seus Direitos (LGPD)
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Direitos Garantidos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">👁️ Acesso</h4>
                          <p className="text-blue-700 text-sm">Solicitar cópia dos seus dados pessoais</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">✏️ Correção</h4>
                          <p className="text-green-700 text-sm">Corrigir dados incompletos ou incorretos</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2">🗑️ Exclusão</h4>
                          <p className="text-red-700 text-sm">Solicitar exclusão dos seus dados</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">⏸️ Portabilidade</h4>
                          <p className="text-purple-700 text-sm">Receber dados em formato estruturado</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Como Exercer Seus Direitos
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Entre em contato através do email: <strong>privacidade@datiia.pro</strong></li>
                        <li>Identifique-se adequadamente</li>
                        <li>Especifique qual direito deseja exercer</li>
                        <li>Responderemos em até 15 dias úteis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'contato' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📞 Contato e Dúvidas
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Encarregado de Proteção de Dados (DPO)
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 mb-2">
                          <strong>Email:</strong> dpo@datiia.pro
                        </p>
                        <p className="text-gray-700 mb-2">
                          <strong>Telefone:</strong> (11) 99999-9999
                        </p>
                        <p className="text-gray-700">
                          <strong>Horário:</strong> Segunda a Sexta, 9h às 18h
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Outros Canais
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>Suporte Geral:</strong> suporte@datiia.pro</li>
                        <li><strong>Dúvidas sobre Pagamento:</strong> financeiro@datiia.pro</li>
                        <li><strong>Denúncias de Segurança:</strong> security@datiia.pro</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        📝 Reclamações
                      </h4>
                      <p className="text-blue-700">
                        Se não ficar satisfeito com nossa resposta, você pode apresentar 
                        reclamação à Autoridade Nacional de Proteção de Dados (ANPD) 
                        através do site: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline">www.gov.br/anpd</a>
                      </p>
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