"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import * as XLSX from "xlsx";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

interface UserMenuProps {
  onLoginClick?: () => void;
  onCreateAccountClick?: () => void;
}

export default function UserMenu({ onLoginClick, onCreateAccountClick }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [ip, setIp] = useState("");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [notificacoesPendentes, setNotificacoesPendentes] = useState(0);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    fetch("https://api.ipify.org?format=json").then(res => res.json()).then(data => setIp(data.ip));
  }, []);

  // Carregar notificações pendentes para o master
  useEffect(() => {
    const carregarNotificacoesPendentes = () => {
      try {
        const notificacoesSalvas = localStorage.getItem('notificacoes_pagamentos');
        if (notificacoesSalvas) {
          const notificacoes = JSON.parse(notificacoesSalvas);
          const pendentes = notificacoes.filter((n: any) => 
            n.status === "CONFIRMADO" || 
            (n.tipo === "NOVA_SOLICITACAO_CONTA" && n.status === "PENDENTE")
          ).length;
          setNotificacoesPendentes(pendentes);
        }
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      }
    };

    carregarNotificacoesPendentes();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(carregarNotificacoesPendentes, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const isMaster = user?.email && user.email.toLowerCase() === "brayan@agilisvertex.com.br";

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
      for (const row of json) {
        await addDoc(collection(db, "base_clientes"), row);
      }
      setUploadMsg("Base importada com sucesso!");
    } catch (err: any) {
      setUploadMsg("Erro ao importar: " + err.message);
    }
    setUploading(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {!user ? (
        <div className="flex items-center gap-4">
          <button 
            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-green-900 font-bold rounded-xl hover:from-yellow-300 hover:to-yellow-500 transition-all shadow-lg"
            onClick={onLoginClick || (() => router.push("/"))}
          >
            Login
          </button>
          <button 
            className="px-6 py-2 border-2 border-yellow-400 text-yellow-400 font-bold rounded-xl hover:bg-yellow-400 hover:text-green-900 transition-all"
            onClick={onCreateAccountClick || (() => router.push("/"))}
          >
            Criar Conta
          </button>
        </div>
      ) : (
        <>
          <span className="font-semibold uppercase text-white mr-2">{user.displayName || user.email}</span>
          <button
            className="p-2 rounded-full hover:bg-yellow-100 transition"
            onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
            aria-label="Abrir menu do usuário"
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </>
      )}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-50">
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/meus-dados"); setOpen(false);}}>Meus dados</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/prospeccao"); setOpen(false);}}>Prospecção</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/relatorios"); setOpen(false);}}>Relatórios</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/recarga"); setOpen(false);}}>Recarga</button>
          {isMaster && <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/bases"); setOpen(false);}}>Bases</button>}
          {isMaster && <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/importacoes"); setOpen(false);}}>Status das Importações</button>}
          {isMaster && <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium" onClick={() => {router.push("/usuarios"); setOpen(false);}}>Usuários</button>}
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-gray-900 font-medium relative" onClick={() => {router.push("/notificacoes"); setOpen(false);}}>
              Notificações
              {notificacoesPendentes > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificacoesPendentes}
                </span>
              )}
            </button>
          <div className="border-t my-1" />
          <div className="px-4 py-2 text-xs text-gray-700">Meu IP: {ip}</div>
          <button className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-red-600 font-semibold" onClick={handleLogout}>Sair</button>
        </div>
      )}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Importar Base de Excel</h2>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="mb-2" />
            {uploading && <div className="text-gray-900">Importando...</div>}
            {uploadMsg && <div className="text-green-700">{uploadMsg}</div>}
            <button className="text-gray-700 mt-2" onClick={() => setShowUpload(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
} 