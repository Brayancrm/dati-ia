"use client";
import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

interface ImportacaoProgress {
  id: string;
  fileName: string;
  status: 'pendente' | 'processando' | 'pausado' | 'cancelado' | 'concluida' | 'erro';
  progresso?: number;
  total?: number;
  sucessos?: number;
  duplicados?: number;
  erro?: string;
  createdAt: any;
}

interface ImportProgressBarProps {
  userEmail: string;
}

export default function ImportProgressBar({ userEmail }: ImportProgressBarProps) {
  const [importacoes, setImportacoes] = useState<ImportacaoProgress[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    // Listener para importações do usuário atual
    const q = query(
      collection(db, "importacoes"),
      where("user", "==", userEmail),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const importacoesData: ImportacaoProgress[] = [];
      const importacoesAnteriores = new Map(importacoes.map(imp => [imp.id, imp]));
      
      snapshot.forEach((doc) => {
        const dados = { id: doc.id, ...doc.data() } as ImportacaoProgress;
        importacoesData.push(dados);
        
        // Verificar se status mudou para notificar
        const anterior = importacoesAnteriores.get(doc.id);
        if (anterior && anterior.status !== dados.status) {
          if (dados.status === 'concluida') {
            setShowNotification(`✅ ${dados.fileName} importado com sucesso!`);
            setTimeout(() => setShowNotification(null), 5000);
          } else if (dados.status === 'erro') {
            setShowNotification(`❌ Erro na importação de ${dados.fileName}`);
            setTimeout(() => setShowNotification(null), 5000);
          }
        }
      });
      
      setImportacoes(importacoesData);
    });

    return () => unsubscribe();
  }, [userEmail]);

  // Filtrar apenas importações ativas (em andamento)
  const importacoesAtivas = importacoes.filter(imp => 
    ['pendente', 'processando', 'pausado'].includes(imp.status)
  );

  // Se não há importações ativas, não mostrar nada
  if (importacoesAtivas.length === 0) {
    return showNotification ? (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
        {showNotification}
      </div>
    ) : null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'processando': return '🔄';
      case 'pausado': return '⏸️';
      default: return '📁';
    }
  };

  const getProgressPercentage = (importacao: ImportacaoProgress) => {
    if (!importacao.total || !importacao.progresso) return 0;
    return Math.round((importacao.progresso / importacao.total) * 100);
  };

  if (isMinimized) {
    return (
      <>
        {/* Notificação flutuante */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {showNotification}
          </div>
        )}
        
        {/* Barra minimizada */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {importacoesAtivas.length} importação(ões) ativa(s)
                </span>
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Expandir"
              >
                Expandir
              </button>
            </div>
            
            {/* Preview da primeira importação */}
            {importacoesAtivas[0] && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span>{getStatusIcon(importacoesAtivas[0].status)}</span>
                  <span className="truncate" title={importacoesAtivas[0].fileName}>
                    {importacoesAtivas[0].fileName.length > 20 
                      ? importacoesAtivas[0].fileName.substring(0, 20) + '...' 
                      : importacoesAtivas[0].fileName}
                  </span>
                </div>
                
                {importacoesAtivas[0].status === 'processando' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(importacoesAtivas[0])}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getProgressPercentage(importacoesAtivas[0])}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Notificação flutuante */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {showNotification}
        </div>
      )}
      
      {/* Painel expandido */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Importações Ativas</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-600 hover:text-gray-800 text-sm"
                title="Minimizar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => window.location.href = '/importacoes'}
                className="text-blue-600 hover:text-blue-800 text-sm"
                title="Ver todas"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {importacoesAtivas.map((importacao) => (
              <div key={importacao.id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getStatusIcon(importacao.status)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate" title={importacao.fileName}>
                      {importacao.fileName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {importacao.status.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {importacao.status === 'processando' && importacao.progresso && importacao.total && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{importacao.progresso.toLocaleString()} / {importacao.total.toLocaleString()}</span>
                      <span>{getProgressPercentage(importacao)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(importacao)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {importacao.status === 'pausado' && (
                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    ⏸️ Pausado - Clique em "Ver todas" para retomar
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-center">
            <button
              onClick={() => window.location.href = '/bases'}
              className="text-sm text-green-700 hover:text-green-900 font-medium"
            >
              + Nova Importação
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 