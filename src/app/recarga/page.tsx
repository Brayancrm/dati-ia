"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";

const PLANOS = [
  {
    id: "unitario",
    nome: "Plano Unitário",
    consultas: 1,
    valor: 30,
    descricao: "1 crédito por R$ 30,00",
    popular: false,
    qrCode: "/plano-unitario-qr.png"
  },
  {
    id: "mil",
    nome: "Plano 1000",
    consultas: 1000,
    valor: 150,
    descricao: "1000 consultas por R$ 150,00",
    popular: false,
    qrCode: "/plano-1000-qr.png"
  },
  {
    id: "doismil",
    nome: "Plano 2000",
    consultas: 2000,
    valor: 300,
    descricao: "2000 consultas por R$ 300,00",
    popular: true,
    qrCode: "/plano-2000-qr.png"
  },
  {
    id: "cincmil",
    nome: "Plano 5000",
    consultas: 5000,
    valor: 750,
    descricao: "5000 consultas por R$ 750,00",
    popular: false,
    qrCode: "/plano-5000-qr.png"
  },
  {
    id: "dezmil",
    nome: "Plano 10000",
    consultas: 10000,
    valor: 1500,
    descricao: "10000 consultas por R$ 1500,00",
    popular: false,
    qrCode: "/plano-10000-qr.png"
  },
  {
    id: "vinteMil",
    nome: "Plano 20000",
    consultas: 20000,
    valor: 3000,
    descricao: "20000 consultas por R$ 3000,00",
    popular: false,
    qrCode: "/plano-20000-qr.png"
  },
  {
    id: "personalizado",
    nome: "Plano Personalizado",
    consultas: null,
    valor: null,
    descricao: "Quantidade personalizada",
    popular: false,
    custom: true
  }
];

export default function RecargaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [pagamentoProcessado, setPagamentoProcessado] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);


  const handleSelecionarPlano = (plano: any) => {
    if (!plano.custom) {
      setPlanoSelecionado(plano);
    }
  };

  const handleIniciarPagamento = () => {
    setMostrarQR(true);
  };

  const handleVoltar = () => {
    setMostrarQR(false);
    setPagamentoProcessado(false);
  };

  const handleConfirmarPagamento = () => {
    setPagamentoProcessado(true);
    
    // Simular processamento
    setTimeout(() => {
      // Notificar usuário master sobre o pagamento
      notificarUsuarioMaster(planoSelecionado);
      
      alert("Pagamento processado com sucesso!");
      router.push("/dashboard");
    }, 2000);
  };

  const notificarUsuarioMaster = (plano: any) => {
    // Criar dados da notificação
    const notificacao = {
      tipo: "PAGAMENTO_CONFIRMADO",
      plano: plano.nome,
      valor: plano.valor,
      consultas: plano.consultas,
      data: new Date().toISOString(),
      usuario: user?.email || "Cliente", // Email do usuário logado
      status: "CONFIRMADO"
    };

    // Enviar notificação via email (simulação)
    enviarEmailNotificacao(notificacao);
    
    // Salvar no localStorage para histórico (simulação de banco de dados)
    salvarNotificacao(notificacao);
    
    // Log para console (em produção seria enviado para um sistema de logs)
    console.log("🔔 NOTIFICAÇÃO PARA USUÁRIO MASTER:", notificacao);
  };

  const enviarEmailNotificacao = (notificacao: any) => {
    // Simulação de envio de email
    const emailData = {
      to: "Brayan@agilivertex.com.br",
      subject: "💰 Novo Pagamento Confirmado - Dati IA",
      body: `
        <h2>🎉 Novo Pagamento Confirmado!</h2>
        <p><strong>Plano:</strong> ${notificacao.plano}</p>
        <p><strong>Valor:</strong> R$ ${notificacao.valor.toFixed(2)}</p>
        <p><strong>Consultas:</strong> ${notificacao.consultas.toLocaleString()}</p>
        <p><strong>Data:</strong> ${new Date(notificacao.data).toLocaleString('pt-BR')}</p>
        <p><strong>Status:</strong> ${notificacao.status}</p>
        <hr>
        <p><em>Esta é uma notificação automática do sistema Dati IA.</em></p>
      `
    };
    
    console.log("📧 Email enviado para usuário master:", emailData);
    
    // Em produção, aqui você integraria com um serviço de email como SendGrid, AWS SES, etc.
    // fetch('/api/enviar-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(emailData)
    // });
  };

  const salvarNotificacao = (notificacao: any) => {
    try {
      // Recuperar notificações existentes
      const notificacoesExistentes = localStorage.getItem('notificacoes_pagamentos') || '[]';
      const notificacoes = JSON.parse(notificacoesExistentes);
      
      // Adicionar nova notificação
      notificacoes.push(notificacao);
      
      // Salvar de volta no localStorage
      localStorage.setItem('notificacoes_pagamentos', JSON.stringify(notificacoes));
      
      console.log("💾 Notificação salva no histórico");
    } catch (error) {
      console.error("Erro ao salvar notificação:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
      <div className="flex items-center mb-6">
        <button
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
          title="Voltar para Dashboard"
          onClick={() => router.push("/dashboard")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Escolha seu Plano</h1>
      </div>

      {!mostrarQR ? (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Planos Disponíveis</h2>
            <p className="text-gray-600">Escolha o plano que melhor atende suas necessidades</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {PLANOS.map((plano) => (
              <div
                key={plano.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
                  planoSelecionado?.id === plano.id
                    ? "border-green-900 bg-green-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-green-400 hover:shadow-md"
                }                  ${plano.popular ? "ring-2 ring-yellow-400" : ""}`}
                 onClick={() => !plano.custom && handleSelecionarPlano(plano)}
               >
                 {plano.popular && (
                   <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                     <span className="bg-yellow-400 text-green-900 px-3 py-1 rounded-full text-sm font-bold">
                       MAIS POPULAR
                     </span>
                   </div>
                 )}

                 <div className="text-center">
                   {plano.custom && (
                     <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                       <div className="text-center">
                         <h4 className="font-semibold text-blue-900 mb-3">Entre em Contato</h4>
                         <p className="text-sm text-blue-700 mb-4">
                           Para planos personalizados, entre em contato conosco:
                         </p>
                         
                         <div className="space-y-2 text-sm">
                           <div className="flex items-center justify-center">
                             <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                               <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                             </svg>
                             <span className="text-blue-900 font-medium">(61) 9 9144-2727</span>
                           </div>
                           
                           <div className="flex items-center justify-center">
                             <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                               <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                               <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                             </svg>
                             <span className="text-blue-900 font-medium">Brayan@agilivertex.com.br</span>
                           </div>
                         </div>
                         
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             // Simular envio de email ou chamada
                             alert("Informações de contato copiadas! Entre em contato para um plano personalizado.");
                           }}
                           className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
                         >
                           Entrar em Contato
                         </button>
                       </div>
                     </div>
                   )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plano.nome}</h3>
                                     <div className="text-3xl font-bold text-green-900 mb-2">
                     {plano.custom ? "Personalizado" : `R$ ${plano.valor?.toFixed(2)}`}
                   </div>
                   <div className="text-gray-600 mb-4">
                     {plano.custom ? "Quantidade personalizada" : `${plano.consultas?.toLocaleString()} consultas`}
                   </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Acesso por 30 dias
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Suporte prioritário
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Relatórios detalhados
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {planoSelecionado && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-900 to-green-700 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                  Plano Selecionado: {planoSelecionado.nome}
                </h3>
                <div className="text-white text-xl mb-2">
                  {planoSelecionado.consultas.toLocaleString()} Consultas
                </div>
                <div className="text-yellow-400 text-3xl font-bold mb-4">
                  R$ {planoSelecionado.valor.toFixed(2)}
                </div>
                <button
                  onClick={handleIniciarPagamento}
                  className="bg-yellow-400 text-green-900 px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-300 transition duration-300 transform hover:scale-105"
                >
                  Comprar Agora
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-white border-2 border-green-900 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pagamento via PIX</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                             <div className="text-center mb-4">
                 <Image
                   src={planoSelecionado?.qrCode || "/plano-1000-qr.png"}
                   alt="QR Code PIX"
                   width={200}
                   height={200}
                   className="mx-auto border-2 border-gray-300 rounded-lg"
                 />
               </div>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Plano:</span>
                  <span className="text-gray-900">{planoSelecionado?.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Consultas:</span>
                  <span className="text-gray-900">{planoSelecionado?.consultas.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Valor:</span>
                  <span className="text-green-900 font-bold">R$ {planoSelecionado?.valor.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Instruções:</h3>
              <ol className="text-yellow-700 text-sm space-y-1 text-left">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escaneie o QR Code acima</li>
                <li>3. Confirme o pagamento</li>
                <li>4. Aguarde a confirmação automática</li>
              </ol>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleVoltar}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarPagamento}
                disabled={pagamentoProcessado}
                className="bg-green-900 text-yellow-400 px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
              >
                {pagamentoProcessado ? "Processando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 