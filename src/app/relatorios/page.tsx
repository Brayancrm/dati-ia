"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";



interface Usuario {
  id: string;
  nome?: string;
  email?: string;
}

interface DadoRelatorio {
  id: string;
  data: any;
  usuarioId?: string;
  email?: string;
  tipo?: string;
  cpf?: string;
  [key: string]: any; // Para campos dinâmicos
}

export default function RelatoriosPage() {
  const router = useRouter();

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dadosRelatorio, setDadosRelatorio] = useState<DadoRelatorio[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);

  // Verificar usuário atual
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuarioAtual(user);
        setIsMaster(user.email === "brayan@agilisvertex.com.br");
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Carregar usuários
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const snapshot = await getDocs(usuariosRef);
        const usuariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Usuario[];
        
        // Se não for master, filtrar apenas o próprio usuário
        if (!isMaster && usuarioAtual) {
          const usuarioFiltrado = usuariosData.find(u => u.email === usuarioAtual.email);
          setUsuarios(usuarioFiltrado ? [usuarioFiltrado] : []);
          setUsuarioSelecionado(usuarioFiltrado?.id || "");
        } else {
          setUsuarios(usuariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };
    
    if (usuarioAtual) {
      carregarUsuarios();
    }
  }, [usuarioAtual, isMaster]);

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      alert("Selecione as datas de início e fim");
      return;
    }

    setCarregando(true);
    try {
      // Ajustar para o fuso horário local (UTC-3)
      const inicioDate = new Date(dataInicio + "T00:00:00-03:00");
      const fimDate = new Date(dataFim + "T23:59:59-03:00");
      const inicio = Timestamp.fromDate(inicioDate);
      const fim = Timestamp.fromDate(fimDate);

      // Buscar apenas CPFs consultados
      const usuarioFiltro = isMaster ? usuarioSelecionado : usuarioAtual?.email;
      let q;

      if (usuarioFiltro) {
        // Se é master e selecionou um usuário específico, buscar pelo ID
        if (isMaster && usuarioSelecionado) {
          const usuarioSelecionadoObj = usuarios.find(u => u.id === usuarioSelecionado);
          const emailFiltro = usuarioSelecionadoObj?.email;
          
          if (emailFiltro) {
            q = query(
              collection(db, "consultas"),
              where("email", "==", emailFiltro),
              where("data", ">=", inicio),
              where("data", "<=", fim),
              orderBy("data", "desc")
            );
          } else {
            // Se não encontrou o email, buscar sem filtro de usuário
            q = query(
              collection(db, "consultas"),
              where("data", ">=", inicio),
              where("data", "<=", fim),
              orderBy("data", "desc")
            );
          }
        } else {
          // Não é master ou não selecionou usuário específico - filtrar pelo email atual
          q = query(
            collection(db, "consultas"),
            where("email", "==", usuarioAtual?.email),
            where("data", ">=", inicio),
            where("data", "<=", fim),
            orderBy("data", "desc")
          );
        }
      } else {
        // Sem filtro de usuário - buscar todos
        q = query(
          collection(db, "consultas"),
          where("data", ">=", inicio),
          where("data", "<=", fim),
          orderBy("data", "desc")
        );
      }

      const snapshot = await getDocs(q);
      const dados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DadoRelatorio[];

      setDadosRelatorio(dados);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCarregando(false);
    }
  };

  const calcularTotais = () => {
    return {
      totalConsultas: dadosRelatorio.length,
      consultasIndividuais: dadosRelatorio.filter(d => d.tipo === "individual").length,
      consultasLote: dadosRelatorio.filter(d => d.tipo === "lote").length
    };
  };

  const exportarCSV = () => {
    if (dadosRelatorio.length === 0) {
      alert("Não há dados para exportar");
      return;
    }

    let csvContent = "";
    const headers = ["Data", "Usuário", "Tipo", "CPF"];

    // Adicionar cabeçalhos
    csvContent += headers.join(",") + "\n";

    // Adicionar dados
    dadosRelatorio.forEach(item => {
      const data = item.data?.toDate ? item.data.toDate().toLocaleDateString() : item.data;
      const usuario = usuarios.find(u => u.email === item.email)?.nome || item.email || item.usuarioId;
      
      const linha = [
        `"${data}"`,
        `"${usuario}"`,
        `"${item.tipo || "Individual"}"`,
        `"${item.cpf || "N/A"}"`
      ];
      
      csvContent += linha.join(",") + "\n";
    });

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_cpfs_consultados_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportarExcel = () => {
    if (dadosRelatorio.length === 0) {
      alert("Não há dados para exportar");
      return;
    }

    // Preparar dados para Excel
    const dadosExcel = dadosRelatorio.map(item => {
      const data = item.data?.toDate ? item.data.toDate().toLocaleDateString() : item.data;
      const usuario = usuarios.find(u => u.email === item.email)?.nome || item.email || item.usuarioId;
      
      return {
        "Data": data,
        "Usuário": usuario,
        "Tipo": item.tipo || "Individual",
        "CPF": item.cpf || "N/A"
      };
    });

    // Criar arquivo Excel
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio_cpfs_consultados_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totais = calcularTotais();

  // Se não for master, mostrar aviso
  if (!isMaster && usuarioAtual) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded shadow p-8 mt-8">
        <div className="flex items-center mb-4">
          <button
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
            title="Voltar para Dashboard"
            onClick={() => router.push("/dashboard")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        </div>



        <div className="mb-6 flex flex-wrap gap-4 items-end">
          {/* Só mostra o select de usuário se for master */}
          {isMaster && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <select 
                className="border rounded px-3 py-2 text-gray-900 min-w-[200px]"
                value={usuarioSelecionado}
                onChange={e => setUsuarioSelecionado(e.target.value)}
              >
                <option value="">Todos</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome || u.email}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input 
              type="date" 
              className="border rounded px-3 py-2 text-gray-900"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input 
              type="date" 
              className="border rounded px-3 py-2 text-gray-900"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <button 
            className="bg-green-900 text-yellow-400 px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition disabled:opacity-50"
            onClick={gerarRelatorio}
            disabled={carregando || !dataInicio || !dataFim}
          >
            {carregando ? "Carregando..." : "Gerar Relatório"}
          </button>
        </div>

        {/* Resumo */}
        {dadosRelatorio.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-4 text-gray-900">Resumo do Período</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">{totais.totalConsultas}</div>
              <div className="text-sm text-blue-700">Total de Consultas</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-900">{totais.consultasIndividuais}</div>
              <div className="text-sm text-green-700">Consultas Individuais</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-purple-900">{totais.consultasLote}</div>
              <div className="text-sm text-purple-700">Consultas em Lote</div>
            </div>


            </div>
          </div>
        )}

        {/* Mensagem quando não há dados */}
        {dadosRelatorio.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {carregando ? "Carregando dados..." : "Nenhuma informação encontrada com o filtro selecionado"}
          </div>
        )}



        {dadosRelatorio.length > 0 && (
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400">
              <span role="img" aria-label="imprimir">🖨️</span> Imprimir
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400"
              onClick={exportarCSV}
            >
              <span role="img" aria-label="exportar">📊</span> Exportar CSV
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400"
              onClick={exportarExcel}
            >
              <span role="img" aria-label="exportar">📈</span> Exportar Excel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Interface para usuário master
  return (
    <div className="max-w-6xl mx-auto bg-white rounded shadow p-8 mt-8">
      <div className="flex items-center mb-4">
        <button
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
          title="Voltar para Dashboard"
          onClick={() => router.push("/dashboard")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <div className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Master
        </div>
      </div>



      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
          <select 
            className="border rounded px-3 py-2 text-gray-900 min-w-[200px]"
            value={usuarioSelecionado}
            onChange={(e) => setUsuarioSelecionado(e.target.value)}
          >
            <option value="">Todos os usuários</option>
            {usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome || usuario.email}
              </option>
            ))}
        </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
          <input 
            type="date" 
            className="border rounded px-3 py-2 text-gray-900"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
          <input 
            type="date" 
            className="border rounded px-3 py-2 text-gray-900"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button 
          className="bg-green-900 text-yellow-400 px-6 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition disabled:opacity-50"
          onClick={gerarRelatorio}
          disabled={carregando || !dataInicio || !dataFim}
        >
          {carregando ? "Carregando..." : "Gerar Relatório"}
        </button>
      </div>

      {/* Resumo */}
      {dadosRelatorio.length > 0 && (
      <div className="mb-6">
          <h2 className="font-semibold mb-4 text-gray-900">Resumo do Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">{totais.totalConsultas}</div>
              <div className="text-sm text-blue-700">Total de Consultas</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-900">{totais.consultasIndividuais}</div>
              <div className="text-sm text-green-700">Consultas Individuais</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-purple-900">{totais.consultasLote}</div>
              <div className="text-sm text-purple-700">Consultas em Lote</div>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {dadosRelatorio.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {carregando ? "Carregando dados..." : "Nenhuma informação encontrada com o filtro selecionado"}
        </div>
      )}



      {dadosRelatorio.length > 0 && (
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400">
          <span role="img" aria-label="imprimir">🖨️</span> Imprimir
        </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400"
            onClick={exportarCSV}
          >
            <span role="img" aria-label="exportar">📊</span> Exportar CSV
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 border-gray-400"
            onClick={exportarExcel}
          >
            <span role="img" aria-label="exportar">📈</span> Exportar Excel
          </button>
      </div>
      )}
    </div>
  );
} 