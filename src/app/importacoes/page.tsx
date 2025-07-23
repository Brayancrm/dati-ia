"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

interface Importacao {
  id: string;
  fileName: string;
  status: 'pendente' | 'processando' | 'pausado' | 'cancelado' | 'concluida' | 'erro';
  createdAt: any;
  finishedAt?: any;
  user?: string;
  progresso?: number;
  total?: number;
  sucessos?: number;
  duplicados?: number;
  erro?: string;
  origem?: string;
}

export default function ImportacoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Listener em tempo real para importações
    const q = query(
      collection(db, "importacoes"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const importacoesData: Importacao[] = [];
      snapshot.forEach((doc) => {
        importacoesData.push({
          id: doc.id,
          ...doc.data()
        } as Importacao);
      });
      setImportacoes(importacoesData);
    });

    return () => unsubscribe();
  }, [user]);

  const pausarImportacao = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "importacoes", id), {
        status: 'pausado',
        pausedAt: new Date()
      });
      alert('Importação pausada com sucesso!');
    } catch (error) {
      console.error('Erro ao pausar:', error);
      alert('Erro ao pausar importação.');
    } finally {
      setActionLoading(null);
    }
  };

  const retomarImportacao = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "importacoes", id), {
        status: 'processando',
        resumedAt: new Date()
      });
      alert('Importação retomada com sucesso!');
    } catch (error) {
      console.error('Erro ao retomar:', error);
      alert('Erro ao retomar importação.');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelarImportacao = async (id: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja cancelar a importação de "${fileName}"?`)) return;
    
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "importacoes", id), {
        status: 'cancelado',
        canceledAt: new Date(),
        erro: 'Cancelado pelo usuário'
      });
      alert('Importação cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar importação.');
    } finally {
      setActionLoading(null);
    }
  };

  const excluirImportacao = async (id: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente a importação de "${fileName}"?`)) return;
    
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "importacoes", id));
      alert('Importação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir importação.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'processando': return 'bg-blue-100 text-blue-800';
      case 'pausado': return 'bg-orange-100 text-orange-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      case 'concluida': return 'bg-green-100 text-green-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'processando': return '🔄';
      case 'pausado': return '⏸️';
      case 'cancelado': return '⏹️';
      case 'concluida': return '✅';
      case 'erro': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const getLinhasRestantes = (importacao: Importacao) => {
    if (!importacao.total || !importacao.progresso) return null;
    return importacao.total - importacao.progresso;
  };

  const getTempoEstimado = (importacao: Importacao) => {
    if (!importacao.total || !importacao.progresso || importacao.progresso === 0) return null;
    
    const tempoDecorrido = new Date().getTime() - importacao.createdAt.toDate().getTime();
    const velocidade = importacao.progresso / (tempoDecorrido / 1000); // registros por segundo
    const linhasRestantes = importacao.total - importacao.progresso;
    const tempoRestante = linhasRestantes / velocidade;
    
    if (tempoRestante < 60) return `~${Math.round(tempoRestante)}s`;
    if (tempoRestante < 3600) return `~${Math.round(tempoRestante / 60)}min`;
    return `~${Math.round(tempoRestante / 3600)}h`;
  };

  if (!user || user.email.toLowerCase() !== "brayan@agilisvertex.com.br") {
    return <div className="mt-20 text-center text-red-600">Acesso restrito ao master.</div>;
  }

  if (loading) {
    return <div className="mt-20 text-center text-gray-900">Carregando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
            title="Voltar para Dashboard"
            onClick={() => router.push("/dashboard")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Status das Importações</h1>
        </div>
        <button
          onClick={() => router.push("/bases")}
          className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-green-900 transition font-semibold"
        >
          Nova Importação
        </button>
      </div>

      {importacoes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">📁 Nenhuma importação encontrada</div>
          <p className="text-gray-600">
            Suas importações em background aparecerão aqui com status em tempo real.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {importacoes.map((importacao) => (
            <div
              key={importacao.id}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(importacao.status)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {importacao.fileName}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Iniciado em {formatDate(importacao.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(importacao.status)}`}>
                    {importacao.status.toUpperCase()}
                  </span>
                  
                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    {importacao.status === 'processando' && (
                      <button
                        onClick={() => pausarImportacao(importacao.id)}
                        disabled={actionLoading === importacao.id}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Pausar importação"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      </button>
                    )}

                    {importacao.status === 'pausado' && (
                      <button
                        onClick={() => retomarImportacao(importacao.id)}
                        disabled={actionLoading === importacao.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Retomar importação"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    )}

                    {(importacao.status === 'processando' || importacao.status === 'pausado' || importacao.status === 'pendente') && (
                      <button
                        onClick={() => cancelarImportacao(importacao.id, importacao.fileName)}
                        disabled={actionLoading === importacao.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Cancelar importação"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </button>
                    )}

                    {(importacao.status === 'concluida' || importacao.status === 'erro' || importacao.status === 'cancelado') && (
                      <button
                        onClick={() => excluirImportacao(importacao.id, importacao.fileName)}
                        disabled={actionLoading === importacao.id}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                        title="Excluir importação"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progresso Detalhado */}
              {(importacao.status === 'processando' || importacao.status === 'pausado') && importacao.progresso && importacao.total && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Progresso da Importação</span>
                    <span>{getTempoEstimado(importacao)}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-blue-800 font-semibold">Processados</div>
                      <div className="text-lg font-bold text-blue-900">{importacao.progresso.toLocaleString()}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-orange-800 font-semibold">Restantes</div>
                      <div className="text-lg font-bold text-orange-900">{getLinhasRestantes(importacao)?.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-gray-800 font-semibold">Total</div>
                      <div className="text-lg font-bold text-gray-900">{importacao.total.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        importacao.status === 'processando' ? 'bg-blue-600' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.round((importacao.progresso / importacao.total) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {Math.round((importacao.progresso / importacao.total) * 100)}% concluído
                  </div>
                </div>
              )}

              {/* Status de Conclusão */}
              {importacao.status === 'concluida' && (
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Importação concluída com sucesso!</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Sucessos:</span>
                      <div className="text-lg font-bold text-green-900">{importacao.sucessos?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Duplicados:</span>
                      <div className="text-lg font-bold text-green-900">{importacao.duplicados?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Total:</span>
                      <div className="text-lg font-bold text-green-900">{importacao.total?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  
                  {importacao.finishedAt && (
                    <p className="text-green-700 text-sm mt-3">
                      Finalizado em {formatDate(importacao.finishedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Status de Erro */}
              {importacao.status === 'erro' && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Erro na importação</span>
                  </div>
                  {importacao.erro && (
                    <p className="text-red-700 text-sm">{importacao.erro}</p>
                  )}
                </div>
              )}

              {/* Status de Pausado */}
              {importacao.status === 'pausado' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
                  <div className="flex items-center gap-2 text-orange-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                    <span className="font-medium">Importação pausada</span>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">
                    Clique em "Retomar" para continuar o processamento.
                  </p>
                </div>
              )}

              {/* Status de Cancelado */}
              {importacao.status === 'cancelado' && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-medium">Importação cancelada</span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">
                    Esta importação foi cancelada pelo usuário.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex gap-4">
                  {importacao.origem && (
                    <span className="flex items-center gap-1">
                      📋 Origem: {importacao.origem.toUpperCase()}
                    </span>
                  )}
                  {importacao.user && (
                    <span className="flex items-center gap-1">
                      👤 Usuário: {importacao.user}
                    </span>
                  )}
                </div>
                <div className="text-xs">
                  ID: {importacao.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 