'use client';
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import Link from "next/link";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    email: "",
    senha: ""
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // Escutar eventos customizados do header
  useEffect(() => {
    const handleOpenLoginModal = () => setShowLogin(true);
    const handleOpenCreateAccountModal = () => setShowCreateAccount(true);
    
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    window.addEventListener('openCreateAccountModal', handleOpenCreateAccountModal);
    
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
      window.removeEventListener('openCreateAccountModal', handleOpenCreateAccountModal);
    };
  }, []);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: any) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    
    try {
      // Salvar solicitação de conta
      const dadosConta = {
        nome: formData.nome,
        email: formData.email,
        documento: formData.documento,
        senha: formData.senha
      };

      await addDoc(collection(db, "solicitacoes_conta"), {
        nome: dadosConta.nome,
        email: dadosConta.email,
        documento: dadosConta.documento,
        tipoDocumento: dadosConta.documento.length === 11 ? 'CPF' : 'CNPJ',
        data: new Date().toISOString(),
        status: "PENDENTE"
      });

      // Salvar no localStorage para histórico (mesmo sistema das notificações de pagamento)
      try {
        const notificacoesExistentes = localStorage.getItem('notificacoes_pagamentos') || '[]';
        const notificacoes = JSON.parse(notificacoesExistentes);
        
        // Adicionar nova notificação
        const notificacao = {
          tipo: "NOVA_SOLICITACAO_CONTA",
          nome: dadosConta.nome,
          email: dadosConta.email,
          documento: dadosConta.documento,
          tipoDocumento: dadosConta.documento.length === 11 ? 'CPF' : 'CNPJ',
          data: new Date().toISOString(),
          status: "PENDENTE"
        };
        notificacoes.push(notificacao);
        
        // Salvar de volta no localStorage
        localStorage.setItem('notificacoes_pagamentos', JSON.stringify(notificacoes));
        
        console.log("🔔 NOTIFICAÇÃO PARA MASTER - Nova solicitação de conta:", notificacao);
        
        // Simular envio de email para o master
        const emailData = {
          to: "Brayan@agilivertex.com.br",
          subject: "👤 Nova Solicitação de Conta - Dati IA",
          body: `
            <h2>👤 Nova Solicitação de Conta!</h2>
            <p><strong>Nome:</strong> ${dadosConta.nome}</p>
            <p><strong>Email:</strong> ${dadosConta.email}</p>
            <p><strong>Documento:</strong> ${dadosConta.documento} (${dadosConta.documento.length === 11 ? 'CPF' : 'CNPJ'})</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Status:</strong> Aguardando aprovação</p>
          `
        };
        
        console.log("📧 Email simulado enviado para:", emailData.to);
        console.log("📧 Assunto:", emailData.subject);
        console.log("📧 Conteúdo:", emailData.body);
        
      } catch (error) {
        console.error("Erro ao salvar notificação:", error);
      }

      alert("Solicitação enviada com sucesso! Você receberá um email quando sua conta for aprovada.");
      setShowCreateAccount(false);
      setFormData({ nome: "", documento: "", email: "", senha: "" });
    } catch (err: any) {
      setError("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const notificarMasterSobreNovaConta = (dadosConta: any) => {
    const notificacao = {
      tipo: "NOVA_SOLICITACAO_CONTA",
      nome: dadosConta.nome,
      email: dadosConta.email,
      documento: dadosConta.documento,
      tipoDocumento: dadosConta.documento.length === 11 ? 'CPF' : 'CNPJ',
      data: new Date().toISOString(),
      status: "PENDENTE"
    };

    // Salvar no localStorage (mesmo sistema das notificações de pagamento)
    try {
      const notificacoesExistentes = localStorage.getItem('notificacoes_pagamentos') || '[]';
      const notificacoes = JSON.parse(notificacoesExistentes);
      notificacoes.push(notificacao);
      localStorage.setItem('notificacoes_pagamentos', JSON.stringify(notificacoes));
      
      console.log("🔔 NOTIFICAÇÃO PARA MASTER - Nova solicitação de conta:", notificacao);
      
      // Simular envio de email para o master
      console.log("📧 Email simulado enviado para: Brayan@agilivertex.com.br");
      console.log("📧 Assunto: 👤 Nova Solicitação de Conta - Dati IA");
    } catch (error) {
      console.error("Erro ao salvar notificação:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">DatiIA</div>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <span>🔍 Busca Inteligente</span>
                <span>⚡ Resultados Instantâneos</span>
                <span>🔒 100% Seguro</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => setShowCreateAccount(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge de Destaque */}
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <span className="mr-2">🚀</span>
              Mais de 50.000 buscas realizadas com sucesso
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Encontre <span className="text-blue-600">qualquer pessoa</span><br />
              em <span className="text-blue-600">segundos</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              A plataforma mais completa para busca e consulta de dados pessoais. 
              Resultados precisos, seguros e em conformidade com a LGPD.
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setShowCreateAccount(true)}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
              >
                🚀 Começar Agora - R$ 30,00
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-semibold text-lg">
                📺 Ver Demonstração
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 mb-12">
              <div className="flex items-center">
                <span className="mr-2">⭐</span>
                <span>4.9/5 - 2.847 avaliações</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👥</span>
                <span>+15.000 usuários ativos</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔒</span>
                <span>100% LGPD Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher a DatiIA?
            </h2>
            <p className="text-lg text-gray-600">
              A plataforma mais confiável para suas buscas de dados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Resultados Instantâneos</h3>
              <p className="text-gray-600">
                Encontre informações em menos de 3 segundos. 
                Nossa tecnologia avançada garante velocidade e precisão.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Seguro</h3>
              <p className="text-gray-600">
                Dados criptografados e em total conformidade com a LGPD. 
                Sua privacidade é nossa prioridade.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dados Completos</h3>
              <p className="text-gray-600">
                Acesso a milhões de registros atualizados. 
                Informações pessoais, endereços, telefones e muito mais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Como funciona?
            </h2>
            <p className="text-lg text-gray-600">
              Simples, rápido e eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cadastre-se</h3>
              <p className="text-gray-600">
                Crie sua conta gratuitamente em menos de 2 minutos
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compre Créditos</h3>
              <p className="text-gray-600">
                Escolha o plano ideal para suas necessidades
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faça a Busca</h3>
              <p className="text-gray-600">
                Digite o nome ou documento e obtenha resultados instantâneos
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Use os Dados</h3>
              <p className="text-gray-600">
                Exporte, compartilhe ou use as informações conforme necessário
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-lg text-gray-600">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-blue-600 transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Básico</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">R$ 30</div>
              <p className="text-gray-600 mb-4">1 busca</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>✓ Dados pessoais</li>
                <li>✓ Endereços</li>
                <li>✓ Telefones</li>
                <li>✓ Resultado instantâneo</li>
              </ul>
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Começar
              </button>
            </div>

            <div className="bg-blue-600 text-white border-2 border-blue-600 rounded-lg p-6 text-center transform scale-105">
              <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                MAIS POPULAR
              </div>
              <h3 className="text-xl font-semibold mb-2">Profissional</h3>
              <div className="text-3xl font-bold mb-2">R$ 150</div>
              <p className="mb-4">1.000 buscas</p>
              <ul className="text-sm mb-6 space-y-2">
                <li>✓ Tudo do plano Básico</li>
                <li>✓ Dados bancários</li>
                <li>✓ Histórico de buscas</li>
                <li>✓ Exportação em PDF</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Escolher
              </button>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-blue-600 transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Empresarial</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">R$ 750</div>
              <p className="text-gray-600 mb-4">5.000 buscas</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>✓ Tudo do plano Profissional</li>
                <li>✓ API de integração</li>
                <li>✓ Relatórios avançados</li>
                <li>✓ Suporte 24/7</li>
                <li>✓ Treinamento da equipe</li>
              </ul>
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contatar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "A DatiIA revolucionou nossa prospecção. Encontramos clientes que nunca conseguiríamos de outra forma."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">MC</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Costa</div>
                  <div className="text-sm text-gray-500">Diretora Comercial</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Resultados precisos e interface intuitiva. A melhor ferramenta que já usei para busca de dados."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">JS</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">João Silva</div>
                  <div className="text-sm text-gray-500">Consultor de Negócios</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Suporte excepcional e dados sempre atualizados. Recomendo para qualquer empresa."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">AS</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Ana Santos</div>
                  <div className="text-sm text-gray-500">CEO - TechCorp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a mais de 15.000 usuários que já confiam na DatiIA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowCreateAccount(true)}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              🚀 Criar Conta Gratuita
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg">
              📞 Falar com Especialista
            </button>
          </div>
        </div>
      </section>

      {/* Modais */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Entrar</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
              <button
                onClick={() => setShowCreateAccount(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAccount}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? "Enviando..." : "Enviar Solicitação"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">DatiIA</h3>
              <p className="text-gray-400">
                Plataforma líder em busca e consulta de dados pessoais com segurança e compliance LGPD.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Busca de Pessoas</li>
                <li>Consulta de Dados</li>
                <li>Prospecção Comercial</li>
                <li>Relatórios Personalizados</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Contato Técnico</li>
                <li>FAQ</li>
                <li>Status do Sistema</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
                <li>LGPD Compliance</li>
                <li>Segurança de Dados</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DatiIA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
