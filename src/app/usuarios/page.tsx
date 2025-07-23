"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebaseConfig";
import { collection, getDocs, updateDoc, doc, addDoc, Timestamp, query, where } from "firebase/firestore";
import { getAuth, updatePassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UsuariosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", creditos: 0, senha: "" });
  const [editUser, setEditUser] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showCred, setShowCred] = useState(false);
  const [credValue, setCredValue] = useState(0);
  const [showSenha, setShowSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [showDelete, setShowDelete] = useState(false);
  const [erro, setErro] = useState("");
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [showSolicitacoes, setShowSolicitacoes] = useState(false);
  const [processandoSolicitacao, setProcessandoSolicitacao] = useState(false);

  useEffect(() => {
    onAuthStateChanged(require("@/firebaseConfig").auth, setUser);
  }, []);

  useEffect(() => {
    if (user && user.email.toLowerCase() === "brayan@agilisvertex.com.br") {
      setErro("");
      getDocs(collection(db, "usuarios")).then(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsuarios(docs);
        setLoading(false);
        if (docs.length === 0) setErro("Nenhum usuário encontrado na coleção Firestore. Clique abaixo para criar o master.");
      }).catch(e => {
        setErro("Erro ao buscar usuários: " + e.message);
        setLoading(false);
      });
    }
  }, [user, showModal]);

  // Carregar solicitações pendentes
  useEffect(() => {
    if (user && user.email.toLowerCase() === "brayan@agilisvertex.com.br") {
      const carregarSolicitacoes = async () => {
        try {
          const solicitacoesSnap = await getDocs(
            query(collection(db, "solicitacoes_conta"), where("status", "==", "pendente"))
          );
          const solicitacoesData = solicitacoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSolicitacoes(solicitacoesData);
        } catch (error) {
          console.error("Erro ao carregar solicitações:", error);
        }
      };
      carregarSolicitacoes();
    }
  }, [user]);

  // Função para criar usuário master na coleção caso esteja vazia
  const criarMaster = async () => {
    setErro("");
    setLoading(true);
    try {
      await addDoc(collection(db, "usuarios"), {
        nome: "BRAYAN ANDRADE",
        email: "Brayan@agilisvertex.com.br",
        creditos: 0,
        status: true,
        cadastro: Timestamp.now(),
      });
      setErro("");
      setLoading(false);
      window.location.reload();
    } catch (e: any) {
      setErro("Erro ao criar master: " + e.message);
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: boolean) => {
    await updateDoc(doc(db, "usuarios", id), { status: !status });
    setUsuarios(us => us.map(u => u.id === id ? { ...u, status: !status } : u));
  };

  const handleNovo = async (e: any) => {
    e.preventDefault();
    setErro("");
    try {
      // Cria no Authentication
      await createUserWithEmailAndPassword(getAuth(), novo.email, novo.senha);
      // Cria no Firestore
    await addDoc(collection(db, "usuarios"), {
      nome: novo.nome,
      email: novo.email,
      creditos: Number(novo.creditos),
      status: true,
      cadastro: Timestamp.now(),
    });
    setShowModal(false);
    setNovo({ nome: "", email: "", creditos: 0, senha: "" });
    } catch (e: any) {
      setErro("Erro ao criar usuário: " + (e.message || e.code));
    }
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    setErro("");
    try {
      // Verificar se o email já existe em outro usuário
      const emailAnterior = usuarios.find(u => u.id === editUser.id)?.email;
      const emailJaExiste = usuarios.some(u => u.id !== editUser.id && u.email.toLowerCase() === editUser.email.toLowerCase());
      
      if (emailJaExiste) {
        setErro("Este email já está sendo usado por outro usuário.");
        return;
      }

      // Atualizar dados no Firestore
      await updateDoc(doc(db, "usuarios", editUser.id), {
        nome: editUser.nome,
        email: editUser.email,
        creditos: Number(editUser.creditos),
        status: editUser.status,
      });

      // Se o email foi alterado, log da alteração
      if (emailAnterior && emailAnterior !== editUser.email) {
        console.log(`✅ Email do usuário ${editUser.nome} alterado de ${emailAnterior} para ${editUser.email}`);
        alert(`Email alterado com sucesso!\n\nDe: ${emailAnterior}\nPara: ${editUser.email}\n\n⚠️ O usuário precisará fazer login com o novo email.`);
      }

      setShowEdit(false);
      setEditUser(null);
      setUsuarios(us => us.map(u => u.id === editUser.id ? { 
        ...u, 
        nome: editUser.nome, 
        email: editUser.email,
        creditos: Number(editUser.creditos), 
        status: editUser.status 
      } : u));
    } catch (error: any) {
      setErro("Erro ao editar usuário: " + error.message);
    }
  };

  const handleCred = async (e: any) => {
    e.preventDefault();
    await updateDoc(doc(db, "usuarios", editUser.id), {
      creditos: Number(editUser.creditos) + Number(credValue),
    });
    setShowCred(false);
    setCredValue(0);
    setUsuarios(us => us.map(u => u.id === editUser.id ? { ...u, creditos: Number(u.creditos) + Number(credValue) } : u));
  };

  // Redefinição de senha automática
  const handleSenha = async (e: any) => {
    e.preventDefault();
    await sendPasswordResetEmail(getAuth(), editUser.email);
    setShowSenha(false);
    setNovaSenha("");
    alert("E-mail de redefinição de senha enviado para " + editUser.email);
  };

  // Exclusão de usuário
  const handleDelete = async () => {
    await updateDoc(doc(db, "usuarios", editUser.id), { status: false }); // Soft delete
    setShowDelete(false);
    setShowEdit(false);
    setUsuarios(us => us.filter(u => u.id !== editUser.id));
  };

  // Aprovar solicitação
  const aprovarSolicitacao = async (solicitacao: any) => {
    setProcessandoSolicitacao(true);
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(getAuth(), solicitacao.email, solicitacao.senha);
      
      // Criar registro na coleção usuarios
      await addDoc(collection(db, "usuarios"), {
        nome: solicitacao.nome,
        email: solicitacao.email,
        documento: solicitacao.documento,
        tipoDocumento: solicitacao.tipoDocumento,
        creditos: 10, // Créditos iniciais
        status: true,
        dataCriacao: new Date(),
        criadoPor: user.email
      });
      
      // Atualizar status da solicitação
      await updateDoc(doc(db, "solicitacoes_conta", solicitacao.id), {
        status: "aprovada",
        aprovadoPor: user.email,
        dataAprovacao: new Date()
      });
      
      // Remover da lista local
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitacao.id));
      
      alert(`Usuário ${solicitacao.nome} aprovado com sucesso!`);
      
      // Recarregar lista de usuários
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error: any) {
      console.error("Erro ao aprovar solicitação:", error);
      alert("Erro ao aprovar solicitação: " + error.message);
    } finally {
      setProcessandoSolicitacao(false);
    }
  };

  // Rejeitar solicitação
  const rejeitarSolicitacao = async (solicitacao: any) => {
    setProcessandoSolicitacao(true);
    try {
      await updateDoc(doc(db, "solicitacoes_conta", solicitacao.id), {
        status: "rejeitada",
        aprovadoPor: user.email,
        dataAprovacao: new Date()
      });
      
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitacao.id));
      alert(`Solicitação de ${solicitacao.nome} rejeitada.`);
    } catch (error: any) {
      console.error("Erro ao rejeitar solicitação:", error);
      alert("Erro ao rejeitar solicitação: " + error.message);
    } finally {
      setProcessandoSolicitacao(false);
    }
  };

  if (!user || user.email.toLowerCase() !== "brayan@agilisvertex.com.br") return <div className="mt-20 text-center text-red-600">Acesso restrito ao master.</div>;
  if (loading) return <div className="mt-20 text-center text-gray-900">Carregando usuários...</div>;
  if (erro) return <div className="mt-20 text-center text-red-600 flex flex-col gap-4">{erro}<button onClick={criarMaster} className="mx-auto bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Criar usuário master</button></div>;

  // Busca e filtro
  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(usuariosFiltrados.length / PAGE_SIZE);
  const usuariosPaginados = usuariosFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex gap-2 items-center">
          <input className="border rounded px-3 py-2 text-gray-900" placeholder="Buscar por nome ou e-mail" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition" onClick={() => setShowModal(true)}>Novo Usuário</button>
        </div>
      </div>
      {/* Botões de navegação */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold transition ${
            !showSolicitacoes 
              ? 'bg-green-900 text-yellow-400' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setShowSolicitacoes(false)}
        >
          Usuários Ativos ({usuarios.length})
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${
            showSolicitacoes 
              ? 'bg-green-900 text-yellow-400' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setShowSolicitacoes(true)}
        >
          Solicitações Pendentes ({solicitacoes.length})
        </button>
      </div>

      {showSolicitacoes ? (
        /* Tabela de Solicitações */
        <div className="bg-white rounded shadow">
          <h2 className="text-lg font-bold p-4 border-b text-gray-900">Solicitações de Conta Pendentes</h2>
          {solicitacoes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma solicitação pendente no momento.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Data Solicitação</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id} className="border-t text-gray-900">
                    <td className="p-3 font-medium">{solicitacao.nome}</td>
                    <td className="p-3">{solicitacao.email}</td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {solicitacao.tipoDocumento}
                      </span>
                      <br />
                      {solicitacao.documento}
                    </td>
                    <td className="p-3 text-sm">
                      {solicitacao.dataSolicitacao?.toDate?.()?.toLocaleString('pt-BR') || 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition disabled:opacity-50"
                          onClick={() => aprovarSolicitacao(solicitacao)}
                          disabled={processandoSolicitacao}
                        >
                          Aprovar
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition disabled:opacity-50"
                          onClick={() => rejeitarSolicitacao(solicitacao)}
                          disabled={processandoSolicitacao}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Tabela de usuários existente */
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="p-2">Nome</th>
              <th className="p-2">E-mail</th>
              <th className="p-2">Créditos</th>
              <th className="p-2">Cadastro</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.map((u, i) => (
              <tr key={i} className="border-t text-gray-900">
                <td className="p-2">{u.nome}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.creditos}</td>
                <td className="p-2">{u.cadastro?.toDate?.().toLocaleDateString() || "-"}</td>
                <td className="p-2"><input type="checkbox" checked={u.status} onChange={() => handleStatus(u.id, u.status)} className="accent-green-900" /></td>
                <td className="p-2 flex gap-2">
                  <button className="text-green-900 hover:underline" onClick={() => { setEditUser(u); setShowEdit(true); setErro(""); }}>✏️</button>
                  <button className="text-yellow-600 hover:underline" onClick={() => { setEditUser(u); setShowCred(true); }}>Créditos</button>
                  <button className="text-blue-700 hover:underline" onClick={() => { setEditUser(u); setShowSenha(true); }}>Senha</button>
                  <button className="text-red-600 hover:underline" onClick={() => { setEditUser(u); setShowDelete(true); }}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Paginação */}
      <div className="flex justify-end gap-2 mt-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border text-gray-900 disabled:opacity-50">Anterior</button>
        <span className="px-2 text-gray-900">Página {page} de {totalPages || 1}</span>
        <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border text-gray-900 disabled:opacity-50">Próxima</button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleNovo} className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Novo Usuário</h2>
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Nome" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} required />
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="E-mail" value={novo.email} onChange={e => setNovo({ ...novo, email: e.target.value })} required />
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Créditos" type="number" value={novo.creditos} onChange={e => setNovo({ ...novo, creditos: Number(e.target.value) })} required />
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Senha inicial" type="password" value={novo.senha} onChange={e => setNovo({ ...novo, senha: e.target.value })} required minLength={6} />
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Salvar</button>
            <button type="button" className="text-gray-700 mt-2" onClick={() => setShowModal(false)}>Cancelar</button>
          </form>
        </div>
      )}
      {showEdit && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleEdit} className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Editar Usuário</h2>
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Nome" value={editUser.nome} onChange={e => setEditUser({ ...editUser, nome: e.target.value })} required />
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="E-mail" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} required />
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Créditos" type="number" value={editUser.creditos} onChange={e => setEditUser({ ...editUser, creditos: Number(e.target.value) })} required />
            <label className="flex items-center gap-2 text-gray-900"><input type="checkbox" checked={editUser.status} onChange={e => setEditUser({ ...editUser, status: e.target.checked })} /> Ativo</label>
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Salvar</button>
            <button type="button" className="text-gray-700 mt-2" onClick={() => { setShowEdit(false); setErro(""); }}>Cancelar</button>
          </form>
        </div>
      )}
      {showCred && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleCred} className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ajustar Créditos</h2>
            <div className="mb-2 text-gray-900">Créditos atuais: <b>{editUser.creditos}</b></div>
            <input className="border rounded px-3 py-2 text-gray-900" placeholder="Valor a adicionar/remover" type="number" value={credValue} onChange={e => setCredValue(Number(e.target.value))} required />
            <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Salvar</button>
            <button type="button" className="text-gray-700 mt-2" onClick={() => setShowCred(false)}>Cancelar</button>
          </form>
        </div>
      )}
      {showSenha && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSenha} className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Redefinir Senha</h2>
            <div className="mb-2 text-gray-900">Será enviado um e-mail de redefinição para <b>{editUser.email}</b></div>
            <button className="bg-green-900 text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-green-900 transition">Enviar e-mail</button>
            <button type="button" className="text-gray-700 mt-2" onClick={() => setShowSenha(false)}>Cancelar</button>
          </form>
        </div>
      )}
      {showDelete && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Excluir Usuário</h2>
            <div className="mb-2 text-gray-900">Tem certeza que deseja excluir <b>{editUser.nome}</b>?</div>
            <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition" onClick={handleDelete}>Excluir</button>
            <button className="text-gray-700 mt-2" onClick={() => setShowDelete(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
} 