"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, startAfter, writeBatch, limit, onSnapshot } from "firebase/firestore";
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
const normalizarDado = (valor: any, tipo: string, coluna?: string): any => {
  if (valor === null || valor === undefined || valor === "") return null;
  const strValor = String(valor).trim();

  // Se for coluna de data de nascimento, normalizar para dd/mm/aaaa
  if (coluna && coluna.toLowerCase().includes('nascimento')) {
    // Se for número (serial Excel)
    if (!isNaN(Number(strValor)) && strValor !== "") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const dias = Math.floor(Number(strValor));
      if (dias > 59) { // Excel bug: 1900 não foi bissexto
        excelEpoch.setDate(excelEpoch.getDate() + dias - 1);
      } else {
        excelEpoch.setDate(excelEpoch.getDate() + dias);
      }
      const d = excelEpoch;
      const dia = String(d.getUTCDate()).padStart(2, '0');
      const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
      const ano = d.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    // Se for string ISO ou americano
    const matchISO = strValor.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchISO) {
      const [_, ano, mes, dia] = matchISO;
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
    // Se já estiver em dd/mm/aaaa
    const matchBR = strValor.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchBR) {
      const [_, dia, mes, ano] = matchBR;
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
    return strValor;
  }

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

// Origens de base disponíveis
const ORIGENS_BASE = [
  { id: "inss", nome: "INSS", cor: "bg-green-100 text-green-800" },
  { id: "siape", nome: "SIAPE", cor: "bg-blue-100 text-blue-800" },
  { id: "outros", nome: "OUTROS", cor: "bg-gray-100 text-gray-800" }
];

// Campos de prospecção disponíveis
const CAMPOS_PROSPECCAO = [
  { id: "tipoBeneficio", nome: "Tipo de Benefício", descricao: "INSS, SIAPE, GERAL" },
  { id: "renda", nome: "Renda", descricao: "Valor da renda/benefício" },
  { id: "margem", nome: "Margem Livre", descricao: "Margem disponível" },
  { id: "especie", nome: "Espécie", descricao: "Código da espécie do benefício" },
  { id: "estado", nome: "Estado", descricao: "Estado/UF" },
  { id: "municipio", nome: "Município", descricao: "Cidade" },
  { id: "idade", nome: "Idade", descricao: "Idade do beneficiário" },
  { id: "dataNascimento", nome: "Data de Nascimento", descricao: "Data de nascimento" },
  { id: "sexo", nome: "Sexo", descricao: "M/F" },
  { id: "representanteLegal", nome: "Representante Legal", descricao: "Nome do representante" },
  { id: "tipoConta", nome: "Tipo de Conta", descricao: "Corrente, Poupança, etc" },
  { id: "banco", nome: "Banco", descricao: "Nome do banco" },
  { id: "cartaoPessoalRMC", nome: "Cartão Pessoal (RMC)", descricao: "Cartão pessoal" },
  { id: "cartaoBeneficioRCC", nome: "Cartão Benefício (RCC)", descricao: "Cartão do benefício" },
  { id: "bloqueadoEmprestimo", nome: "Bloqueado para Empréstimo", descricao: "Status de bloqueio" },
  { id: "dataConcessao", nome: "Data da Concessão", descricao: "Data de concessão do benefício" },
  { id: "emprestimos", nome: "Empréstimos", descricao: "Informações de empréstimos" },
  { id: "descontoAssociativo", nome: "Desconto Associativo", descricao: "Descontos associativos" },
  { id: "margemRMC", nome: "Margem RMC", descricao: "Margem do cartão pessoal" },
  { id: "margemRCC", nome: "Margem RCC", descricao: "Margem do cartão benefício" },
  { id: "quantidadeLinhas", nome: "Quantidade de Linhas", descricao: "Número de linhas de crédito" },
  { id: "prazo", nome: "Prazo", descricao: "Prazo de empréstimos" },
  { id: "bancoEmprestado", nome: "Banco Emprestado", descricao: "Banco do empréstimo" },
  { id: "valorParcela", nome: "Valor da Parcela", descricao: "Valor das parcelas" },
  { id: "parcelasQuitadas", nome: "Parcelas Quitadas", descricao: "Número de parcelas quitadas" },
  { id: "parcelasRestantes", nome: "Parcelas Restantes", descricao: "Número de parcelas restantes" },
  { id: "taxaContrato", nome: "Taxa do Contrato", descricao: "Taxa de juros do contrato" },
  { id: "dataAverbacao", nome: "Data da Averbação", descricao: "Data de averbação" }
];

// Função utilitária para o master: remover registros órfãos
async function limparRegistrosOrfaos() {
  const basesSnap = await getDocs(collection(db, "bases"));
  const baseIdsValidos = new Set(basesSnap.docs.map(b => b.id));
  const baseClientesRef = collection(db, "base_clientes");
  let lastDoc = null;
  let totalExcluidos = 0;
  while (true) {
    const q: any = lastDoc
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
  const [showMapeamento, setShowMapeamento] = useState(false);
  const [baseMapeamento, setBaseMapeamento] = useState<any>(null);
  const [dupCount, setDupCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalReg, setTotalReg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tiposColunas, setTiposColunas] = useState<{ [key: string]: string }>({});
  const [tiposColunasEditaveis, setTiposColunasEditaveis] = useState<{ [key: string]: string }>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [setoresColunas, setSetoresColunas] = useState<{ [coluna: string]: string }>({});
  const [mapeamentoProspeccao, setMapeamentoProspeccao] = useState<{ [coluna: string]: string }>({});
  const [origemBase, setOrigemBase] = useState<string>("");
  const [dadosParaImportar, setDadosParaImportar] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploadMsgApi, setUploadMsgApi] = useState<string>("");
  const [uploadingApi, setUploadingApi] = useState(false);
  // Novo state para arquivo de background
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [configsSalvas, setConfigsSalvas] = useState(false);
  const [msgConfigsSalvas, setMsgConfigsSalvas] = useState("");
  const [previasMinimizadas, setPreviasMinimizadas] = useState<any[]>([]);
  const [showPreviasModal, setShowPreviasModal] = useState(false);
  // Substituir o input de arquivo para aceitar múltiplos arquivos
  const [arquivosParaImportar, setArquivosParaImportar] = useState<File[]>([]);
  // Estado para progresso das importações vinculadas às prévias
  const [progressoPrevias, setProgressoPrevias] = useState<{ [importId: string]: { progresso: number, total: number, status: string } }>({});
  // Estado para rastrear progresso de importação de cada base
  const [progressoBases, setProgressoBases] = useState<{ [baseId: string]: { importadas: number, total: number, status: string } }>({});
  // Estado para rastrear quantidade de CPFs por base
  const [cpfsPorBase, setCpfsPorBase] = useState<{ [baseId: string]: number }>({});

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
        
        // Carregar progresso de importação para cada base
        basesData.forEach((base: any) => {
          if (base.importId) {
            const importRef = doc(db, "importacoes", base.importId);
            onSnapshot(importRef, (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setProgressoBases(prev => ({
                  ...prev,
                  [base.id]: {
                    importadas: data.progresso || 0,
                    total: data.total || base.total || 0,
                    status: data.status || "pendente"
                  }
                }));
              }
            });
          } else {
            // Se não tem importId, considerar como 100% importada (importação antiga)
            setProgressoBases(prev => ({
              ...prev,
              [base.id]: {
                importadas: base.total || 0,
                total: base.total || 0,
                status: "concluida"
              }
            }));
          }
          
          // Contar CPFs para cada base
          contarCPFsDaBase(base.id);
        });
      }).catch(error => {
        console.error("Erro ao carregar bases:", error);
        setLoading(false);
      });
    }
  }, [user, showUpload]);

  // Efeito para escutar progresso das importações vinculadas
  useEffect(() => {
    // Limpa listeners antigos
    let unsubscribes: any[] = [];
    previasMinimizadas.forEach(previa => {
      if (previa.importId) {
        const importRef = doc(db, "importacoes", previa.importId);
        const unsub = onSnapshot(importRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProgressoPrevias(prev => ({
              ...prev,
              [previa.importId]: {
                progresso: data.progresso || 0,
                total: data.total || 0,
                status: data.status || "pendente"
              }
            }));
          }
        });
        unsubscribes.push(unsub);
      }
    });
    return () => { unsubscribes.forEach(u => u && u()); };
  }, [previasMinimizadas]);

  // Função para contar CPFs de uma base
  const contarCPFsDaBase = async (baseId: string) => {
    try {
      // Buscar registros da base que têm CPF válido
      const q = query(
        collection(db, "base_clientes"), 
        where("baseId", "==", baseId),
        where("chave", ">=", "cpf_"),
        where("chave", "<=", "cpf_\uf8ff")
      );
      const snap = await getDocs(q);
      const cpfsCount = snap.size;
      
      setCpfsPorBase(prev => ({
        ...prev,
        [baseId]: cpfsCount
      }));
      
      console.log(`📊 Base ${baseId}: ${cpfsCount} CPFs encontrados`);
    } catch (error) {
      console.error(`❌ Erro ao contar CPFs da base ${baseId}:`, error);
      setCpfsPorBase(prev => ({
        ...prev,
        [baseId]: 0
      }));
    }
  };

  // Função para analisar e identificar colunas
  const analisarArquivo = async (file: File) => {
    try {
      // Verificar se o arquivo existe e tem tamanho
      if (!file || file.size === 0) {
        throw new Error("Arquivo vazio ou inválido");
      }

      // Verificar extensão do arquivo
      const extensao = file.name.toLowerCase().split('.').pop();
      if (!['xlsx', 'xls', 'csv'].includes(extensao || '')) {
        throw new Error("Formato de arquivo não suportado. Use .xlsx, .xls ou .csv");
      }

      console.log(`📁 Analisando arquivo: ${file.name} (${file.size} bytes)`);
      
      const data = await file.arrayBuffer();
      console.log(`✅ Arquivo lido com sucesso: ${data.byteLength} bytes`);
      
      const workbook = XLSX.read(data);
      console.log(`📊 Planilhas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        throw new Error("Nenhuma planilha encontrada no arquivo");
      }
      
      // Obter todas as linhas como array de arrays
      const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`📈 Total de linhas: ${linhas.length}`);
      
      if (linhas.length === 0) {
        throw new Error("Arquivo vazio ou sem dados válidos");
      }
      
      // O cabeçalho é a primeira linha
      const cabecalho: string[] = linhas[0].map((col: any) => String(col).trim());
      console.log(`🏷️ Colunas encontradas: ${cabecalho.join(', ')}`);
      
      // Montar os dados como array de objetos, garantindo todas as colunas do cabeçalho
      const json = linhas.slice(1).map((linha: any[]) => {
        const obj: any = {};
        cabecalho.forEach((col, idx) => {
          obj[col] = linha[idx] !== undefined ? linha[idx] : '';
        });
        return obj;
      });
      
      if (json.length === 0) {
        throw new Error("Arquivo sem dados após o cabeçalho");
      }
      
      console.log(`✅ Dados processados: ${json.length} registros`);
      
      // Identificar tipos das colunas
      const tipos: { [key: string]: string } = {};
      for (const coluna of cabecalho) {
        const valores = json.slice(0, 50).map((row: any) => row[coluna]).filter(v => v !== null && v !== undefined && v !== "");
        tipos[coluna] = identificarTipoColuna(valores);
      }
      
      // Prévia dos dados (10 primeiros registros)
      const previewDataFiltrada = json.slice(0, 10).map((row: any) => {
        const rowFiltrada: any = {};
        for (const coluna of cabecalho) {
          rowFiltrada[coluna] = row[coluna];
        }
        return rowFiltrada;
      });
      
      setTiposColunas(tipos);
      setTiposColunasEditaveis(tipos); // Inicializa os editáveis com os detectados
      setPreviewData(previewDataFiltrada);
      setShowPreview(true);
      
      console.log(`🎉 Análise concluída com sucesso para: ${file.name}`);
      return { json, tipos, colunas: cabecalho };
    } catch (error: any) {
      console.error(`❌ Erro ao analisar arquivo ${file.name}:`, error);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('permissão') || error.message.includes('permission')) {
        throw new Error(`Erro de permissão no arquivo "${file.name}". Verifique se:\n• O arquivo não está aberto em outro programa\n• Você tem permissão para acessar o arquivo\n• O arquivo não está corrompido`);
      }
      
      if (error.message.includes('não pôde ser lido')) {
        throw new Error(`Não foi possível ler o arquivo "${file.name}". Tente:\n• Salvar uma nova cópia do arquivo\n• Verificar se o arquivo não está corrompido\n• Usar um arquivo menor para teste`);
      }
      
      throw new Error(`Erro ao processar "${file.name}": ${error.message}`);
    }
  };

  // Upload de base com controle de duplicidade melhorado
  const handleFile = async (e: any) => {
    const files = Array.from(e.target.files || []);
    setArquivosParaImportar(files);
    if (files.length === 0) return;
    
    console.log(`📁 Arquivos selecionados: ${files.length}`);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.size} bytes)`);
    });
    
    // Analisar apenas o primeiro arquivo para sugerir tipos/colunas
    try {
      console.log(`🔍 Iniciando análise do primeiro arquivo: ${files[0].name}`);
      const { json, tipos, colunas } = await analisarArquivo(files[0]);
      setDadosParaImportar({ json, tipos, colunas, fileName: files[0].name, originalFile: files[0] });
      setTotalReg(json.length);
      setShowPreview(true);
      setUploadMsg(""); // Limpar mensagens de erro anteriores
    } catch (err: any) {
      console.error("❌ Erro no handleFile:", err);
      setUploadMsg("Erro ao importar: " + err.message);
      setShowPreview(false);
      setDadosParaImportar(null);
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

  // Visualizar mapeamento de prospecção de uma base
  const verMapeamentoProspeccao = (base: any) => {
    setBaseMapeamento(base);
    setShowMapeamento(true);
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
      const batchSize = 300;
      while (true) {
        const q = lastDoc
          ? query(baseClientesRef, where("baseId", "==", base.id), orderBy("chave"), startAfter(lastDoc), limit(batchSize))
          : query(baseClientesRef, where("baseId", "==", base.id), orderBy("chave"), limit(batchSize));
        const snap = await getDocs(q);
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach(docu => batch.delete(docu.ref));
        await batch.commit();
        totalExcluidos += snap.docs.length;
        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < batchSize) break; // Último lote
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
    if (!dadosParaImportar || arquivosParaImportar.length === 0) return;
    if (!origemBase) {
      alert("É obrigatório selecionar a origem da base");
      return;
    }
    setUploading(true);
    setUploadMsg("");
    setDupCount(0);
    setProgress(0);
    setElapsed(0);
    setTotalReg(dadosParaImportar.json.length);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    try {
      let novasPrevias: any[] = [];
      for (let idx = 0; idx < arquivosParaImportar.length; idx++) {
        const file = arquivosParaImportar[idx];
        // Analisar cada arquivo individualmente
        const { json, tipos, colunas } = await analisarArquivo(file);
        const tiposParaImportar = tiposColunasEditaveis;
        const setoresParaImportar = setoresColunas;
        const mapeamentoProspeccaoParaImportar = mapeamentoProspeccao;
        // Criar registro da base
        const baseRef = await addDoc(collection(db, "bases"), {
          nome: file.name,
          data: new Date(),
          total: json.length,
          origem: origemBase,
          tiposColunas: tiposParaImportar,
          ordemColunas: colunas,
          setoresColunas: setoresParaImportar,
          mapeamentoProspeccao: mapeamentoProspeccaoParaImportar,
          importId: importacaoRef.id, // Referência para rastrear progresso
        });
        
        // Criar registro na coleção importacoes para processamento em background
        const importacaoRef = await addDoc(collection(db, "importacoes"), {
          fileName: file.name,
          filePath: `importacoes/${baseRef.id}_${file.name}`,
          status: 'pendente',
          createdAt: new Date(),
          origem: origemBase,
          user: user.email,
          tiposColunas: tiposParaImportar,
          setoresColunas: setoresParaImportar,
          mapeamentoProspeccao: mapeamentoProspeccaoParaImportar,
          baseId: baseRef.id, // Referência para a base
          total: json.length,
          progresso: 0
        });
        // Criar uma nova prévia minimizada para cada arquivo
        novasPrevias.push({
          id: Date.now() + idx,
          dadosParaImportar: { json, tipos, colunas, fileName: file.name, originalFile: file },
          tiposColunasEditaveis,
          setoresColunas,
          mapeamentoProspeccao,
          origemBase,
          configsSalvas,
          msgConfigsSalvas,
          criadaEm: new Date(),
          totalLinhas: json.length,
          totalArquivos: 1,
          importId: importacaoRef.id
        });
        let duplicados = 0;
        let processed = 0;
        let sucessos = 0;
        for (const row of json) {
          try {
            const dadosNormalizados: any = {};
            for (const [coluna, valor] of Object.entries(row)) {
              const tipo = tiposParaImportar[coluna] || "texto";
              dadosNormalizados[coluna] = normalizarDado(valor, tipo, coluna);
            }
            const chave = gerarChaveUnica(dadosNormalizados, tiposParaImportar);
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
              origem: origemBase,
              tiposColunas: tiposParaImportar,
              setoresColunas: setoresParaImportar,
              mapeamentoProspeccao: mapeamentoProspeccaoParaImportar,
            });
            sucessos++;
            processed++;
            setProgress(processed);
          } catch (error) {
            processed++;
            setProgress(processed);
          }
        }
        setDupCount(duplicados);
        setUploadMsg(`Base ${file.name} importada com sucesso! ${sucessos} registros importados, ${duplicados} duplicados ignorados`);
      }
      // Adiciona todas as novas prévias ao array existente
      setPreviasMinimizadas(prev => [...prev, ...novasPrevias]);
      setShowPreview(false);
      setShowUpload(false);
    } catch (err: any) {
      setUploadMsg("Erro ao importar: " + err.message);
    }
    setUploading(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Função para upload via API
  const handleApiUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMsgApi("");
    setUploadingApi(true);
    const file = uploadRef.current?.files?.[0];
    if (!file) {
      setUploadMsgApi("Selecione um arquivo.");
      setUploadingApi(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/importarBase", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadMsgApi("Arquivo enviado com sucesso! Importação em segundo plano.");
      } else {
        setUploadMsgApi(data.error || "Erro ao enviar arquivo.");
      }
    } catch (err: any) {
      setUploadMsgApi("Erro ao enviar arquivo: " + err.message);
    }
    setUploadingApi(false);
  };

  // Função para salvar configurações de mapeamento
  const salvarConfiguracoes = async () => {
    if (!origemBase) {
      setMsgConfigsSalvas("É obrigatório selecionar a origem da base");
      return;
    }
    
    // Salvar configurações no state ou localStorage
    const configuracoes = {
      tipos: tiposColunasEditaveis,
      setores: setoresColunas,
      mapeamento: mapeamentoProspeccao,
      origem: origemBase
    };
    
    // Guardar no localStorage para esta sessão
    localStorage.setItem('configsImportacao', JSON.stringify(configuracoes));
    
    setConfigsSalvas(true);
    setMsgConfigsSalvas("✅ Configurações salvas! Agora você pode importar em background.");
    
    console.log("Configurações salvas:", configuracoes);
  };

  // Ajustar handleBackgroundImport para usar o arquivo salvo
  const handleBackgroundImport = async () => {
    setUploadMsgApi("");
    setUploadingApi(true);
    
    if (!configsSalvas) {
      setUploadMsgApi("Salve as configurações antes de importar em background.");
      alert("Salve as configurações antes de importar em background.");
      setUploadingApi(false);
      return;
    }
    
    // Verificar se temos os dados da prévia e o arquivo original
    if (!dadosParaImportar || !dadosParaImportar.originalFile) {
      setUploadMsgApi("Arquivo original não encontrado. Faça upload novamente.");
      alert("Arquivo original não encontrado. Faça upload novamente.");
      setUploadingApi(false);
      return;
    }
    
    // Carregar configurações salvas
    const configsSalvasStr = localStorage.getItem('configsImportacao');
    if (!configsSalvasStr) {
      setUploadMsgApi("Configurações não encontradas. Salve novamente.");
      alert("Configurações não encontradas. Salve novamente.");
      setUploadingApi(false);
      return;
    }
    
    const configsSalvasObj = JSON.parse(configsSalvasStr);
    
    // Usar o arquivo original salvo
    const file = dadosParaImportar.originalFile;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", dadosParaImportar.fileName);
    formData.append("tipos", JSON.stringify(configsSalvasObj.tipos));
    formData.append("setores", JSON.stringify(configsSalvasObj.setores));
    formData.append("mapeamento", JSON.stringify(configsSalvasObj.mapeamento));
    formData.append("origem", configsSalvasObj.origem);
    formData.append("userEmail", user.email);
    
    try {
      const res = await fetch("/api/importarBase", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadMsgApi("Importação em background iniciada! Você pode acompanhar o status na lista de importações.");
        alert("Importação em background iniciada! Você pode acompanhar o status na lista de importações.");
        setShowPreview(false);
        setShowUpload(false);
        // Limpar configurações salvas
        localStorage.removeItem('configsImportacao');
        setConfigsSalvas(false);
      } else {
        setUploadMsgApi(data.error || "Erro ao enviar arquivo.");
        alert(data.error || "Erro ao enviar arquivo.");
      }
    } catch (err: any) {
      setUploadMsgApi("Erro ao enviar arquivo: " + err.message);
      alert("Erro ao enviar arquivo: " + err.message);
    }
    setUploadingApi(false);
  };

  // Função para reabrir uma prévia minimizada
  const reabrirPrevia = (previa: any) => {
    setDadosParaImportar(previa.dadosParaImportar);
    setTiposColunasEditaveis(previa.tiposColunasEditaveis);
    setSetoresColunas(previa.setoresColunas);
    setMapeamentoProspeccao(previa.mapeamentoProspeccao);
    setOrigemBase(previa.origemBase);
    setConfigsSalvas(previa.configsSalvas);
    setMsgConfigsSalvas(previa.msgConfigsSalvas);
    setShowPreview(true);
    setShowPreviasModal(false);
  };

  // Função para excluir uma prévia minimizada
  const excluirPrevia = (id: number) => {
    setPreviasMinimizadas(previasMinimizadas.filter(p => p.id !== id));
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Bases Importadas</h1>
        </div>
      </div>

      {/* Resumo de estatísticas - linha separada */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-12 py-6 shadow-sm w-full max-w-5xl">
          <div className="text-center flex-1">
            <div className="text-4xl font-bold text-blue-900 mb-2">
              {Object.values(cpfsPorBase).reduce((total, count) => total + count, 0).toLocaleString()}
            </div>
            <div className="text-base text-blue-700 font-semibold whitespace-nowrap">Total CPFs</div>
          </div>
          <div className="w-px h-16 bg-gray-300 mx-8"></div>
          <div className="text-center flex-1">
            <div className="text-4xl font-bold text-green-900 mb-2">
              {bases.length}
            </div>
            <div className="text-base text-green-700 font-semibold whitespace-nowrap">Bases</div>
          </div>
          <div className="w-px h-16 bg-gray-300 mx-8"></div>
          <div className="text-center flex-1">
            <div className="text-4xl font-bold text-purple-900 mb-2">
              {bases.reduce((total, base) => total + (base.total || 0), 0).toLocaleString()}
            </div>
            <div className="text-base text-purple-700 font-semibold whitespace-nowrap">Total Registros</div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/importacoes")}
            className="bg-blue-900 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-blue-900 transition font-semibold"
          >
            Ver Status das Importações
          </button>
          {previasMinimizadas.length > 0 && (
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold relative" 
              onClick={() => setShowPreviasModal(true)}
              title={`${previasMinimizadas.length} prévia(s) minimizada(s)`}
            >
              Prévias ({previasMinimizadas.length})
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {previasMinimizadas.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-green-900 transition font-semibold"
          >
            Importar Nova Base
          </button>
          <button
            onClick={async () => {
              console.log("🔄 Atualizando contagem de CPFs...");
              for (const base of bases) {
                await contarCPFsDaBase(base.id);
              }
              alert("✅ Contagem de CPFs atualizada!");
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
            title="Recalcular quantidade de CPFs em todas as bases"
          >
            🔄 Atualizar CPFs
          </button>
        </div>
      </div>
      <form onSubmit={handleApiUpload} className="mb-6 flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="font-semibold text-blue-900">Importar Base:</label>
        <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFile} className="mb-2" />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-900 text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-blue-900 transition disabled:opacity-50" disabled={uploadingApi}>
            {uploadingApi ? "Enviando..." : "Prévia e Mapeamento"}
          </button>
          <button type="button" className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-green-900 transition disabled:opacity-50" disabled={uploadingApi}
            onClick={async () => {
              setUploadMsgApi("");
              setUploadingApi(true);
              const file = uploadRef.current?.files?.[0];
              if (!file) {
                setUploadMsgApi("Selecione um arquivo.");
                setUploadingApi(false);
                return;
              }
              const formData = new FormData();
              formData.append("file", file);
              try {
                const res = await fetch("/api/importarBase", {
                  method: "POST",
                  body: formData,
                });
                const data = await res.json();
                if (data.success) {
                  setUploadMsgApi("Importação em background iniciada! Você pode acompanhar o status na lista de importações.");
                } else {
                  setUploadMsgApi(data.error || "Erro ao enviar arquivo.");
                }
              } catch (err: any) {
                setUploadMsgApi("Erro ao enviar arquivo: " + err.message);
              }
              setUploadingApi(false);
            }}>
            Importar em Background
          </button>
        </div>
        {uploadMsgApi && <div className="text-blue-800 font-medium mt-1">{uploadMsgApi}</div>}
        
        {/* Dicas para resolver problemas de importação */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Dicas para Importação:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Feche o arquivo no Excel/Google Sheets antes de importar</li>
            <li>• Use arquivos .xlsx, .xls ou .csv</li>
            <li>• Verifique se o arquivo não está corrompido</li>
            <li>• Tente salvar uma nova cópia do arquivo</li>
            <li>• Para arquivos grandes, teste primeiro com uma amostra menor</li>
          </ul>
        </div>
      </form>
      <table className="w-full text-left border mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-900">
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Nome</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Origem</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Data</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Total</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">CPFs</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Importadas</th>
            <th className="px-4 py-3 border-b border-gray-300 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {bases.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-lg">
                Nenhuma base importada ainda. Clique em "Importar Nova Base" para começar.
              </td>
            </tr>
          ) : (
            bases.map((b: any, i) => {
              const progresso = progressoBases[b.id];
              const importadas = progresso?.importadas || 0;
              const total = progresso?.total || b.total || 0;
              const status = progresso?.status || 'concluida';
              const percentual = total > 0 ? Math.round((importadas / total) * 100) : 100;
              const cpfsCount = cpfsPorBase[b.id] || 0;
              
              return (
                <tr key={i} className="border-b border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium">{b.nome}</td>
                  <td className="px-4 py-4">
                    {b.origem ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        b.origem === 'inss' ? 'bg-green-100 text-green-800' :
                        b.origem === 'siape' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {b.origem === 'inss' ? 'INSS' : b.origem === 'siape' ? 'SIAPE' : 'OUTROS'}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">Não definida</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">{b.data?.toDate?.().toLocaleString?.() || b.data?.toLocaleString?.() || "-"}</td>
                  <td className="px-4 py-4 font-semibold">{b.total?.toLocaleString() || "0"}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-900 text-lg">{cpfsCount.toLocaleString()}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">CPFs</span>
                        {cpfsCount > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1">
                            {Math.round((cpfsCount / total) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span className="font-medium">{importadas.toLocaleString()}</span>
                        <span>{total.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 transition-all duration-300 ${
                            status === 'concluida' ? 'bg-green-600' :
                            status === 'erro' ? 'bg-red-600' :
                            status === 'cancelado' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          }`}
                          style={{ width: `${percentual}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 text-center font-medium">
                        {status === 'concluida' ? '✅ 100% Importada' :
                         status === 'erro' ? '❌ Erro na importação' :
                         status === 'cancelado' ? '⏸️ Cancelada' :
                         status === 'pendente' ? '⏳ Pendente' :
                         `${percentual}%`}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <button className="text-green-900 hover:underline text-sm font-medium" onClick={() => verRegistros(b)}>Ver registros</button>
                      <button className="text-blue-600 hover:underline text-sm font-medium" onClick={() => verMapeamentoProspeccao(b)}>Mapeamento</button>
                      <button className="text-red-600 hover:underline text-sm font-medium" onClick={() => excluirBase(b)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Importar Nova Base (Excel/CSV)</h2>
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFile} className="mb-2" />
            
            {/* Mostrar erro se houver */}
            {uploadMsg && uploadMsg.includes("Erro") && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-medium mb-2">❌ Erro na Importação:</div>
                <div className="text-red-700 text-sm whitespace-pre-line">{uploadMsg}</div>
                <button 
                  onClick={() => {
                    setUploadMsg("");
                    setArquivosParaImportar([]);
                    setDadosParaImportar(null);
                    setShowPreview(false);
                  }}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition text-sm"
                >
                  Limpar Erro e Tentar Novamente
                </button>
              </div>
            )}
            {uploading && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-gray-900">Importando... Tempo decorrido: {elapsed}s</div>
                  <button
                    onClick={() => {
                      setShowUpload(false);
                      alert('✅ Importação continua em background! Você pode acompanhar o progresso na barra lateral que aparecerá.');
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition text-sm"
                    title="Minimizar e continuar em background"
                  >
                    Minimizar
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                  <div className="bg-green-900 h-3 transition-all" style={{ width: totalReg ? `${Math.round((progress/totalReg)*100)}%` : '0%' }} />
                </div>
                <div className="text-xs text-gray-700">{progress} de {totalReg} registros</div>
              </>
            )}
            {uploadMsg && <div className="text-green-700">{uploadMsg}</div>}
            {dupCount > 0 && <div className="text-yellow-700">Duplicados ignorados: {dupCount}</div>}
            {arquivosParaImportar.length > 1 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Arquivos Selecionados:</h3>
                <ul className="list-disc ml-6 text-sm">
                  {arquivosParaImportar.map((file, idx) => (
                    <li key={file.name + idx} className="flex items-center gap-2">
                      {file.name}
                      <button
                        className="text-red-600 text-xs ml-2"
                        onClick={() => setArquivosParaImportar(arquivosParaImportar.filter((_, i) => i !== idx))}
                        title="Remover arquivo"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button className="text-gray-700 mt-2" onClick={() => setShowUpload(false)}>Fechar</button>
          </div>
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[600px] max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Prévia da Importação</h2>
            
            {/* Seleção de Origem */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3">Origem da Base</h3>
              <p className="text-yellow-800 text-sm mb-3">
                Selecione a origem desta base para que ela possa ser filtrada na prospecção:
              </p>
              <div className="flex flex-wrap gap-3">
                {ORIGENS_BASE.map(origem => (
                  <label key={origem.id} className="flex items-center">
                    <input
                      type="radio"
                      name="origem"
                      value={origem.id}
                      checked={origemBase === origem.id}
                      onChange={(e) => setOrigemBase(e.target.value)}
                      className="mr-2"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${origem.cor}`}>
                      {origem.nome}
                    </span>
                  </label>
                ))}
              </div>
              {!origemBase && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ É obrigatório selecionar a origem da base
                </p>
              )}
            </div>
            
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-700">Prospecção:</span>
                      <select
                        className="px-2 py-1 rounded border text-xs text-gray-900 bg-white"
                        value={mapeamentoProspeccao[coluna] || ''}
                        onChange={e => setMapeamentoProspeccao(prev => ({ ...prev, [coluna]: e.target.value }))}
                      >
                        <option value="">Não mapear</option>
                        {CAMPOS_PROSPECCAO.map(campo => (
                          <option key={campo.id} value={campo.id}>
                            {campo.nome} - {campo.descricao}
                          </option>
                        ))}
                      </select>
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
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <label className="block text-blue-900 font-semibold mb-1">Para importar em background, selecione novamente o arquivo:</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setBackgroundFile(e.target.files?.[0] || null)} />
            </div>
            <div className="mb-4">
              <button
                type="button"
                className={`w-full px-4 py-3 rounded font-semibold transition mb-2 ${
                  configsSalvas
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
                onClick={salvarConfiguracoes}
                disabled={configsSalvas}
              >
                {configsSalvas ? '✅ Configurações Salvas' : 'Salvar Configurações'}
              </button>
              {msgConfigsSalvas && (
                <div className="text-center text-sm font-medium text-green-700 mb-2">
                  {msgConfigsSalvas}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 rounded font-semibold transition bg-green-900 text-yellow-400 hover:bg-yellow-400 hover:text-green-900"
                onClick={importarBase}
                disabled={uploadingApi}
              >
                Importar Agora
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded font-semibold transition ${
                  uploadingApi || !configsSalvas
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-900 text-yellow-400 hover:bg-yellow-400 hover:text-blue-900'
                }`}
                onClick={handleBackgroundImport}
                disabled={uploadingApi || !configsSalvas}
                title={!configsSalvas ? "Salve as configurações primeiro" : ""}
              >
                {uploadingApi ? 'Enviando...' : 'Importar em Background'}
              </button>
              <button
                className="px-4 py-2 bg-purple-100 text-purple-800 rounded font-semibold hover:bg-purple-200 transition"
                onClick={() => {
                  // Salvar prévia atual na lista de minimizadas
                  const novaPrevia = {
                    id: Date.now(),
                    dadosParaImportar,
                    tiposColunasEditaveis,
                    setoresColunas,
                    mapeamentoProspeccao,
                    origemBase,
                    configsSalvas,
                    msgConfigsSalvas,
                    criadaEm: new Date(),
                    totalLinhas: dadosParaImportar?.json?.length || 0,
                    totalArquivos: arquivosParaImportar.length
                  };
                  setPreviasMinimizadas(prev => [...prev, novaPrevia]);
                  setShowPreview(false);
                  alert('✅ Prévia minimizada! Você pode reabri-la clicando no botão "Prévias" na tela principal.');
                }}
                title="Minimizar prévia e continuar configurando outras importações"
              >
                Minimizar Prévia
              </button>
              <button 
                className={`px-4 py-2 rounded font-semibold transition ${
                  uploading || uploadingApi
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                onClick={() => {
                  if (!uploading && !uploadingApi) {
                    setShowPreview(false);
                    setShowUpload(false);
                    setConfigsSalvas(false);
                    localStorage.removeItem('configsImportacao');
                  }
                }}
                disabled={uploading || uploadingApi}
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
                  <thead>
                    <tr>
                      {registros[0] && Object.keys(registros[0])
                        .filter(k => k !== 'mapeamentoProspeccao')
                        .map(k => <th key={k} className="border px-2 py-1">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((row, i) => {
                      const valores = Object.entries(row)
                        .filter(([k]) => k !== 'mapeamentoProspeccao')
                        .map(([, v]) => v);
                      return (
                        <tr key={i}>
                          {valores.map((v, j) => <td key={j} className="border px-2 py-1">{String(v)}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <button className="text-gray-700 mt-2" onClick={() => setSelectedBase(null)}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal Mapeamento de Prospecção */}
      {showMapeamento && baseMapeamento && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[600px] max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Mapeamento de Prospecção: {baseMapeamento.nome}
            </h2>
            
            {baseMapeamento.mapeamentoProspeccao ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(baseMapeamento.mapeamentoProspeccao).map(([coluna, campo]) => {
                    const campoInfo = CAMPOS_PROSPECCAO.find(c => c.id === String(campo));
                    return (
                      <div key={coluna} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{coluna}</h4>
                            <p className="text-sm text-gray-600">Coluna da base</p>
                          </div>
                                                     <div className="text-right">
                             <h4 className="font-semibold text-blue-900">{campoInfo?.nome || String(campo)}</h4>
                             <p className="text-sm text-blue-700">{campoInfo?.descricao}</p>
                           </div>
                        </div>
                                                 <div className="text-xs text-gray-500">
                           Mapeado para: <strong>{String(campo)}</strong>
                         </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Mapeamento Configurado</h3>
                  <p className="text-green-800 text-sm">
                    Esta base está configurada para prospecção. Os filtros de prospecção irão 
                    buscar automaticamente nos campos mapeados.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-yellow-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapeamento Não Configurado</h3>
                <p className="text-gray-600 mb-4">
                  Esta base não possui mapeamento de prospecção configurado. 
                  Os filtros de prospecção usarão os campos padrão.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Para configurar o mapeamento, reimporte a base e configure os campos de prospecção.</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                onClick={() => setShowMapeamento(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Prévias Minimizadas */}
      {showPreviasModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[350px] max-w-lg w-full flex flex-col gap-4">
            <h2 className="text-lg font-bold text-purple-800 mb-2">Prévias Minimizadas</h2>
            {previasMinimizadas.length === 0 ? (
              <div className="text-gray-600 text-center">Nenhuma prévia minimizada.</div>
            ) : (
              <div className="space-y-4">
                {previasMinimizadas.map((previa) => (
                  <div key={previa.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg mb-1">
                          {previa.dadosParaImportar?.fileName || 'Arquivo sem nome'}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          📅 Criada em: {previa.criadaEm ? new Date(previa.criadaEm).toLocaleString('pt-BR') : 'Data não disponível'}
                        </div>
                        <div className="text-sm text-gray-700">
                          📊 {previa.totalLinhas?.toLocaleString() || 0} linhas para processar
                          {previa.totalArquivos > 1 && ` • ${previa.totalArquivos} arquivos`}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs font-semibold"
                          onClick={() => reabrirPrevia(previa)}
                        >
                          Reabrir
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs font-semibold"
                          onClick={() => excluirPrevia(previa.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    
                    {/* Barra de progresso visual */}
                    {previa.importId && progressoPrevias[previa.importId] ? (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progresso da importação</span>
                          <span>{progressoPrevias[previa.importId].progresso.toLocaleString()} de {progressoPrevias[previa.importId].total.toLocaleString()} linhas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-green-900 h-3 transition-all duration-300"
                            style={{ width: `${progressoPrevias[previa.importId].total > 0 ? Math.round((progressoPrevias[previa.importId].progresso / progressoPrevias[previa.importId].total) * 100) : 0}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-gray-600 mt-1">
                          {progressoPrevias[previa.importId].status === 'concluida' ? 'Concluída (100%)' :
                            progressoPrevias[previa.importId].status === 'erro' ? 'Erro na importação' :
                            `Em andamento (${progressoPrevias[previa.importId].total > 0 ? Math.round((progressoPrevias[previa.importId].progresso / progressoPrevias[previa.importId].total) * 100) : 0}%)`}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Dados preparados para importação</span>
                          <span>{previa.totalLinhas?.toLocaleString() || 0} de {previa.totalLinhas?.toLocaleString() || 0} linhas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-green-900 h-3 transition-all duration-300"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-gray-600 mt-1">
                          Pronto para importar (100%)
                        </div>
                      </div>
                    )}
                    
                    {/* Informações de configuração */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {previa.origemBase && (
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          previa.origemBase === 'inss' ? 'bg-green-100 text-green-800' :
                          previa.origemBase === 'siape' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {previa.origemBase === 'inss' ? 'INSS' : 
                           previa.origemBase === 'siape' ? 'SIAPE' : 'OUTROS'}
                        </span>
                      )}
                      {previa.configsSalvas && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                          ✅ Configurado
                        </span>
                      )}
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                        ID: {previa.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
              onClick={() => setShowPreviasModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
