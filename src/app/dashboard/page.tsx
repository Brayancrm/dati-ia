"use client";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebaseConfig";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Fragment, useRef } from "react";
import { collection as firestoreCollection } from "firebase/firestore";

const SOLUCOES = [
  {
    nome: "Next - Inteligência de Mercado",
    desc: "Descubra oportunidades e tendências de mercado com inteligência de dados.",
    link: "#",
  },
  {
    nome: "Ipê - Enriquecimento de Dados",
    desc: "Aumente o valor da sua base com dados complementares e atualizados.",
    link: "#",
  },
  {
    nome: "API - Consulta de Dados e Validação de Identidade",
    desc: "Integre e valide dados em tempo real via API.",
    link: "#",
  },
];

const SETORES_COLUNAS = [
  { nome: 'DADOS PESSOAIS', valor: 'pessoais', icone: <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { nome: 'ENDEREÇO', valor: 'endereco', icone: <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg> },
  { nome: 'TELEFONES', valor: 'telefones', icone: <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg> },
  { nome: 'DADOS BANCÁRIOS', valor: 'bancarios', icone: <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 7H4c-1.103 0-2 .897-2 2v6c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V9c0-1.103-.897-2-2-2z"/><path d="M20 5H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2z"/><path d="M21 19H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2z"/></svg> },
  { nome: 'INSS', valor: 'inss', icone: <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/><circle cx="17" cy="17" r="3"/><path d="m19 19-1.5-1.5"/></svg> },
  { nome: 'SIAPE', valor: 'siape', icone: <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg> },
  { nome: 'OUTROS', valor: 'outros', icone: <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" /></svg> },
];

const GRUPOS_DADOS = [
  {
    nome: 'DADOS PESSOAIS',
    icone: (
      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
    campos: ["NOME", "NOME_COMPLETO", "CPF", "RG", "DATA_NASCIMENTO", "SEXO", "NOME_MAE", "NOME_PAI", "EMAIL", "SIGNO", "IDADE", "GENERO", "ESTADO_CIVIL"]
  },
  {
    nome: 'ENDEREÇO',
    icone: (
      <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
    ),
    campos: ["ENDERECO", "LOGRADOURO", "NUMERO", "COMPLEMENTO", "BAIRRO", "CIDADE", "ESTADO", "CEP"]
  },
  {
    nome: 'TELEFONES',
    icone: (
      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
    ),
    campos: ["TELEFONE", "CELULAR", "TELEFONES", "CELULARES"]
  },
  {
    nome: 'DADOS BANCÁRIOS',
    icone: (
      <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 21V9a3 3 0 016 0v12" /></svg>
    ),
    campos: ["BANCO", "AGENCIA", "CONTA", "TIPO_CONTA", "PIX", "CHAVE_PIX"]
  },
  {
    nome: 'INSS',
    icone: (
      <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 01-1.4 2.4H6a1.65 1.65 0 01-1.4-2.4l1.38-2.76A2 2 0 017.76 11h8.48a2 2 0 011.78 1.24L19.4 15z" /></svg>
    ),
    campos: ["INSS", "BENEFICIO_INSS", "NUMERO_BENEFICIO", "TIPO_BENEFICIO", "SITUACAO_BENEFICIO"]
  },
  {
    nome: 'SIAPE',
    icone: (
      <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
    ),
    campos: ["SIAPE", "MATRICULA_SIAPE", "ORGAO_SIAPE", "CARGO_SIAPE", "SITUACAO_SIAPE"]
  }
];

function setorizarDados(resultado: any) {
  const setores: { nome: string, icone: any, dados: { label: string, valor: any }[] }[] = [];
  const usados = new Set<string>();

  // Se o resultado tem setoresColunas, usar eles para organizar os dados
  if (resultado.setoresColunas) {
    const setoresMap = resultado.setoresColunas as { [key: string]: string };
    for (const setorInfo of SETORES_COLUNAS) {
      const camposDoSetor = Object.entries(setoresMap)
        .filter(([_, setor]) => setor === setorInfo.valor)
        .map(([coluna]) => coluna);
      const dados = camposDoSetor
        .filter(coluna => resultado[coluna] !== undefined && resultado[coluna] !== "")
        .map(coluna => ({ label: coluna.replace(/_/g, ' ').toUpperCase(), valor: resultado[coluna] }));
      dados.forEach(d => usados.add(d.label));
      if (dados.length > 0) {
        setores.push({ nome: setorInfo.nome, icone: setorInfo.icone, dados });
      }
    }
    
    // Não marcar como usados - permitir que dados classificados como "outros" sejam exibidos
    // Object.keys(resultado).forEach(k => {
    //   if (k !== 'setoresColunas' && k !== 'tiposColunas' && k !== 'baseId' && k !== 'chave') {
    //     usados.add(k);
    //   }
    // });
  } else {
    // Para dados que não foram classificados ou não têm setoresColunas, usar a lógica original
    for (const grupo of GRUPOS_DADOS) {
      const dados = grupo.campos
        .filter(campo => resultado[campo] !== undefined && resultado[campo] !== "" && !usados.has(campo))
        .map(campo => ({ label: campo.replace(/_/g, ' ').toUpperCase(), valor: resultado[campo] }));
      dados.forEach(d => usados.add(d.label));
      if (dados.length > 0) setores.push({ nome: grupo.nome, icone: grupo.icone, dados });
    }
  }

  // Não exibir dados não classificados automaticamente
  // Apenas dados explicitamente classificados serão exibidos

  return setores;
}

function obterNomeCliente(resultado: any): string {
  // Lista de possíveis nomes de colunas para nome do cliente
  const camposNome = [
    'NOME', 'Nome', 'nome',
    'NOME_COMPLETO', 'Nome_Completo', 'nome_completo',
    'NOME COMPLETO', 'Nome Completo', 'nome completo',
    'NOMECOMPLETO', 'NomeCompleto', 'nomecompleto',
    'RAZAO_SOCIAL', 'Razao_Social', 'razao_social',
    'CLIENTE', 'Cliente', 'cliente',
    'TITULAR', 'Titular', 'titular',
    'BENEFICIARIO', 'Beneficiario', 'beneficiario',
    'PESSOA', 'Pessoa', 'pessoa'
  ];

  // Procurar pelo primeiro campo que tenha valor
  for (const campo of camposNome) {
    if (resultado[campo] && String(resultado[campo]).trim() !== '') {
      return String(resultado[campo]).trim();
    }
  }

  // Se não encontrou nome em campos específicos, procurar por qualquer campo que pareça ser nome
  const todasChaves = Object.keys(resultado);
  for (const chave of todasChaves) {
    const chaveMinuscula = chave.toLowerCase();
    const valor = String(resultado[chave] || '').trim();
    
    // Verificar se é um campo que provavelmente contém nome
    if (valor && 
        (chaveMinuscula.includes('nome') || 
         chaveMinuscula.includes('cliente') || 
         chaveMinuscula.includes('titular') ||
         chaveMinuscula.includes('beneficiario') ||
         chaveMinuscula.includes('pessoa') ||
         chaveMinuscula.includes('razao')) &&
        !chaveMinuscula.includes('pai') &&
        !chaveMinuscula.includes('mae') &&
        !chaveMinuscula.includes('responsavel') &&
        valor.length > 2 && // Nome deve ter mais de 2 caracteres
        !/^\d+$/.test(valor) && // Não deve ser só números
        !/^[\d\-\/\.\(\)\s]+$/.test(valor)) { // Não deve ser telefone/CPF/data
      return valor;
    }
  }

  // Como último recurso, tentar usar o primeiro campo de texto não vazio que pareça ser nome
  for (const chave of todasChaves) {
    const valor = String(resultado[chave] || '').trim();
    if (valor && 
        valor.length > 3 && 
        valor.length < 100 && // Nome razoável
        !/^\d+$/.test(valor) && // Não é só números
        !/^[\d\-\/\.\(\)\s]+$/.test(valor) && // Não é telefone/CPF/data
        /^[a-zA-ZÀ-ÿ\s]+/.test(valor) && // Começa com letras
        !chave.toLowerCase().includes('cpf') &&
        !chave.toLowerCase().includes('cnpj') &&
        !chave.toLowerCase().includes('rg') &&
        !chave.toLowerCase().includes('telefone') &&
        !chave.toLowerCase().includes('celular') &&
        !chave.toLowerCase().includes('email') &&
        !chave.toLowerCase().includes('endereco') &&
        !chave.toLowerCase().includes('cep')) {
      return valor;
    }
  }

  return 'Nome não informado';
}

function obterCampo(resultado: any, tiposCampo: string[]): string | null {
  // Procurar pelo primeiro campo que tenha valor
  for (const campo of tiposCampo) {
    if (resultado[campo] && String(resultado[campo]).trim() !== '') {
      return String(resultado[campo]).trim();
    }
  }
  return null;
}

function obterCPF(resultado: any): string | null {
  const camposCPF = [
    'CPF', 'cpf', 'Cpf',
    'CPF_CLIENTE', 'cpf_cliente',
    'DOCUMENTO', 'documento',
    'DOC', 'doc'
  ];
  return obterCampo(resultado, camposCPF);
}

function obterRG(resultado: any): string | null {
  const camposRG = [
    'RG', 'rg', 'Rg',
    'RG_CLIENTE', 'rg_cliente',
    'IDENTIDADE', 'identidade',
    'REGISTRO_GERAL', 'registro_geral'
  ];
  return obterCampo(resultado, camposRG);
}

function CopiarValor({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-yellow-100 transition"
      title={copiado ? 'Copiado!' : 'Copiar'}
      type="button"
    >
      {copiado ? (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [cpfBusca, setCpfBusca] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaMsg, setBuscaMsg] = useState("");
  const [tipoBusca, setTipoBusca] = useState("CPF");
  const [loteModal, setLoteModal] = useState(false);
  const [loteResultados, setLoteResultados] = useState<any[]>([]);
  const [loteMsg, setLoteMsg] = useState("");
  const [loteLoading, setLoteLoading] = useState(false);
  const [bases, setBases] = useState<any[]>([]); // Adicionado para armazenar as bases
  const [usuarioInfo, setUsuarioInfo] = useState<any>(null);
  const [confirmarDesconto, setConfirmarDesconto] = useState(false);
  const [tipoConfirmacao, setTipoConfirmacao] = useState<'unico' | 'lote' | null>(null);
  const [dadosParaBuscar, setDadosParaBuscar] = useState<any>(null);
  const [creditosNecessarios, setCreditosNecessarios] = useState(1);
  const [modoLote, setModoLote] = useState<'arquivo' | 'manual' | null>(null);
  const [cpfsColados, setCpfsColados] = useState('');
  const [showOrdemModal, setShowOrdemModal] = useState(false);
  const [setoresAbertos, setSetoresAbertos] = useState<{ [key: string]: boolean }>({});
  
  const toggleSetor = (nomeSetor: string) => {
    setSetoresAbertos(prev => ({
      ...prev,
      [nomeSetor]: !prev[nomeSetor]
    }));
  };

  const [ordemSetores, setOrdemSetores] = useState([
    { valor: 'siape', nome: 'SIAPE', emoji: '📋' },
    { valor: 'inss', nome: 'INSS', emoji: '🆔' },
    { valor: 'pessoais', nome: 'DADOS PESSOAIS', emoji: '👤' },
    { valor: 'bancarios', nome: 'DADOS BANCÁRIOS', emoji: '🏦' },
    { valor: 'endereco', nome: 'ENDEREÇO', emoji: '📍' },
    { valor: 'telefones', nome: 'TELEFONES', emoji: '📞' },
    { valor: 'outros', nome: 'OUTROS', emoji: '⏰' },
  ]);
  const [dadosLoteTemp, setDadosLoteTemp] = useState<any>(null);
  const [progressoLote, setProgressoLote] = useState({ atual: 0, total: 0 });

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

  // Buscar info do usuário para créditos
  useEffect(() => {
    async function fetchUsuarioInfo() {
      if (user) {
        const usuarioDoc = (await getDocs(query(collection(db, "usuarios"), where("email", "==", user.email)))).docs[0];
        if (usuarioDoc) {
          setUsuarioInfo(usuarioDoc.data());
        }
      }
    }
    fetchUsuarioInfo();
  }, [user]);

  // Carregar bases para usar na organização dos resultados
  useEffect(() => {
    async function fetchBases() {
      try {
        const basesSnap = await getDocs(collection(db, "bases"));
        const basesData = basesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBases(basesData);
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    }
    fetchBases();
  }, []);

  if (loading) return <div className="text-center mt-20">Carregando...</div>;

  // Diferenciação master/usuário comum
  const isMaster = user?.email && user.email.toLowerCase() === "brayan@agilisvertex.com.br";

  // Detectar tipo de busca automaticamente
  const handleInputBusca = (v: string) => {
    setCpfBusca(v);
    if (v.replace(/\D/g, "").length === 11) setTipoBusca("CPF");
    else if (v.replace(/\D/g, "").length === 14) setTipoBusca("CNPJ");
    else setTipoBusca("");
  };

  // Função para processar upload de Excel
  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      // Salvar cada linha como documento na coleção "base_clientes"
      for (const row of json) {
        await addDoc(collection(db, "base_clientes"), row);
      }
      setUploadMsg("Base importada com sucesso!");
    } catch (err: any) {
      setUploadMsg("Erro ao importar: " + err.message);
    }
    setUploading(false);
  };

  // Função para processar busca com confirmação de desconto
  const handleBusca = async (e: any) => {
    e.preventDefault();
    setResultado(null);
    setBuscaMsg("");
    // Limpar resultados de lote quando fizer busca individual
    setLoteResultados([]);
    setLoteMsg("");
    if (!user) return;
    if (!cpfBusca) {
      setBuscaMsg("Digite um CPF ou CNPJ para buscar.");
      return;
    }
    // Verificar se é master (créditos ilimitados)
    const isMaster = user.email && user.email.toLowerCase() === "brayan@agilisvertex.com.br";
    if (!isMaster) {
    const usuarioDoc = (await getDocs(query(collection(db, "usuarios"), where("email", "==", user.email)))).docs[0];
    if (!usuarioDoc) {
      setBuscaMsg("Usuário não encontrado.");
      return;
    }
    const usuario = usuarioDoc.data();
    if (!usuario.status) {
      setBuscaMsg("Usuário inativo.");
      return;
    }
    if (usuario.creditos <= 0) {
      setBuscaMsg("Você não possui créditos suficientes. Faça uma recarga.");
      return;
    }
      // Confirmação antes de descontar
      setTipoConfirmacao('unico');
      setDadosParaBuscar({ cpfBusca, tipoBusca });
      setCreditosNecessarios(1);
      setConfirmarDesconto(true);
      return;
    }
    // Se master, busca direto
    await executarBusca({ cpfBusca, tipoBusca });
  };

  // Função para executar a busca após confirmação
  const executarBusca = async ({ cpfBusca, tipoBusca }: { cpfBusca: string, tipoBusca: string }) => {
    setBuscando(true);
    
    // Normalizar o CPF/CNPJ para busca
    const valorBusca = cpfBusca.replace(/\D/g, '');
    const valorBuscaFormatado = tipoBusca === "CPF" ? valorBusca.padStart(11, '0') : valorBusca.padStart(14, '0');
    
    try {
      // Buscar pela chave única primeiro (método mais eficiente)
      const chaveUnica = tipoBusca === "CPF" ? `cpf_${valorBuscaFormatado}` : `cnpj_${valorBuscaFormatado}`;
      let q = query(collection(db, "base_clientes"), where("chave", "==", chaveUnica));
      let snap = await getDocs(q);
      
      // Se não encontrar pela chave, buscar pelos campos tradicionais
      if (snap.empty) {
        if (tipoBusca === "CPF") {
          // Tentar buscar por diferentes variações do nome da coluna CPF
          const tentativasCPF = ["CPF", "cpf", "Cpf"];
          for (const campo of tentativasCPF) {
            q = query(collection(db, "base_clientes"), where(campo, "==", valorBuscaFormatado));
            snap = await getDocs(q);
            if (!snap.empty) break;
            
            // Tentar também com o valor original
            q = query(collection(db, "base_clientes"), where(campo, "==", cpfBusca));
            snap = await getDocs(q);
            if (!snap.empty) break;
          }
        } else if (tipoBusca === "CNPJ") {
          // Tentar buscar por diferentes variações do nome da coluna CNPJ
          const tentativasCNPJ = ["CNPJ", "cnpj", "Cnpj"];
          for (const campo of tentativasCNPJ) {
            q = query(collection(db, "base_clientes"), where(campo, "==", valorBuscaFormatado));
            snap = await getDocs(q);
            if (!snap.empty) break;
            
            // Tentar também com o valor original
            q = query(collection(db, "base_clientes"), where(campo, "==", cpfBusca));
            snap = await getDocs(q);
            if (!snap.empty) break;
          }
        }
      }
      
      let resultadoEncontrado = null;
      if (!snap.empty) {
        // Buscar todos os baseId válidos
        const basesSnap = await getDocs(collection(db, "bases"));
        const baseIdsValidos = new Set(basesSnap.docs.map(b => b.id));
        // Filtrar registros que tenham baseId válido (ou mostrar apenas se não tiver baseId?)
        const docsValidos = snap.docs.filter((docu: any) => {
          const data = docu.data();
          return data.baseId && baseIdsValidos.has(data.baseId);
        });
        if (docsValidos.length > 0) {
          resultadoEncontrado = docsValidos[0].data();
          setResultado(resultadoEncontrado);
          setBuscaMsg("");
        } else {
          setBuscaMsg(`${tipoBusca} não encontrado em bases ativas.`);
          setBuscando(false);
        }
      } else {
        setBuscaMsg(`${tipoBusca} não encontrado na base.`);
        setBuscando(false);
      }

      // Salvar consulta na coleção 'consultas' (sempre, encontrado ou não)
      await addDoc(collection(db, "consultas"), {
        email: user.email,
        cpf: tipoBusca === "CPF" ? cpfBusca : null,
        cnpj: tipoBusca === "CNPJ" ? cpfBusca : null,
        data: Timestamp.now(),
        tipo: "individual",
        resultado: resultadoEncontrado || null
      });

      // Descontar crédito APENAS se resultado foi encontrado E não for master
      const isMaster = user.email && user.email.toLowerCase() === "brayan@agilisvertex.com.br";
      if (!isMaster && resultadoEncontrado) {
        const usuarioDoc = (await getDocs(query(collection(db, "usuarios"), where("email", "==", user.email)))).docs[0];
        if (usuarioDoc) {
          const usuario = usuarioDoc.data();
          await updateDoc(doc(db, "usuarios", usuarioDoc.id), { creditos: usuario.creditos - 1 });
          setUsuarioInfo({ ...usuario, creditos: usuario.creditos - 1 });
        }
      }
      
    } catch (error) {
      console.error("Erro na busca:", error);
      setBuscaMsg("Erro ao realizar busca. Tente novamente.");
      setBuscando(false);
      return;
    }
    setBuscando(false);
  };

  // Função para busca em lote com configuração de ordem
  const handleLote = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoteLoading(true);
    setLoteMsg("");
    setLoteResultados([]);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      const chaves = json.map((row: any) => {
        // Tentar diferentes variações de nomes de colunas
        const valor = row.CPF || row.cpf || row.Cpf || row.CNPJ || row.cnpj || row.Cnpj || row['cpf'] || row['CPF'];
        return String(valor || '').trim();
      }).filter(Boolean);
      
      if (chaves.length === 0) {
        setLoteMsg("Arquivo deve conter coluna CPF ou CNPJ.");
        setLoteLoading(false);
        return;
      }
      // Armazenar dados temporariamente e mostrar modal de configuração
      setDadosLoteTemp({ chaves });
      setShowOrdemModal(true);
      setLoteLoading(false);
    } catch (err: any) {
      setLoteMsg("Erro ao processar arquivo: " + err.message);
      setLoteLoading(false);
    }
  };

  // Função para executar busca em lote após confirmação
  const executarBuscaLote = async ({ chaves }: { chaves: string[] }) => {
    setLoteLoading(true);
    setLoteResultados([]);
    setProgressoLote({ atual: 0, total: chaves.length });
    const resultados: any[] = [];
    let chavesEncontradas = 0; // Contador de chaves encontradas para desconto de créditos
    
    for (let i = 0; i < chaves.length; i++) {
      const chave = chaves[i];
      setProgressoLote({ atual: i + 1, total: chaves.length });
      // Limpar e processar a chave
      const chaveStr = String(chave).trim();
      const valorBusca = chaveStr.replace(/\D/g, '');
      let encontrado = false;
      let resultadoEncontrado = null;
      let tipoBusca = null;
      
      try {
        // Determinar se é CPF ou CNPJ
        if (valorBusca.length >= 9 && valorBusca.length <= 11) {
          tipoBusca = "CPF";
        } else if (valorBusca.length >= 13 && valorBusca.length <= 14) {
          tipoBusca = "CNPJ";
        }
        
        if (!tipoBusca || valorBusca.length === 0) {
          resultados.push({ chave: chaveStr, erro: `Formato inválido (${valorBusca.length} dígitos)` });
          
          // Salvar consulta com formato inválido também
          await addDoc(collection(db, "consultas"), {
            email: user.email,
            cpf: null,
            cnpj: null,
            data: Timestamp.now(),
            tipo: "lote",
            resultado: null,
            erro: `Formato inválido (${valorBusca.length} dígitos)`,
            chaveOriginal: chaveStr
          });
          
          continue; // Não incrementa contador para formatos inválidos
        }
        
        const valorBuscaFormatado = tipoBusca === "CPF" ? valorBusca.padStart(11, '0') : valorBusca.padStart(14, '0');
        
        // Buscar pela chave única primeiro
        const chaveUnica = tipoBusca === "CPF" ? `cpf_${valorBuscaFormatado}` : `cnpj_${valorBuscaFormatado}`;
        let q = query(collection(db, "base_clientes"), where("chave", "==", chaveUnica));
        let snap = await getDocs(q);
        
        // Se não encontrar pela chave, buscar pelos campos tradicionais
        if (snap.empty) {
          const tentativas = tipoBusca === "CPF" ? ["CPF", "cpf", "Cpf"] : ["CNPJ", "cnpj", "Cnpj"];
          for (const campo of tentativas) {
            q = query(collection(db, "base_clientes"), where(campo, "==", valorBuscaFormatado));
            snap = await getDocs(q);
            if (!snap.empty) break;
            
            // Tentar também com o valor original
            q = query(collection(db, "base_clientes"), where(campo, "==", chaveStr));
            snap = await getDocs(q);
            if (!snap.empty) break;
          }
        }
        
        if (!snap.empty) {
          // Verificar se a base ainda existe
          const registro = snap.docs[0].data();
          if (registro.baseId) {
            const baseDoc = await getDocs(query(collection(db, "bases"), where("__name__", "==", registro.baseId)));
            if (!baseDoc.empty) {
              resultados.push(registro);
              resultadoEncontrado = registro;
              encontrado = true;
            }
          } else {
            resultados.push(registro);
            resultadoEncontrado = registro;
            encontrado = true;
            chavesEncontradas++; // Incrementa apenas quando encontra dados
            chavesEncontradas++; // Incrementa apenas quando encontra dados
          }
        }
        
      } catch (error) {
        console.error(`Erro ao buscar ${chaveStr}:`, error);
      }
      
      // Salvar consulta encontrada (fora do try-catch para garantir execução)
      if (encontrado) {
        await addDoc(collection(db, "consultas"), {
          email: user.email,
          cpf: tipoBusca === "CPF" ? chaveStr : null,
          cnpj: tipoBusca === "CNPJ" ? chaveStr : null,
          data: Timestamp.now(),
          tipo: "lote",
          resultado: resultadoEncontrado || null
        });
      }
      
      if (!encontrado) {
        resultados.push({ chave: chaveStr, erro: "Não encontrado" });
        
        // Salvar consulta não encontrada também
        await addDoc(collection(db, "consultas"), {
          email: user.email,
          cpf: tipoBusca === "CPF" ? chaveStr : null,
          cnpj: tipoBusca === "CNPJ" ? chaveStr : null,
          data: Timestamp.now(),
          tipo: "lote",
          resultado: null,
          erro: "Não encontrado"
        });
      }
        
        // Pequeno delay para permitir atualização da interface
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    
    setLoteResultados(resultados);
    // Descontar créditos apenas para chaves encontradas
    const isMaster = user.email && user.email.toLowerCase() === "brayan@agilisvertex.com.br";
    if (!isMaster && chavesEncontradas > 0) {
      const usuarioDoc = (await getDocs(query(collection(db, "usuarios"), where("email", "==", user.email)))).docs[0];
      if (usuarioDoc) {
        const usuario = usuarioDoc.data();
        await updateDoc(doc(db, "usuarios", usuarioDoc.id), { creditos: usuario.creditos - chavesEncontradas });
        setUsuarioInfo({ ...usuario, creditos: usuario.creditos - chavesEncontradas });
      }
    }
    setLoteLoading(false);
    setProgressoLote({ atual: 0, total: 0 });
  };

  // Funções de exportação
  function exportarExcel() {
    // Agrupar todos os registros de todas as bases em uma única planilha
    const todosRegistros: any[] = [];
    let camposTabela: string[] = [];
    // Encontrar a primeira tabela para pegar os campos
    document.querySelectorAll('table').forEach((tbl, idx) => {
      if (idx === 0) {
        camposTabela = Array.from(tbl.querySelectorAll('thead th')).map(th => th.textContent || '');
      }
    });
    // Montar os dados na ordem dos camposTabela
    loteResultados.forEach(row => {
      const obj: any = {};
      camposTabela.forEach((campo, i) => {
        // Procurar o campo original (case-insensitive)
        const key = Object.keys(row).find(k => k.replace(/_/g, ' ').toUpperCase() === campo);
        obj[campo] = key ? row[key] : '';
      });
      todosRegistros.push(obj);
    });
    const ws = XLSX.utils.json_to_sheet(todosRegistros);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_lote.xlsx");
  }

  function exportarPDF() {
    let camposTabela: string[] = [];
    document.querySelectorAll('table').forEach((tbl, idx) => {
      if (idx === 0) {
        camposTabela = Array.from(tbl.querySelectorAll('thead th')).map(th => th.textContent || '');
      }
    });
    const body = loteResultados.map(row =>
      camposTabela.map(campo => {
        const key = Object.keys(row).find(k => k.replace(/_/g, ' ').toUpperCase() === campo);
        let val = key ? row[key] : '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return val;
      })
    );
    const doc = new jsPDF({ orientation: 'landscape' });
    autoTable(doc, {
      head: [camposTabela],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 125, 50] },
      margin: { top: 20 },
    });
    doc.save("resultados_lote.pdf");
  }

  return (
    <div className="w-full px-1 sm:px-2 md:px-4 bg-white py-2 mt-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-green-900">
            Créditos disponíveis: <span className="font-mono text-gray-900">
              {isMaster ? "Ilimitados" : (usuarioInfo ? usuarioInfo.creditos : '...')}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${!modoLote ? 'bg-green-900 text-yellow-400' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => {
              setModoLote(null);
              // Limpar resultados anteriores
              setResultado(null);
              setBuscaMsg("");
              setLoteResultados([]);
              setLoteMsg("");
            }}
            type="button"
          >
            Busca Individual
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${modoLote === 'arquivo' ? 'bg-green-900 text-yellow-400' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => {
              setModoLote('arquivo');
              // Limpar resultados anteriores
              setResultado(null);
              setBuscaMsg("");
              setLoteResultados([]);
              setLoteMsg("");
            }}
            type="button"
          >
            Upload de arquivo
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${modoLote === 'manual' ? 'bg-green-900 text-yellow-400' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => {
              setModoLote('manual');
              // Limpar resultados anteriores
              setResultado(null);
              setBuscaMsg("");
              setLoteResultados([]);
              setLoteMsg("");
            }}
            type="button"
          >
            Colar CPFs/CNPJs
          </button>
        </div>
      </div>
      <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-400/60">
        {modoLote === 'arquivo' && (
          <div className="mb-4">
            <label htmlFor="lote-upload" className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-400 hover:text-green-900 transition font-semibold cursor-pointer">Busca em lote (arquivo)</label>
            <input id="lote-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleLote} className="hidden" />
          </div>
        )}
        {modoLote === 'manual' && (
          <div className="mb-4 flex flex-col gap-2">
            <label className="font-semibold text-gray-900">Cole os CPFs ou CNPJs (um por linha):</label>
            <textarea
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-black min-h-[120px] max-h-60"
              placeholder="Digite ou cole aqui...\n123.456.789-00\n98765432100\n12.345.678/0001-99"
              value={cpfsColados}
              onChange={e => setCpfsColados(e.target.value)}
            />
            <button
              className="bg-green-900 text-yellow-400 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 hover:text-green-900 transition w-fit self-end"
              type="button"
              onClick={() => {
                const linhas = cpfsColados.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                if (linhas.length === 0) {
                  setLoteMsg('Cole ao menos um CPF ou CNPJ.');
                  return;
                }
                // Armazenar dados temporariamente e mostrar modal de configuração
                setDadosLoteTemp({ chaves: linhas });
                setShowOrdemModal(true);
              }}
              disabled={loteLoading}
            >
              {loteLoading ? 'Processando...' : 'Processar busca'}
            </button>
          </div>
        )}
        {/* Busca Individual - só aparece quando não estiver em modo lote */}
        {!modoLote && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-700 to-green-800 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Busca Individual</h3>
                <p className="text-sm text-gray-600">Consulte dados completos por CPF ou CNPJ</p>
              </div>
            </div>
            
            <form className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm" onSubmit={handleBusca}>
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                {/* Input de busca */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Documento para consulta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Digite o CPF ou CNPJ para consulta" 
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900 placeholder:text-gray-500 bg-white shadow-sm" 
                      value={cpfBusca} 
                      onChange={e => handleInputBusca(e.target.value)} 
                    />
                  </div>
                </div>
                
                {/* Select tipo de busca */}
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de consulta
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-gray-900 bg-white shadow-sm appearance-none cursor-pointer" 
                      value={tipoBusca} 
                      onChange={e => setTipoBusca(e.target.value)}
                    >
                      <option value="CPF">👤 Pessoa Física (CPF)</option>
                      <option value="CNPJ">🏢 Pessoa Jurídica (CNPJ)</option>
              </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Botão de busca */}
                <div className="w-full lg:w-auto">
                  <button 
                    type="submit" 
                    className="w-full lg:w-auto px-8 py-3 bg-gradient-to-r from-green-700 to-green-800 text-yellow-400 rounded-xl hover:from-green-800 hover:to-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                    title="Realizar busca" 
                    disabled={buscando}
                  >
                    {buscando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <span>Consultar</span>
                      </>
                    )}
              </button>
                </div>
              </div>
              
              {/* Dica de uso */}
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>Digite apenas os números do documento (CPF: 11 dígitos, CNPJ: 14 dígitos)</span>
              </div>
            </form>
          </div>
        )}
        {buscaMsg && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">{buscaMsg}</p>
              </div>
            </div>
          </div>
        )}
        
        {loteMsg && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">{loteMsg}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Indicador de progresso */}
        {loteLoading && progressoLote.total > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-900">
                Processando busca em lote...
              </span>
              <span className="text-sm text-blue-700">
                {progressoLote.atual} de {progressoLote.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progressoLote.atual / progressoLote.total) * 100}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              {Math.round((progressoLote.atual / progressoLote.total) * 100)}% concluído
            </div>
          </div>
        )}
        {resultado && (
          <div className="mt-8 w-full max-w-none">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Cabeçalho principal */}
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-gray-200 p-8">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-br from-green-800 to-green-900 rounded-xl shadow-lg">
                        <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">{obterNomeCliente(resultado)}</h2>
                        <p className="text-lg text-gray-600">Dados pessoais encontrados</p>
                </div>
                </div>
                    
                    {/* Grid expandido das informações básicas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {obterCPF(resultado) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">CPF</div>
                          <div className="text-2xl font-bold text-gray-900">{obterCPF(resultado)}</div>
              </div>
                      )}
                      {obterRG(resultado) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">RG</div>
                          <div className="text-2xl font-bold text-gray-900">{obterRG(resultado)}</div>
                        </div>
                      )}
                      {(resultado.SEXO || resultado.sexo || resultado.GENERO || resultado.genero) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">Gênero</div>
                          <div className="text-2xl font-bold text-gray-900">{resultado.SEXO || resultado.sexo || resultado.GENERO || resultado.genero}</div>
                        </div>
                      )}
                      {(resultado.DATA_NASCIMENTO || resultado.data_nascimento || resultado.NASCIMENTO || resultado.nascimento) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">Nascimento</div>
                          <div className="text-2xl font-bold text-gray-900">{resultado.DATA_NASCIMENTO || resultado.data_nascimento || resultado.NASCIMENTO || resultado.nascimento}</div>
                        </div>
                      )}
                      {(resultado.IDADE || resultado.idade) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">Idade</div>
                          <div className="text-2xl font-bold text-gray-900">{resultado.IDADE || resultado.idade} anos</div>
                        </div>
                      )}
                      {(resultado.SIGNO || resultado.signo) && (
                        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          <div className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">Signo</div>
                          <div className="text-2xl font-bold text-gray-900">{resultado.SIGNO || resultado.signo}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Informações de filiação expandidas */}
                    {((resultado.NOME_MAE || resultado.nome_mae || resultado.MAE || resultado.mae) || 
                      (resultado.NOME_PAI || resultado.nome_pai || resultado.PAI || resultado.pai)) && (
                      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(resultado.NOME_MAE || resultado.nome_mae || resultado.MAE || resultado.mae) && (
                          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-sm font-bold text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                              </svg>
                              Nome da Mãe
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{resultado.NOME_MAE || resultado.nome_mae || resultado.MAE || resultado.mae}</div>
                          </div>
                        )}
                        {(resultado.NOME_PAI || resultado.nome_pai || resultado.PAI || resultado.pai) && (
                          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="text-sm font-bold text-green-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                              </svg>
                              Nome do Pai
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{resultado.NOME_PAI || resultado.nome_pai || resultado.PAI || resultado.pai}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Status e badges */}
                  <div className="flex flex-row xl:flex-col gap-4 xl:items-end">
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-800 to-green-900 text-yellow-400 font-bold text-lg shadow-lg">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                      </svg>
                  {resultado.STATUS || 'ATIVO'}
                    </div>
                {resultado.PERSONA && (
                      <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-green-900 font-bold text-lg shadow-lg">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="10" r="3"/>
                          <path d="M12 13v2"/>
                        </svg>
                    {resultado.PERSONA}
                      </div>
                )}
              </div>
            </div>
              </div>
              
              {/* Dados setorizados expandidos */}
              <div className="p-8">
                <div className="grid grid-cols-6 gap-4 min-w-0">
                            {setorizarDados(resultado).map(setor => {
                const isAberto = setoresAbertos[setor.nome];
                return (
                  <div key={setor.nome} className="bg-white rounded-xl shadow-md border border-gray-200 min-w-0 overflow-hidden">
                    {/* Cabeçalho clicável */}
                    <div 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSetor(setor.nome)}
                    >
                      {!isAberto ? (
                        /* Estado fechado - Ícone grande centralizado */
                        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
                          <div className="flex items-center justify-center w-16 h-16 mb-4">
                            {React.cloneElement(setor.icone, { 
                              className: "w-16 h-16 text-gray-600" 
                            })}
                          </div>
                          <span className="font-bold text-xl text-gray-800 text-center mb-3 tracking-wide">{setor.nome}</span>
                          {setor.dados.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold shadow-sm">
                                {setor.dados.length} {setor.dados.length === 1 ? 'dado' : 'dados'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Estado aberto - Cabeçalho compacto */
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {setor.icone}
                              <span className="font-bold text-sm text-gray-800 truncate">{setor.nome}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {setor.dados.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                  {setor.dados.length}
                                </span>
                              )}
                              <svg 
                                className="w-5 h-5 text-gray-500 transition-transform duration-300 rotate-180" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth={2} 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo expansível com animação de cortina */}
                    <div className={`transition-all duration-300 ease-in-out ${
                      isAberto ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}>
                      <div className="px-4 pb-4 border-t border-gray-100">
                        {setor.dados.length > 0 ? (
                          <div className="space-y-3 pt-3">
                            {setor.dados.map(d => (
                              <div key={d.label} className="flex flex-col bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                <span className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">{d.label}</span>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-lg font-semibold text-gray-800 flex-1 break-words leading-relaxed">
                                    {typeof d.valor === 'object' ? JSON.stringify(d.valor) : String(d.valor)}
                                  </span>
                                  <CopiarValor valor={typeof d.valor === 'object' ? JSON.stringify(d.valor) : String(d.valor)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center py-4">
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M9 9h6v6H9z" />
                            </svg>
                            <span className="text-[10px]">Nenhum dado encontrado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          </div>
        )}
              {loteResultados.length > 0 && (
          <div className="mt-6 bg-gray-50 border border-yellow-400 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="font-bold text-green-900 text-lg flex items-center gap-2 mb-2">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="10"/><path d="M16 8l-4.5 6L8 11"/></svg>
                Resultados do Lote ({loteResultados.length} {loteResultados.length === 1 ? 'resultado' : 'resultados'})
              </h3>
              {(() => {
                const encontrados = loteResultados.filter(r => !r.erro || r.erro === "Não encontrado").length;
                const naoEncontrados = loteResultados.filter(r => r.erro === "Não encontrado").length;
                const formatoInvalido = loteResultados.filter(r => r.erro && r.erro.includes("Formato inválido")).length;
                const comDados = encontrados - naoEncontrados;
                
                return (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ Encontrados: {comDados}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      ⚠ Não encontrados: {naoEncontrados}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      ✗ Formato inválido: {formatoInvalido}
                    </span>
                  </div>
                );
              })()}
            </div>
            {/* Botões de exportação e retorno */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setModoLote(null);
                  // Limpar resultados anteriores
                  setResultado(null);
                  setBuscaMsg("");
                  setLoteResultados([]);
                  setLoteMsg("");
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 border border-gray-200 bg-transparent text-xs hover:bg-gray-100 transition"
                title="Voltar para pesquisa individual"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Voltar
              </button>
              <button
                onClick={() => exportarExcel()}
                className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 border border-gray-200 bg-transparent text-xs hover:bg-gray-100 transition"
                title="Exportar para Excel"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>
                Excel
              </button>
              <button
                onClick={() => exportarPDF()}
                className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 border border-gray-200 bg-transparent text-xs hover:bg-gray-100 transition"
                title="Exportar para PDF"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M8 4v16"/><path d="M16 4v16"/></svg>
                PDF
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 flex flex-col gap-8">
              {(() => {
                // Agrupar resultados por baseId
                const grupos: { [baseId: string]: any[] } = {};
                const semBase: any[] = [];
                loteResultados.forEach(r => {
                  if (r.baseId) {
                    if (!grupos[r.baseId]) grupos[r.baseId] = [];
                    grupos[r.baseId].push(r);
                  } else {
                    semBase.push(r);
                  }
                });
                // Usar a ordem configurada pelo usuário
                const ordemSetoresFixa = ordemSetores;
                
                // Montar tabelas por base
                const tabelas = Object.entries(grupos).map(([baseId, registros], idx) => {
                  const base = bases.find(b => b.id === baseId);
                  const ordem = Array.isArray(base?.ordemColunas) ? base.ordemColunas : [];
                  const setoresColunas = base?.setoresColunas || {};
                  
                  console.log('Debug - Base:', base?.nome);
                  console.log('Debug - Ordem configurada:', ordemSetores.map(s => s.nome));
                  console.log('Debug - Setores das colunas:', setoresColunas);
                  
                  // Agrupar colunas por setor
                  const colunasPorSetor: { [setor: string]: string[] } = {};
                  const colunasOutros: string[] = [];
                  
                  // Se a base não tem setorização definida, tentar inferir dos registros
                  let setoresColunasUsados = setoresColunas;
                  if (Object.keys(setoresColunas).length === 0 && registros.length > 0) {
                    // Pegar setoresColunas do primeiro registro
                    const primeiroRegistro = registros[0];
                    if (primeiroRegistro.setoresColunas) {
                      setoresColunasUsados = primeiroRegistro.setoresColunas;
                      console.log('Debug - Usando setores do registro:', setoresColunasUsados);
                    }
                  }
                  
                  ordem.forEach((col: string) => {
                    const setor = setoresColunasUsados?.[col];
                    if (setor && ordemSetoresFixa.some(s => s.valor === setor)) {
                      if (!colunasPorSetor[setor]) colunasPorSetor[setor] = [];
                      colunasPorSetor[setor].push(col);
                    } else {
                      colunasOutros.push(col);
                    }
                  });
                  
                  // Montar ordem final das colunas seguindo a ordem fixa, mas só incluindo setores que têm dados
                  const camposTabela: string[] = [];
                  console.log('Debug - Colunas por setor:', colunasPorSetor);
                  ordemSetoresFixa.forEach(setorInfo => {
                    if (colunasPorSetor[setorInfo.valor]) {
                      console.log(`Debug - Adicionando setor ${setorInfo.nome}:`, colunasPorSetor[setorInfo.valor]);
                      camposTabela.push(...colunasPorSetor[setorInfo.valor]);
                    }
                  });
                  console.log('Debug - Campos tabela final:', camposTabela);
                  // Adicionar colunas sem setor ou setor inválido em OUTROS (no final, sem repetir)
                  colunasOutros.forEach(col => {
                    if (!camposTabela.includes(col)) camposTabela.push(col);
                  });
                  // Adicionar campos extras não previstos
                  const camposOcultos = ['baseId', 'setoresColunas', 'tiposColunas', 'chave', '__id', '__name__'];
                  const camposExtras = Array.from(new Set(registros.flatMap(r => Object.keys(r)))).filter(c => !camposTabela.includes(c) && !camposOcultos.includes(c));
                  if (camposExtras.length > 0) camposTabela.push(...camposExtras);
                  return (
                    <div key={baseId+idx} className="mb-8">
                      <div className="font-bold text-green-900 mb-2">Base: {base?.nome || baseId}</div>
                      <table className="w-full text-[11px] text-gray-900 border">
                        <thead>
                          <tr>
                            {camposTabela.map((k) => (
                              <th key={k} className="border px-1 py-1 break-words">{k.replace(/_/g, ' ').toUpperCase()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {registros.map((row, i) => (
                            <tr key={i}>
                              {camposTabela.map((k) => {
                                let valor = row[k];
                                if (valor === undefined || valor === null || valor === '') return <td key={k} className="border px-1 py-1 text-gray-400">-</td>;
                                if (typeof valor === 'object') return <td key={k} className="border px-1 py-1 text-gray-500">{JSON.stringify(valor)}</td>;
                                return <td key={k} className="border px-1 py-1 break-words">{String(valor)}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                });
                // Tabela para registros sem baseId
                if (semBase.length > 0) {
                  const camposOcultos = ['baseId', 'setoresColunas', 'tiposColunas', 'chave', '__id', '__name__'];
                  const todosCampos = Array.from(new Set(semBase.flatMap(r => Object.keys(r)))).filter(c => !camposOcultos.includes(c));
                  return [
                    ...tabelas,
                    <div key="semBase" className="mb-8">
                      <div className="font-bold text-green-900 mb-2">Registros sem base identificada</div>
                      <table className="w-full text-[11px] text-gray-900 border">
                        <thead>
                          <tr>
                            {todosCampos.map((k) => (
                              <th key={k} className="border px-1 py-1 break-words">{k.replace(/_/g, ' ').toUpperCase()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {semBase.map((row, i) => (
                            <tr key={i}>
                              {todosCampos.map((k) => {
                                let valor = row[k];
                                if (valor === undefined || valor === null || valor === '') return <td key={k} className="border px-1 py-1 text-gray-400">-</td>;
                                if (typeof valor === 'object') return <td key={k} className="border px-1 py-1 text-gray-500">{JSON.stringify(valor)}</td>;
                                return <td key={k} className="border px-1 py-1 break-words">{String(valor)}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ];
                }
                return tabelas;
              })()}
            </div>
          </div>
        )}
      </section>
      
      {/* Modal de configuração da ordem dos setores */}
      {showOrdemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[600px] max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configurar Ordem dos Setores</h2>
            <p className="text-gray-700 mb-6">Arraste os setores para definir a ordem que aparecerão na tabela de resultados:</p>
            
            <div className="space-y-2 mb-6">
              {ordemSetores.map((setor, index) => (
                <div key={setor.valor} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      onClick={() => {
                        if (index > 0) {
                          const newOrdem = [...ordemSetores];
                          [newOrdem[index], newOrdem[index - 1]] = [newOrdem[index - 1], newOrdem[index]];
                          setOrdemSetores(newOrdem);
                        }
                      }}
                      disabled={index === 0}
                      title="Mover para cima"
                    >
                      ⬆️
                    </button>
                    <button
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      onClick={() => {
                        if (index < ordemSetores.length - 1) {
                          const newOrdem = [...ordemSetores];
                          [newOrdem[index], newOrdem[index + 1]] = [newOrdem[index + 1], newOrdem[index]];
                          setOrdemSetores(newOrdem);
                        }
                      }}
                      disabled={index === ordemSetores.length - 1}
                      title="Mover para baixo"
                    >
                      ⬇️
                    </button>
                  </div>
                  <span className="text-2xl">{setor.emoji}</span>
                  <span className="font-medium text-gray-900">{setor.nome}</span>
                  <span className="text-sm text-gray-500 ml-auto">#{index + 1}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                onClick={() => {
                  setShowOrdemModal(false);
                  setDadosLoteTemp(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-green-900 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-green-900 transition font-semibold"
                onClick={() => {
                  if (dadosLoteTemp) {
                    setShowOrdemModal(false);
                    setTipoConfirmacao('lote');
                    setDadosParaBuscar(dadosLoteTemp);
                    setCreditosNecessarios(dadosLoteTemp.chaves.length);
                    setConfirmarDesconto(true);
                    setDadosLoteTemp(null);
                  }
                }}
              >
                Confirmar Ordem
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de desconto de créditos */}
      {confirmarDesconto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4 max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmação de Desconto de Créditos</h2>
            <div className="text-gray-800 mb-4">
              {tipoConfirmacao === 'unico' ? (
                <>Essa consulta irá descontar <b>1 crédito</b> do seu saldo. Deseja continuar?</>
              ) : (
                <>A busca em lote irá descontar <b>{creditosNecessarios} créditos</b> do seu saldo. Deseja continuar?</>
              )}
              </div>
            <div className="flex gap-2 justify-end">
              <button className="bg-gray-500 text-white px-4 py-2 rounded font-semibold hover:bg-gray-600 transition" onClick={() => setConfirmarDesconto(false)}>Cancelar</button>
              <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition"
                onClick={async () => {
                  setConfirmarDesconto(false);
                  if (tipoConfirmacao === 'unico') {
                    await executarBusca(dadosParaBuscar);
                  } else if (tipoConfirmacao === 'lote') {
                    await executarBuscaLote(dadosParaBuscar);
                  }
                }}
              >Confirmar</button>
            </div>
        </div>
        </div>
      )}
    </div>
  );
} 