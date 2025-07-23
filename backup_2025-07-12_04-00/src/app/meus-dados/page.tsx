"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, updatePassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "next/navigation";

export default function MeusDadosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [repNovaSenha, setRepNovaSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showRep, setShowRep] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleSenha = async (e: any) => {
    e.preventDefault();
    setMsg(""); setErro("");
    if (novaSenha !== repNovaSenha) {
      setErro("As novas senhas não coincidem.");
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, novaSenha);
        setMsg("Senha atualizada com sucesso!");
        setSenha(""); setNovaSenha(""); setRepNovaSenha("");
      }
    } catch (err: any) {
      setErro("Erro ao atualizar senha. Faça login novamente.");
    }
  };

  if (!user) return <div className="mt-20 text-center">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded shadow p-8 mt-8">
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
        <h1 className="text-xl font-bold text-gray-900">Meus Dados</h1>
      </div>
      <div className="mb-6">
        <div className="mb-2 text-gray-800"><span className="font-medium">E-mail:</span> <span className="font-normal">{user.email}</span></div>
        <div className="text-gray-800"><span className="font-medium">Nome:</span> <span className="font-normal">{user.displayName || "-"}</span></div>
      </div>
      <form onSubmit={handleSenha} className="space-y-4">
        <h2 className="font-semibold mb-2 text-gray-900">Alterar senha</h2>
        <div>
          <label className="block mb-1 text-gray-900">Nova senha</label>
          <div className="relative">
            <input type={showNova ? "text" : "password"} className="w-full border rounded px-3 py-2 text-gray-900" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
            <button type="button" className="absolute right-2 top-2" onClick={() => setShowNova(v => !v)}>{showNova ? "🙈" : "👁️"}</button>
          </div>
        </div>
        <div>
          <label className="block mb-1 text-gray-900">Repetir nova senha</label>
          <div className="relative">
            <input type={showRep ? "text" : "password"} className="w-full border rounded px-3 py-2 text-gray-900" value={repNovaSenha} onChange={e => setRepNovaSenha(e.target.value)} required />
            <button type="button" className="absolute right-2 top-2" onClick={() => setShowRep(v => !v)}>{showRep ? "🙈" : "👁️"}</button>
          </div>
        </div>
        {erro && <div className="text-red-700 text-sm">{erro}</div>}
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
        <button type="submit" className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Atualizar senha</button>
      </form>
    </div>
  );
} 