'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

interface LogBusca {
  id: string;
  usuario: string;
  email: string;
  termo: string;
  resultado: number;
  timestamp: Timestamp;
  ip?: string;
  userAgent?: string;
  status: 'sucesso' | 'erro' | 'sem_resultado';
}

export default function AuditoriaPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<LogBusca[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    usuario: '',
    dataInicio: '',
    dataFim: '',
    status: 'todos'
  });
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    sucesso: 0,
    erro: 0,
    semResultado: 0,
    usuariosUnicos: 0
  });

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (user?.email === 'Brayan@agilivertex.com.br') {
      carregarLogs();
    }
  }, [user, filtros]);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'logs_busca'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // Aplicar filtros
      if (filtros.usuario) {
        q = query(q, where('email', '==', filtros.usuario));
      }

      if (filtros.status !== 'todos') {
        q = query(q, where('status', '==', filtros.status));
      }

      const querySnapshot = await getDocs(q);
      const logsData: LogBusca[] = [];
      
      querySnapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as LogBusca);
      });

      // Filtrar por data se especificado
      let logsFiltrados = logsData;
      if (filtros.dataInicio || filtros.dataFim) {
        logsFiltrados = logsData.filter(log => {
          const dataLog = log.timestamp.toDate();
          const inicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
          const fim = filtros.dataFim ? new Date(filtros.dataFim) : null;
          
          if (inicio && dataLog < inicio) return false;
          if (fim && dataLog > fim) return false;
          return true;
        });
      }

      setLogs(logsFiltrados);
      calcularEstatisticas(logsFiltrados);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (logsData: LogBusca[]) => {
    const usuariosUnicos = new Set(logsData.map(log => log.email)).size;
    const sucesso = logsData.filter(log => log.status === 'sucesso').length;
    const erro = logsData.filter(log => log.status === 'erro').length;
    const semResultado = logsData.filter(log => log.status === 'sem_resultado').length;

    setEstatisticas({
      total: logsData.length,
      sucesso,
      erro,
      semResultado,
      usuariosUnicos
    });
  };

  const formatarData = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sucesso': return 'text-green-600 bg-green-100';
      case 'erro': return 'text-red-600 bg-red-100';
      case 'sem_resultado': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sucesso': return 'Sucesso';
      case 'erro': return 'Erro';
      case 'sem_resultado': return 'Sem Resultado';
      default: return status;
    }
  };

  // Verificar se é master user
  if (user?.email !== 'Brayan@agilivertex.com.br') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Auditoria de Acesso
          </h1>
          <p className="text-gray-600">
            Monitoramento completo de todas as buscas realizadas na plataforma
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Buscas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sucessos</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.sucesso}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.erro}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sem Resultado</p>
                <p className="text-2xl font-bold text-yellow-600">{estatisticas.semResultado}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Únicos</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.usuariosUnicos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="email"
                value={filtros.usuario}
                onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
                placeholder="Email do usuário"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
                <option value="sem_resultado">Sem Resultado</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFiltros({
                usuario: '',
                dataInicio: '',
                dataFim: '',
                status: 'todos'
              })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Histórico de Buscas
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Nenhum log encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Termo Buscado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.usuario}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={log.termo}>
                          {log.termo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resultado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {getStatusText(log.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Informações de Segurança */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            🔒 Informações de Segurança
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><strong>Retenção:</strong> Logs mantidos por 12 meses para auditoria</p>
              <p><strong>Criptografia:</strong> Dados transmitidos via HTTPS</p>
            </div>
            <div>
              <p><strong>Acesso:</strong> Restrito apenas ao master user</p>
              <p><strong>Backup:</strong> Logs incluídos no backup automático</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 