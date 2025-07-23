"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

interface Notificacao {
  tipo: string;
  plano: string;
  valor: number;
  consultas: number;
  data: string;
  usuario: string;
  status: string;
  id?: string;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [liberando, setLiberando] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        // Verificar se é master
        if (u.email?.toLowerCase() !== "brayan@agilisvertex.com.br") {
          router.push("/dashboard");
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (user) {
      carregarNotificacoes();
    }
  }, [user]);

  const carregarNotificacoes = () => {
    try {
      const notificacoesSalvas = localStorage.getItem('notificacoes_pagamentos');
      if (notificacoesSalvas) {
        const notificacoesArray = JSON.parse(notificacoesSalvas);
        setNotificacoes(notificacoesArray.reverse()); // Mais recentes primeiro
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  const liberarCreditos = async (notificacao: Notificacao, index: number) => {
    setLiberando(notificacao.id || index.toString());
    
    try {
      // Buscar usuário no Firestore
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", notificacao.usuario));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("❌ Usuário não encontrado no sistema!");
        setLiberando(null);
        return;
      }

      const usuarioDoc = querySnapshot.docs[0];
      const usuarioData = usuarioDoc.data();
      const creditosAnteriores = usuarioData.creditos || 0;
      const novosCreditos = creditosAnteriores + notificacao.consultas;

      // Atualizar créditos do usuário
      await updateDoc(doc(db, "usuarios", usuarioDoc.id), {
        creditos: novosCreditos
      });

      // Atualizar status da notificação
      const notificacoesAtualizadas = [...notificacoes];
      notificacoesAtualizadas[index] = {
        ...notificacao,
        status: "LIBERADO"
      };
      setNotificacoes(notificacoesAtualizadas);

      // Salvar no localStorage
      localStorage.setItem('notificacoes_pagamentos', JSON.stringify(notificacoesAtualizadas.reverse()));

      // Mostrar confirmação
      alert(`✅ Créditos liberados com sucesso!

Plano: ${notificacao.plano}
Consultas: ${notificacao.consultas.toLocaleString()}
Usuário: ${notificacao.usuario}

Créditos anteriores: ${creditosAnteriores.toLocaleString()}
Novos créditos: ${novosCreditos.toLocaleString()}`);

      console.log("🎉 Créditos liberados:", {
        usuario: notificacao.usuario,
        creditosAnteriores,
        novosCreditos,
        plano: notificacao.plano
      });

    } catch (error) {
      console.error("Erro ao liberar créditos:", error);
      alert("❌ Erro ao liberar créditos. Tente novamente.");
    } finally {
      setLiberando(null);
    }
  };

  const limparTodasNotificacoes = () => {
    if (confirm("Tem certeza que deseja limpar todas as notificações?")) {
      localStorage.removeItem('notificacoes_pagamentos');
      setNotificacoes([]);
      alert("🗑️ Todas as notificações foram removidas!");
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LIBERADO":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDENTE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELADO":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-gray-200 transition"
            title="Voltar para Dashboard"
            onClick={() => router.push("/dashboard")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações de Pagamento</h1>
            <p className="text-gray-600">Gerencie os pedidos de recarga dos usuários</p>
          </div>
        </div>
        
        {notificacoes.length > 0 && (
          <button
            onClick={limparTodasNotificacoes}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar Todas
          </button>
        )}
      </div>

      {notificacoes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma notificação</h3>
          <p className="text-gray-600">Não há pedidos de recarga pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificacoes.map((notificacao, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{notificacao.plano}</h3>
                      <p className="text-sm text-gray-600">Usuário: {notificacao.usuario}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Valor</div>
                      <div className="text-lg font-bold text-green-900">R$ {notificacao.valor.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Consultas</div>
                      <div className="text-lg font-bold text-blue-900">{notificacao.consultas.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Data</div>
                      <div className="text-sm font-medium text-gray-900">{formatarData(notificacao.data)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(notificacao.status)}`}>
                      {notificacao.status}
                    </span>
                    {notificacao.status === "CONFIRMADO" && (
                      <button
                        onClick={() => liberarCreditos(notificacao, index)}
                        disabled={liberando === (notificacao.id || index.toString())}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {liberando === (notificacao.id || index.toString()) ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Liberando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Liberar Créditos
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Total de notificações:</span>
            <span className="font-bold ml-2">{notificacoes.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Pendentes:</span>
            <span className="font-bold ml-2">{notificacoes.filter(n => n.status === "CONFIRMADO").length}</span>
          </div>
          <div>
            <span className="text-blue-700">Liberados:</span>
            <span className="font-bold ml-2">{notificacoes.filter(n => n.status === "LIBERADO").length}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 