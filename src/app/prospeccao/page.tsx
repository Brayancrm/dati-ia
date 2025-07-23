"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";

// Tipos de benefícios
const TIPOS_BENEFICIO = [
  { id: "inss", nome: "INSS", cor: "bg-green-100 text-green-800" },
  { id: "siape", nome: "SIAPE", cor: "bg-blue-100 text-blue-800" },
  { id: "geral", nome: "GERAL", cor: "bg-gray-100 text-gray-800" }
];

// Estados brasileiros
const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Espécies (códigos de benefícios)
const ESPECIES = Array.from({ length: 99 }, (_, i) => String(i + 1).padStart(2, '0'));

// Campos de prospecção disponíveis
const CAMPOS_PROSPECCAO = [
  { id: "origem", nome: "Origem da Base", descricao: "INSS, SIAPE, OUTROS" },
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

interface FiltroProspeccao {
  // Origem da base
  origem: string[];
  
  // Tipo de benefício
  tipoBeneficio: string[];
  
  // Renda
  rendaMin: number | null;
  rendaMax: number | null;
  rendaIgual: number | null;
  
  // Margem
  margemMin: number | null;
  margemMax: number | null;
  margemIgual: number | null;
  
  // Espécie
  especies: string[];
  
  // Estados
  estados: string[];
  
  // Municípios
  municipios: string[];
  
  // Idade
  idadeMin: number | null;
  idadeMax: number | null;
  idadeIgual: number | null;
  
  // Data de nascimento
  dataNascimentoMin: string;
  dataNascimentoMax: string;
  dataNascimentoIgual: string;
  
  // Ano de nascimento
  anoNascimentoMin: number | null;
  anoNascimentoMax: number | null;
  anoNascimentoIgual: number | null;
  
  // Sexo
  sexo: string;
  
  // Representante legal
  representanteLegal: string;
  
  // Tipo de conta
  tipoConta: string;
  
  // Banco
  bancoIgual: string;
  bancoDiferente: string;
  
  // Cartão pessoal (RMC)
  cartaoPessoalRMC: string;
  
  // Cartão benefício (RCC)
  cartaoBeneficioRCC: string;
  
  // Bloqueado para empréstimo
  bloqueadoEmprestimo: string;
  
  // Data da concessão
  dataConcessaoMin: string;
  dataConcessaoMax: string;
  dataConcessaoIgual: string;
  
  // Empréstimos
  emprestimos: string[];
  
  // Desconto associativo
  descontoAssociativo: string;
  
  // Margem RMC
  margemRMCMin: number | null;
  margemRMCMax: number | null;
  margemRMCIgual: number | null;
  
  // Margem RCC
  margemRCCMin: number | null;
  margemRCCMax: number | null;
  margemRCCIgual: number | null;
  
  // Quantidade de linhas (empréstimos)
  quantidadeLinhasMin: number | null;
  quantidadeLinhasMax: number | null;
  quantidadeLinhasIgual: number | null;
  
  // Prazo
  prazoMin: number | null;
  prazoMax: number | null;
  prazoIgual: number | null;
  
  // Banco emprestado
  bancoEmprestadoIgual: string;
  bancoEmprestadoDiferente: string;
  
  // Valor da parcela
  valorParcelaMin: number | null;
  valorParcelaMax: number | null;
  valorParcelaIgual: number | null;
  
  // Parcelas quitadas
  parcelasQuitadasMin: number | null;
  parcelasQuitadasMax: number | null;
  parcelasQuitadasIgual: number | null;
  
  // Parcelas restantes
  parcelasRestantesMin: number | null;
  parcelasRestantesMax: number | null;
  parcelasRestantesIgual: number | null;
  
  // Taxa contrato
  taxaContratoMin: number | null;
  taxaContratoMax: number | null;
  taxaContratoIgual: number | null;
  
  // Data da averbação
  dataAverbacaoMin: string;
  dataAverbacaoMax: string;
  dataAverbacaoIgual: string;
}

interface PerfilProspeccao {
  id: string;
  nome: string;
  filtros: FiltroProspeccao;
  criadoEm: Date;
  valorPorLinha: number;
}

export default function ProspeccaoPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-8 mt-16 flex flex-col items-center justify-center">
      <div className="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 10-8 0v4m8 0a4 4 0 018 0v4m-8 0v4m0 0a4 4 0 01-8 0v-4m8 4a4 4 0 008 0v-4" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Prospecção</h1>
      <p className="text-gray-700 text-center max-w-md mb-2">A funcionalidade de prospecção estará disponível futuramente nesta área. Aguarde novidades!</p>
      <span className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">Em breve</span>
    </div>
  );
} 