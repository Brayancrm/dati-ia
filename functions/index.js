const functions = require('firebase-functions');
const admin = require('firebase-admin');
const XLSX = require('xlsx');
const { Storage } = require('@google-cloud/storage');

admin.initializeApp();

// Função para identificar o tipo de dado de uma coluna
const identificarTipoColuna = (valores) => {
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
  
  // Verificar se é telefone
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
const normalizarDado = (valor, tipo, coluna) => {
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
const gerarChaveUnica = (row, tiposColunas) => {
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

// Função para verificar se deve continuar processando
const deveInterromperProcessamento = async (importacaoRef) => {
  try {
    const doc = await importacaoRef.get();
    if (!doc.exists) return true;
    
    const status = doc.data().status;
    return status === 'pausado' || status === 'cancelado';
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return false;
  }
};

exports.processarImportacao = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  
  // Só processar arquivos da pasta 'importacoes/'
  if (!filePath.startsWith('importacoes/')) {
    console.log('Arquivo fora da pasta importacoes, ignorando:', filePath);
    return;
  }

  console.log('Iniciando processamento do arquivo:', filePath);
  
  const db = admin.firestore();
  const bucket = admin.storage().bucket(object.bucket);
  
  try {
    // Encontrar o registro da importação no Firestore
    const importacoesRef = db.collection('importacoes');
    const importacaoQuery = await importacoesRef.where('filePath', '==', filePath).get();
    
    if (importacaoQuery.empty) {
      console.log('Registro de importação não encontrado para:', filePath);
      return;
    }
    
    const importacaoDoc = importacaoQuery.docs[0];
    const importacaoId = importacaoDoc.id;
    const importacaoRef = importacaoDoc.ref;
    
    // Verificar se já foi cancelado antes de iniciar
    if (await deveInterromperProcessamento(importacaoRef)) {
      console.log('Importação foi cancelada/pausada antes de iniciar');
      return;
    }
    
    // Atualizar status para 'processando'
    await importacaoRef.update({
      status: 'processando',
      startedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Baixar o arquivo temporariamente
    const tempFilePath = `/tmp/${object.name.split('/').pop()}`;
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    console.log('Arquivo baixado para:', tempFilePath);
    
    // Ler e processar o arquivo Excel/CSV
    const workbook = XLSX.readFile(tempFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (linhas.length === 0) {
      throw new Error("Arquivo vazio ou sem dados válidos");
    }
    
    // O cabeçalho é a primeira linha
    const cabecalho = linhas[0].map(col => String(col).trim());
    
    // Montar os dados como array de objetos
    const json = linhas.slice(1).map(linha => {
      const obj = {};
      cabecalho.forEach((col, idx) => {
        obj[col] = linha[idx] !== undefined ? linha[idx] : '';
      });
      return obj;
    });
    
    console.log(`Processando ${json.length} registros`);
    
    // Identificar tipos das colunas automaticamente
    const tipos = {};
    for (const coluna of cabecalho) {
      const valores = json.slice(0, 50).map(row => row[coluna]).filter(v => v !== null && v !== undefined && v !== "");
      tipos[coluna] = identificarTipoColuna(valores);
    }
    
    // Atualizar total de registros
    await importacaoRef.update({
      total: json.length,
      progresso: 0
    });
    
    // Processar em lotes de 450 registros (deixar margem de segurança)
    const batchSize = 450;
    let processados = 0;
    let sucessos = 0;
    let duplicados = 0;
    
    for (let i = 0; i < json.length; i += batchSize) {
      // ✅ VERIFICAR STATUS ANTES DE CADA LOTE
      if (await deveInterromperProcessamento(importacaoRef)) {
        console.log(`Importação interrompida no lote ${i}/${json.length}`);
        
        // Buscar o status atual para determinar a ação
        const docAtual = await importacaoRef.get();
        const statusAtual = docAtual.data().status;
        
        if (statusAtual === 'pausado') {
          await importacaoRef.update({
            pausedAt: admin.firestore.FieldValue.serverTimestamp(),
            progresso: processados,
            sucessos,
            duplicados
          });
          console.log('Importação pausada com sucesso');
        } else if (statusAtual === 'cancelado') {
          await importacaoRef.update({
            canceledAt: admin.firestore.FieldValue.serverTimestamp(),
            finishedAt: admin.firestore.FieldValue.serverTimestamp(),
            progresso: processados,
            sucessos,
            duplicados,
            erro: 'Importação cancelada pelo usuário'
          });
          console.log('Importação cancelada com sucesso');
        }
        
        return; // Sair da função
      }
      
      const lote = json.slice(i, i + batchSize);
      const batch = db.batch();
      
      for (const row of lote) {
        try {
          // Normalizar dados
          const dadosNormalizados = {};
          for (const [coluna, valor] of Object.entries(row)) {
            const tipo = tipos[coluna] || "texto";
            dadosNormalizados[coluna] = normalizarDado(valor, tipo, coluna);
          }
          
          // Gerar chave única
          const chave = gerarChaveUnica(dadosNormalizados, tipos);
          
          if (!chave || chave === "undefined_undefined_undefined") {
            processados++;
            continue;
          }
          
          // Verificar se já existe (buscar por chave)
          const existeQuery = await db.collection("base_clientes").where("chave", "==", chave).limit(1).get();
          
          if (!existeQuery.empty) {
            duplicados++;
            processados++;
            continue;
          }
          
          // Adicionar ao lote
          const novoDocRef = db.collection("base_clientes").doc();
          batch.set(novoDocRef, {
            ...dadosNormalizados,
            chave,
            importacaoId,
            tiposColunas: tipos,
            importadoEm: admin.firestore.FieldValue.serverTimestamp()
          });
          
          sucessos++;
          processados++;
          
        } catch (error) {
          console.error("Erro ao processar linha:", error);
          processados++;
        }
      }
      
      // Executar o lote
      await batch.commit();
      
      // Atualizar progresso
      await importacaoRef.update({
        progresso: processados,
        sucessos,
        duplicados
      });
      
      console.log(`Lote processado: ${processados}/${json.length} registros`);
    }
    
    // ✅ VERIFICAÇÃO FINAL ANTES DE CONCLUIR
    if (await deveInterromperProcessamento(importacaoRef)) {
      console.log('Importação foi interrompida durante o processamento final');
      return;
    }
    
    // Finalizar importação
    await importacaoRef.update({
      status: 'concluida',
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      sucessos,
      duplicados,
      total: json.length,
      progresso: processados
    });
    
    console.log(`Importação concluída: ${sucessos} sucessos, ${duplicados} duplicados`);
    
  } catch (error) {
    console.error('Erro na importação:', error);
    
    // Atualizar status para erro
    const importacoesRef = db.collection('importacoes');
    const importacaoQuery = await importacoesRef.where('filePath', '==', filePath).get();
    
    if (!importacaoQuery.empty) {
      await importacaoQuery.docs[0].ref.update({
        status: 'erro',
        erro: error.message,
        finishedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
});

// ✅ NOVA FUNÇÃO PARA RETOMAR IMPORTAÇÕES PAUSADAS
exports.retomarImportacao = functions.firestore.document('importacoes/{importacaoId}')
  .onUpdate(async (change, context) => {
    const antes = change.before.data();
    const depois = change.after.data();
    
    // Se mudou de 'pausado' para 'processando', simular retomada
    if (antes.status === 'pausado' && depois.status === 'processando') {
      console.log(`Retomando importação: ${context.params.importacaoId}`);
      
      // Aqui você poderia implementar a lógica para retomar o processamento
      // Por agora, vamos apenas atualizar o timestamp
      await change.after.ref.update({
        resumedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Importação marcada para retomada');
    }
  }); 