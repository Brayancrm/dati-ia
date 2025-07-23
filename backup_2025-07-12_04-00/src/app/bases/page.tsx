"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, startAfter, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

// Função para identificar o tipo de dado de uma coluna
const identificarTipoColuna = (valores: any[]): string => {
  if (valores.length === 0) return "texto";
  
  const amostra = valores.slice(0, 10).filter(v => v !== null && v !== undefined && v !== "");
  
  if (amostra.length === 0) return "texto";
  
  // Verificar se é CPF (11 dígitos numéricos)
  const cpfRegex = /^\d{11}$/;
  if (amostra.every(v => cpfRegex.test(String(v).replace(/\D/g, '')))) {
    return "cpf";
  }
  
  // Verificar se é CNPJ (14 dígitos numéricos)
  const cnpjRegex = /^\d{14}$/;
  if (amostra.every(v => cnpjRegex.test(String(v).replace(/\D/g, '')))) {
    return "cnpj";
  }
  
  // Verificar se é email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (amostra.every(v => emailRegex.test(String(v)))) {
    return "email";
  }
  
  // Verificar se é telefone (contém números e caracteres especiais)
  const telefoneRegex = /^[\d\s\(\)\-\+]+$/;
  if (amostra.every(v => telefoneRegex.test(String(v)) && String(v).replace(/\D/g, '').length >= 10)) {
    return "telefone";
  }
  
  // Verificar se é data
  const dataRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
  if (amostra.every(v => dataRegex.test(String(v)))) {
    return "data";
  }
  
  // Verificar se é número
  if (amostra.every(v => !isNaN(Number(v)) && String(v).trim() !== "")) {
    return "numero";
  }
  
  return "texto";
};

// Função para normalizar dados baseado no tipo
const normalizarDado = (valor: any, tipo: string): any => {
  if (valor === null || valor === undefined || valor === "") return null;
  
  const strValor = String(valor).trim();
  
  switch (tipo) {
    case "cpf":
      return strValor.replace(/\D/g, '').padStart(11, '0');
    case "cnpj":
      return strValor.replace(/\D/g, '').padStart(14, '0');
    case "telefone":
      return strValor.replace(/\D/g, '');
    case "email":
      return strValor.toLowerCase();
    case "numero":
      return Number(strValor);
    case "data":
      // Tentar converter para formato ISO
      try {
        const data = new Date(strValor);
        if (!isNaN(data.getTime())) {
          return data.toISOString();
        }
      } catch {}
      return strValor;
    default:
      return strValor;
  }
};

// Função para gerar chave única baseada no tipo de identificador
const gerarChaveUnica = (row: any, tiposColunas: { [key: string]: string }): string => {
  // Priorizar CPF, depois CNPJ, depois email
  for (const [coluna, tipo] of Object.entries(tiposColunas)) {
    if (tipo === "cpf" && row[coluna]) {
      return `cpf_${normalizarDado(row[coluna], tipo)}`;
    }
  }
  
  for (const [coluna, tipo] of Object.entries(tiposColunas)) {
    if (tipo === "cnpj" && row[coluna]) {
      return `cnpj_${normalizarDado(row[coluna], tipo)}`;
    }
  }
  
  for (const [coluna, tipo] of Object.entries(tiposColunas)) {
    if (tipo === "email" && row[coluna]) {
      return `email_${normalizarDado(row[coluna], tipo)}`;
    }
  }
  
  // Se não encontrar identificador único, usar combinação de campos
  const campos = Object.keys(row).slice(0, 3);
  return campos.map(campo => row[campo]).join('_').replace(/\s+/g, '_');
};

const SETORES_COLUNAS = [
  { nome: 'DADOS PESSOAIS', valor: 'pessoais', icone: <svg className="w-4 h-4 text-green-700 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { nome: 'ENDEREÇO', valor: 'endereco', icone: <svg className="w-4 h-4 text-yellow-700 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg> },
  { nome: 'TELEFONES', valor: 'telefones', icone: <svg className="w-4 h-4 text-green-700 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 007.48 19h9.04a2 2 0 001.83-1.3L17 13M7 13l1.5-6h7l1.5 6" /></svg> },
  { nome: 'DADOS BANCÁRIOS', valor: 'bancarios', icone: <svg className="w-4 h-4 text-blue-700 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21V9a3 3 0 016 0v12" /></svg> },
  { nome: 'INSS', valor: 'inss', icone: <svg className="w-4 h-4 text-green-900 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 01-1.4 2.4H6a1.65 1.65 0 01-1.4-2.4l1.38-2.76A2 2 0 017.76 11h8.48a2 2 0 011.78 1.24L19.4 15z" /></svg> },
  { nome: 'SIAPE', valor: 'siape', icone: <svg className="w-4 h-4 text-yellow-900 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg> },
  { nome: 'OUTROS', valor: 'outros', icone: <svg className="w-4 h-4 text-gray-500 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" /></svg> },
];

// Função utilitária para o master: remover registros órfãos
async function limparRegistrosOrfaos() {
  const basesSnap = await getDocs(collection(db, "bases"));
  const baseIdsValidos = new Set(basesSnap.docs.map(b => b.id));
  const baseClientesRef = collection(db, "base_clientes");
  let lastDoc = null;
  let totalExcluidos = 0;
  while (true) {
    const q = lastDoc
      ? query(baseClientesRef, orderBy("baseId"), startAfter(lastDoc))
      : query(baseClientesRef, orderBy("baseId"));
    const snap = await getDocs(q);
    if (snap.empty) break;
    const batch = writeBatch(db);
    snap.docs.forEach(docu => {
      const data = docu.data();
      if (data.baseId && !baseIdsValidos.has(data.baseId)) {
        batch.delete(docu.ref);
        totalExcluidos++;
      }
    });
    await batch.commit();
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < 500) break;
  }
  alert(`Registros órfãos removidos: ${totalExcluidos}`);
}

export default function BasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bases, setBases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [dupCount, setDupCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalReg, setTotalReg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tiposColunas, setTiposColunas] = useState<{ [key: string]: string }>({});
  const [tiposColunasEditaveis, setTiposColunasEditaveis] = useState<{ [key: string]: string }>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [setoresColunas, setSetoresColunas] = useState<{ [coluna: string]: string }>({});
  const [dadosParaImportar, setDadosParaImportar] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onAuthStateChanged(require("@/firebaseConfig").auth, setUser);
  }, []);

  useEffect(() => {
    if (user && user.email.toLowerCase() === "brayan@agilisvertex.com.br") {
      setLoading(true);
      getDocs(collection(db, "bases")).then(snap => {
        const basesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Bases carregadas:", basesData);
        setBases(basesData);
        setLoading(false);
      }).catch(error => {
        console.error("Erro ao carregar bases:", error);
        setLoading(false);
      });
    }
  }, [user, showUpload]);

  // Função para analisar e identificar colunas
  const analisarArquivo = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      if (json.length === 0) {
        throw new Error("Arquivo vazio ou sem dados válidos");
      }
      
      // Identificar tipos de colunas
      const colunas = Object.keys(json[0]);
      const tipos: { [key: string]: string } = {};
      
      for (const coluna of colunas) {
        const valores = json.slice(0, 50).map(row => row[coluna]).filter(v => v !== null && v !== undefined && v !== "");
        tipos[coluna] = identificarTipoColuna(valores);
      }
      
      setTiposColunas(tipos);
      setTiposColunasEditaveis(tipos); // Inicializa os editáveis com os detectados
      setPreviewData(json.slice(0, 10));
      setShowPreview(true);
      
      return { json, tipos, colunas };
    } catch (error) {
      throw error;
    }
  };

  // Upload de base com controle de duplicidade melhorado
  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { json, tipos, colunas } = await analisarArquivo(file);
      setDadosParaImportar({ json, tipos, colunas, fileName: file.name });
      setTotalReg(json.length);
      setShowPreview(true);
    } catch (err: any) {
      setUploadMsg("Erro ao importar: " + err.message);
    }
  };

  // Visualizar registros de uma base
  const verRegistros = async (base: any) => {
    setSelectedBase(base);
    setRegLoading(true);
    const snap = await getDocs(query(collection(db, "base_clientes"), where("baseId", "==", base.id), limit(100)));
    setRegistros(snap.docs.map(d => d.data()));
    setRegLoading(false);
  };

  // Excluir base e todos os registros (batch delete)
  const excluirBase = async (base: any) => {
    if (!window.confirm("Excluir esta base e todos os registros?")) return;
    setLoading(true);
    let erroExclusao = null;
    try {
      const baseClientesRef = collection(db, "base_clientes");
      let lastDoc = null;
      let totalExcluidos = 0;
      while (true) {
        const q = lastDoc
          ? query(baseClientesRef, where("baseId", "==", base.id), orderBy("chave"), startAfter(lastDoc))
          : query(baseClientesRef, where("baseId", "==", base.id), orderBy("chave"));
        const snap = await getDocs(q);
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach(docu => batch.delete(docu.ref));
        await batch.commit();
        totalExcluidos += snap.docs.length;
        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < 500) break; // Firestore batch limit
      }
      // Excluir base
      await deleteDoc(doc(db, "bases", base.id));
      // Remover do estado sem recarregar a página
      setBases(prev => prev.filter(b => b.id !== base.id));
      setShowUpload(false);
      setSelectedBase(null);
      setLoading(false);
      alert(`Base excluída com sucesso! Registros removidos: ${totalExcluidos}`);
    } catch (err: any) {
      erroExclusao = err.message || String(err);
      setLoading(false);
      alert("Erro ao excluir base: " + erroExclusao);
    }
  };

  // No preview, ao clicar em 'Importar Agora', iniciar a importação usando setoresColunas atual
  const importarBase = async () => {
    if (!dadosParaImportar) return;
    setUploading(true);
    setUploadMsg("");
    setDupCount(0);
    setProgress(0);
    setElapsed(0);
    setTotalReg(dadosParaImportar.json.length);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    try {
      const { json, tipos, colunas } = dadosParaImportar;
      const tiposParaImportar = tiposColunasEditaveis;
      const setoresParaImportar = setoresColunas;
      // Criar registro da base
      const baseRef = await addDoc(collection(db, "bases"), {
        nome: dadosParaImportar.fileName,
        data: new Date(),
        total: json.length,
        tiposColunas: tiposParaImportar,
        ordemColunas: colunas,
        setoresColunas: setoresParaImportar, // Salvar também na base
      });
      let duplicados = 0;
      let processed = 0;
      let sucessos = 0;
      for (const row of json) {
        try {
          const dadosNormalizados: any = {};
          for (const [coluna, valor] of Object.entries(row)) {
            const tipo = tiposParaImportar[coluna] || "texto";
            dadosNormalizados[coluna] = normalizarDado(valor, tipo);
          }
          const chave = gerarChaveUnica(dadosNormalizados, tiposParaImportar);
          if (!chave || chave === "undefined_undefined_undefined") {
            processed++;
            setProgress(processed);
            continue;
          }
          const q = query(collection(db, "base_clientes"), where("chave", "==", chave));
          const snap = await getDocs(q);
          if (!snap.empty) {
            duplicados++;
            processed++;
            setProgress(processed);
            continue;
          }
          await addDoc(collection(db, "base_clientes"), {
            ...dadosNormalizados,
            chave,
            baseId: baseRef.id,
            tiposColunas: tiposParaImportar,
            setoresColunas: setoresParaImportar, // Agora sim, atualizado!
          });
          sucessos++;
          processed++;
          setProgress(processed);
        } catch (error) {
          console.error("Erro ao processar linha:", error);
          processed++;
          setProgress(processed);
        }
      }
      setDupCount(duplicados);
      setUploadMsg(`Base importada com sucesso! ${sucessos} registros importados, ${duplicados} duplicados ignorados`);
      setShowPreview(false);
      setShowUpload(false);
    } catch (err: any) {
      setUploadMsg("Erro ao importar: " + err.message);
    }
    setUploading(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (!user || user.email.toLowerCase() !== "brayan@agilisvertex.com.br") return <div className="mt-20 text-center text-red-600">Acesso restrito ao master.</div>;
  if (loading) return <div className="mt-20 text-center text-gray-900">Carregando bases...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
        <button
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
          title="Voltar para Dashboard"
          onClick={() => router.push("/dashboard")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Gerenciar Bases Importadas</h1>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-green-900 transition font-semibold"
        >
          Importar Nova Base
        </button>
      </div>
      <table className="w-full text-left border mb-8">
        <thead>
          <tr className="bg-gray-100 text-gray-900">
            <th className="p-2">Nome</th>
            <th className="p-2">Data</th>
            <th className="p-2">Total</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {bases.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                Nenhuma base importada ainda. Clique em "Importar Nova Base" para começar.
              </td>
            </tr>
          ) : (
            bases.map((b, i) => (
            <tr key={i} className="border-t text-gray-900">
              <td className="p-2">{b.nome}</td>
              <td className="p-2">{b.data?.toDate?.().toLocaleString?.() || b.data?.toLocaleString?.() || "-"}</td>
              <td className="p-2">{b.total}</td>
              <td className="p-2 flex gap-2">
                <button className="text-green-900 hover:underline" onClick={() => verRegistros(b)}>Ver registros</button>
                <button className="text-red-600 hover:underline" onClick={() => excluirBase(b)}>Excluir</button>
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Importar Nova Base (Excel/CSV)</h2>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="mb-2" />
            {uploading && (
              <>
                <div className="text-gray-900">Importando... Tempo decorrido: {elapsed}s</div>
                <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                  <div className="bg-green-900 h-3 transition-all" style={{ width: totalReg ? `${Math.round((progress/totalReg)*100)}%` : '0%' }} />
                </div>
                <div className="text-xs text-gray-700">{progress} de {totalReg} registros</div>
              </>
            )}
            {uploadMsg && <div className="text-green-700">{uploadMsg}</div>}
            {dupCount > 0 && <div className="text-yellow-700">Duplicados ignorados: {dupCount}</div>}
            <button className="text-gray-700 mt-2" onClick={() => setShowUpload(false)}>Fechar</button>
          </div>
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[600px] max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Prévia da Importação</h2>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tipos de Colunas Identificados:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(tiposColunasEditaveis).map(([coluna, tipo]) => (
                  <div key={coluna} className="flex flex-col gap-1 border rounded p-2 bg-gray-50">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-gray-900">{coluna}:</span>
                      <select
                        className="px-2 py-1 rounded border text-xs text-gray-900 bg-white"
                        value={tipo}
                        onChange={e => setTiposColunasEditaveis(prev => ({ ...prev, [coluna]: e.target.value }))}
                      >
                        <option value="texto">texto</option>
                        <option value="cpf">cpf</option>
                        <option value="cnpj">cnpj</option>
                        <option value="email">email</option>
                        <option value="telefone">telefone</option>
                        <option value="data">data</option>
                        <option value="numero">numero</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-700">Setor:</span>
                      <select
                        className="px-2 py-1 rounded border text-xs text-gray-900 bg-white"
                        value={setoresColunas[coluna] || ''}
                        onChange={e => setSetoresColunas(prev => ({ ...prev, [coluna]: e.target.value }))}
                      >
                        <option value="">Selecione...</option>
                        {SETORES_COLUNAS.map(s => (
                          <option key={s.valor} value={s.valor}>{s.nome}</option>
                        ))}
                      </select>
                      {SETORES_COLUNAS.find(s => s.valor === setoresColunas[coluna])?.icone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Amostra dos Dados (10 primeiros registros):</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border text-gray-900">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(previewData[0] || {}).map(coluna => (
                        <th key={coluna} className="border px-2 py-1 text-left text-gray-900">
                          {coluna}
                          <div className="text-xs text-gray-700 font-semibold">
                            {tiposColunasEditaveis[coluna]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((valor, j) => (
                          <td key={j} className="border px-2 py-1 text-gray-900">
                            {String(valor)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {uploading && (
              <>
                <div className="text-gray-900 text-center mb-4">
                  <div className="text-lg font-semibold">Importando... Tempo decorrido: {elapsed}s</div>
                  <div className="w-full bg-gray-200 rounded h-4 overflow-hidden mt-2">
                    <div className="bg-green-900 h-4 transition-all duration-300" style={{ width: totalReg ? `${Math.round((progress/totalReg)*100)}%` : '0%' }} />
                  </div>
                  <div className="text-sm text-gray-700 mt-2">{progress} de {totalReg} registros processados</div>
                  {dupCount > 0 && <div className="text-yellow-700 text-sm">Duplicados ignorados: {dupCount}</div>}
                </div>
              </>
            )}
            {uploadMsg && <div className="text-green-700 text-center mb-4 font-semibold">{uploadMsg}</div>}
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 rounded font-semibold transition ${
                  uploading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-900 text-yellow-400 hover:bg-yellow-400 hover:text-green-900'
                }`}
                onClick={importarBase}
                disabled={uploading}
              >
                {uploading ? 'Importando...' : 'Importar Agora'}
              </button>
              <button 
                className={`px-4 py-2 rounded font-semibold transition ${
                  uploading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                onClick={() => {
                  if (!uploading) {
                    setShowPreview(false);
                    setShowUpload(false);
                  }
                }}
                disabled={uploading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedBase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-3xl flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Registros da Base: {selectedBase.nome}</h2>
            {regLoading ? <div className="text-gray-900">Carregando registros...</div> : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-gray-900 border">
                  <thead><tr>{registros[0] && Object.keys(registros[0]).map(k => <th key={k} className="border px-2 py-1">{k}</th>)}</tr></thead>
                  <tbody>
                    {registros.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="border px-2 py-1">{String(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="text-gray-700 mt-2" onClick={() => setSelectedBase(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
} 