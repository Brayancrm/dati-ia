"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    
    try {
      // Validações básicas
      if (!formData.nome || !formData.documento || !formData.email || !formData.senha) {
        setError("Todos os campos são obrigatórios.");
        return;
      }
      
      if (formData.senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      
      // Validar formato de documento (CPF: 11 dígitos, CNPJ: 14 dígitos)
      const docNumeros = formData.documento.replace(/\D/g, '');
      if (docNumeros.length !== 11 && docNumeros.length !== 14) {
        setError("Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
        return;
      }
      
      // Salvar solicitação no Firestore
      await addDoc(collection(db, "solicitacoes_conta"), {
        nome: formData.nome,
        documento: docNumeros,
        tipoDocumento: docNumeros.length === 11 ? 'CPF' : 'CNPJ',
        email: formData.email,
        senha: formData.senha, // Em produção, hash a senha
        status: 'pendente',
        dataSolicitacao: new Date(),
        aprovadoPor: null,
        dataAprovacao: null
      });

      // Notificar o master sobre a nova solicitação de conta
      notificarMasterSobreNovaConta(formData);

      // Simular envio de emails (em produção, usar serviço real de email)
      console.log(`📧 Email enviado para ${formData.email}: Sua solicitação de conta foi recebida e está sendo analisada.`);
      console.log(`📧 Email enviado para admin: Nova solicitação de conta de ${formData.nome} (${formData.email})`);

      alert(`Solicitação enviada com sucesso!\n\n📧 Confirmação enviada para: ${formData.email}\n\nVocê receberá um email quando sua conta for aprovada pelo administrador (até 24 horas).`);
      setShowCreateAccount(false);
      setFormData({ nome: "", documento: "", email: "", senha: "" });
    } catch (err: any) {
      setError("Erro ao criar solicitação: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Função para notificar o master sobre nova solicitação de conta
  const notificarMasterSobreNovaConta = (dadosConta: any) => {
    // Criar dados da notificação
    const notificacao = {
      tipo: "NOVA_SOLICITACAO_CONTA",
      nome: dadosConta.nome,
      email: dadosConta.email,
      documento: dadosConta.documento,
      tipoDocumento: dadosConta.documento.length === 11 ? 'CPF' : 'CNPJ',
      data: new Date().toISOString(),
      status: "PENDENTE"
    };

    // Salvar no localStorage para histórico (mesmo sistema das notificações de pagamento)
    try {
      const notificacoesExistentes = localStorage.getItem('notificacoes_pagamentos') || '[]';
      const notificacoes = JSON.parse(notificacoesExistentes);
      
      // Adicionar nova notificação
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
          <p><strong>Status:</strong> PENDENTE</p>
          <hr>
          <p><em>Esta é uma notificação automática do sistema Dati IA.</em></p>
          <p><strong>Ação necessária:</strong> Aprovar ou rejeitar a solicitação na página de usuários.</p>
        `
      };
      
      console.log("📧 Email enviado para usuário master:", emailData);
      
    } catch (error) {
      console.error("Erro ao salvar notificação:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh] px-8 py-16 gap-12 w-full">
        {/* Lado esquerdo - Conteúdo */}
        <div className="flex-1 text-center lg:text-left">

          <h1 className="text-5xl lg:text-6xl font-extrabold text-green-900 mb-6 leading-tight">
            Mais autonomia e 
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"> facilidade</span> para o seu negócio
          </h1>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Reduza os custos da sua operadora de dados com a DATI.IA. 
            Aumente a satisfação do seu cliente utilizando as nossas soluções.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-green-900 to-yellow-400 text-white font-bold text-lg rounded-xl hover:from-green-800 hover:to-yellow-500 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              onClick={() => setShowLogin(true)}
            >
              Acessar Plataforma
            </button>
            <button 
              className="px-8 py-4 border-2 border-green-900 text-green-900 font-bold text-lg rounded-xl hover:bg-green-50 transition-all"
              onClick={() => setShowCreateAccount(true)}
            >
              Conhecer Soluções
            </button>
          </div>
        </div>

        {/* Lado direito - Robô de Call Center */}
        <div className="flex-1">
          <div className="relative">
            {/* Container do Robô */}
            <div className="w-full h-96 bg-gradient-to-br from-green-100 to-yellow-100 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden">
              <div className="relative">
                {/* Corpo do Robô */}
                <div className="relative z-10">
                  {/* Cabeça do Robô */}
                  <div className="w-32 h-40 bg-gradient-to-br from-green-600 to-green-700 rounded-t-3xl rounded-b-lg mx-auto relative shadow-lg">
                    {/* Antena */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full -mt-1 mx-auto"></div>
                    </div>
                    
                    {/* Olhos */}
                    <div className="flex justify-center gap-4 pt-8">
                      <div className="w-8 h-8 bg-yellow-400 rounded-full relative shadow-inner">
                        <div className="w-4 h-4 bg-green-900 rounded-full absolute top-1 left-1"></div>
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5"></div>
                      </div>
                      <div className="w-8 h-8 bg-yellow-400 rounded-full relative shadow-inner">
                        <div className="w-4 h-4 bg-green-900 rounded-full absolute top-1 left-1"></div>
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5"></div>
                      </div>
                    </div>
                    
                    {/* Nariz/Sensor */}
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mt-2"></div>
                    
                    {/* Boca/Display */}
                    <div className="w-16 h-4 bg-green-900 rounded-full mx-auto mt-3 flex items-center justify-center">
                      <div className="w-12 h-1 bg-yellow-400 rounded-full"></div>
                    </div>
                    
                    {/* Headset */}
                    <div className="absolute -left-2 top-6 w-4 h-16 bg-green-800 rounded-l-full"></div>
                    <div className="absolute -right-2 top-6 w-4 h-16 bg-green-800 rounded-r-full"></div>
                    <div className="absolute -left-4 top-10 w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="absolute -right-4 top-10 w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                  
                  {/* Pescoço */}
                  <div className="w-8 h-4 bg-green-700 mx-auto"></div>
                  
                  {/* Corpo */}
                  <div className="w-40 h-32 bg-gradient-to-br from-green-600 to-green-700 rounded-lg mx-auto relative shadow-lg">
                    {/* Painel de controle */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-16 bg-green-900 rounded-lg border-2 border-yellow-400">
                      {/* Tela */}
                      <div className="w-20 h-8 bg-yellow-400 rounded mt-1 mx-auto flex items-center justify-center">
                        <div className="text-green-900 text-xs font-bold">DATI.IA</div>
                      </div>
                      {/* Botões */}
                      <div className="flex justify-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Braços */}
                    <div className="absolute -left-6 top-4 w-12 h-6 bg-green-700 rounded-full transform -rotate-12"></div>
                    <div className="absolute -right-6 top-4 w-12 h-6 bg-green-700 rounded-full transform rotate-12"></div>
                    
                    {/* Mãos */}
                    <div className="absolute -left-8 top-8 w-6 h-6 bg-green-800 rounded-full border-2 border-yellow-400"></div>
                    <div className="absolute -right-8 top-8 w-6 h-6 bg-green-800 rounded-full border-2 border-yellow-400"></div>
                  </div>
                </div>
                
                {/* Elementos de comunicação flutuantes */}
                <div className="absolute -top-4 -right-8 animate-bounce">
                  <div className="bg-white rounded-lg p-2 shadow-lg border-2 border-yellow-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -left-8 animate-bounce delay-500">
                  <div className="bg-yellow-400 rounded-lg p-2 shadow-lg">
                    <svg className="w-4 h-4 text-green-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Elementos decorativos */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-900 rounded-full opacity-20"></div>
            <div className="absolute top-10 -right-6 w-6 h-6 bg-yellow-500 rounded-full opacity-50 animate-pulse delay-300"></div>
            
            {/* Ondas de sinal */}
            <div className="absolute top-20 left-4">
              <div className="w-4 h-4 border-2 border-green-400 rounded-full animate-ping"></div>
            </div>
            <div className="absolute bottom-20 right-4">
              <div className="w-6 h-6 border-2 border-yellow-400 rounded-full animate-ping delay-150"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de benefícios */}
      <section className="py-16 px-8 bg-white w-full">
        <div className="w-full">
          <h2 className="text-3xl font-bold text-center text-green-900 mb-12">
            Mais de <span className="text-yellow-600">100 operadoras de saúde</span> confiam em nossas soluções
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Relatórios Avançados</h3>
              <p className="text-gray-600">Análises detalhadas e insights para tomada de decisão</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-yellow-50 border border-yellow-200">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Sistema de Recarga</h3>
              <p className="text-gray-600">Pagamento via PIX integrado e automático</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-700 to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Gestão de Usuários</h3>
              <p className="text-gray-600">Controle completo de acesso e permissões</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => setShowLogin(false)}
            >
              &times;
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">Acesse sua conta</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-green-900 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none text-gray-900 bg-white shadow-sm transition-all" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-900 mb-1">Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none text-gray-900 bg-white shadow-sm transition-all" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-4 py-2 rounded text-sm font-semibold">{error}</div>}
                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-900 to-yellow-400 text-white font-bold text-lg shadow-lg hover:from-green-800 hover:to-yellow-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Entrar'}
                </button>
              </form>
              <div className="flex flex-col gap-2 mt-4 text-center">
                <button 
                  className="text-green-900 hover:underline font-semibold" 
                  type="button" 
                  onClick={() => {
                    setShowLogin(false);
                    setShowCreateAccount(true);
                  }}
                >
                  Criar nova conta
                </button>
                <button 
                  className="text-yellow-700 hover:underline font-semibold" 
                  type="button" 
                  onClick={() => alert('Solicite a redefinição de senha ao administrador.')}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Conta */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => setShowCreateAccount(false)}
            >
              &times;
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">Solicitar nova conta</h2>
              <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  className="px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 outline-none text-gray-900 bg-white shadow-sm" 
                  placeholder="Nome completo" 
                  value={formData.nome} 
                  onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                  required 
                />
                <input 
                  type="text" 
                  className="px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 outline-none text-gray-900 bg-white shadow-sm" 
                  placeholder="CPF ou CNPJ" 
                  value={formData.documento} 
                  onChange={e => setFormData({ ...formData, documento: e.target.value })} 
                  required 
                />
                <input 
                  type="email" 
                  className="px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 outline-none text-gray-900 bg-white shadow-sm" 
                  placeholder="E-mail" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  required 
                />
                <input 
                  type="password" 
                  className="px-4 py-3 rounded-xl border-2 border-green-200 focus:border-yellow-400 outline-none text-gray-900 bg-white shadow-sm" 
                  placeholder="Senha (mín. 6 caracteres)" 
                  value={formData.senha} 
                  onChange={e => setFormData({ ...formData, senha: e.target.value })} 
                  required 
                />
                {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-800 px-4 py-2 rounded text-sm font-semibold">{error}</div>}
                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-900 to-yellow-400 text-white font-bold text-lg shadow-lg hover:from-green-800 hover:to-yellow-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
                  disabled={creating}
                >
                  {creating ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Solicitar conta'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Após solicitar, aguarde aprovação do administrador. Você receberá um e-mail de confirmação.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
