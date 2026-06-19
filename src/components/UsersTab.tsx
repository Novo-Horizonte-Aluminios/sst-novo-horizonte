import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Key, Users, AlertCircle, CheckCircle, Pencil, X, Phone, Mail, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
  whatsapp?: string;
  created_at?: string;
}

interface UsersTabProps {
  currentUser: { id: string; username: string; name: string; role: string };
}

const ROLE_COLORS: Record<string, string> = {
  Admin:       'bg-blue-50 text-blue-600 border border-blue-100',
  SST:         'bg-emerald-50 text-emerald-600 border border-emerald-100',
  GestorRH:    'bg-pink-50 text-pink-600 border border-pink-100',
  Almoxarife:  'bg-amber-50 text-amber-600 border border-amber-100',
  Gestor:      'bg-violet-50 text-violet-600 border border-violet-100',
  Colaborador: 'bg-slate-100 text-slate-600 border border-slate-200',
};


export default function UsersTab({ currentUser }: UsersTabProps) {
  const isAdmin = currentUser.role === 'Admin';

  // ─── State ────────────────────────────────────────────────────────────────
  const [users, setUsers]         = useState<SystemUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New user form
  const [newName, setNewName]         = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole]         = useState('SST');
  const [newEmail, setNewEmail]       = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');

  // Edit modal
  const [editUser, setEditUser]           = useState<SystemUser | null>(null);
  const [editName, setEditName]           = useState('');
  const [editEmail, setEditEmail]         = useState('');
  const [editWhatsapp, setEditWhatsapp]   = useState('');
  const [editRole, setEditRole]           = useState('');
  const [editPassword, setEditPassword]   = useState('');

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else          { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 5000);
  };

  // ─── Create User ─────────────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim() || !newRole) {
      return notify('Nome, login, senha e perfil são obrigatórios.', true);
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, name: newName, role: newRole, email: newEmail, whatsapp: newWhatsapp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário.');
      notify(`Usuário "${newName}" criado com sucesso!`);
      setNewName(''); setNewUsername(''); setNewPassword(''); setNewRole('SST'); setNewEmail(''); setNewWhatsapp('');
      fetchUsers();
    } catch (err: any) {
      notify(err.message || 'Erro ao registrar usuário.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete User ──────────────────────────────────────────────────────────
  const handleDeleteUser = async (id: string, userName: string) => {
    if (id === currentUser.id) return notify('Não é possível excluir a sua própria conta ativa.', true);
    if (id === 'u_admin')      return notify('Não é possível excluir o Administrador Principal.', true);
    const confirmResult = await Swal.fire({
      title: 'Remover usuário?',
      text: `Remover o usuário "${userName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir.');
      notify('Usuário removido com sucesso.');
      fetchUsers();
    } catch (err: any) {
      notify(err.message || 'Erro ao remover.', true);
    }
  };

  // ─── Open Edit Modal ──────────────────────────────────────────────────────
  const openEdit = (u: SystemUser) => {
    // Permission check: admin edits all, others only themselves
    if (!isAdmin && u.id !== currentUser.id) return;
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email || '');
    setEditWhatsapp(u.whatsapp || '');
    setEditRole(u.role);
    setEditPassword('');
  };

  // ─── Save Edit ────────────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          whatsapp: editWhatsapp,
          role: editRole,
          password: editPassword || undefined,
          requesterId: currentUser.id,
          requesterRole: currentUser.role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      notify('Usuário atualizado com sucesso!');
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      notify(err.message || 'Erro ao atualizar.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-safety-green" />
          Usuários do Sistema
        </h1>
        <p className="text-xs text-slate-500">
          {isAdmin
            ? 'Gerenciamento completo de credenciais e permissões. Você pode editar e remover qualquer usuário.'
            : 'Você pode visualizar a equipe e editar apenas o seu próprio perfil.'}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-xs rounded-lg flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs rounded-lg flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Create User Form (Admin only) ── */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-safety-green" />
              Cadastrar Novo Usuário
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Dr. Pedro Silva"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* Login */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Login (Username) *</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                    placeholder="Ex: pedrosilva"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Senha Inicial *</label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">E-mail (recuperação)</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">WhatsApp (recuperação)</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="tel" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400" />
                </div>
              </div>

              {/* Perfil */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Perfil / Nível *</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 px-2.5 text-xs outline-none transition-all">
                  <option value="SST">Técnico de Segurança (SST)</option>
                  <option value="Admin">Administrador do Sistema</option>
                  <option value="GestorRH">Gestor de RH</option>
                  <option value="Almoxarife">Almoxarife (EPIs)</option>
                  <option value="Gestor">Gestor Geral</option>
                  <option value="Colaborador">Trabalhador / Operador</option>
                </select>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-safety-green hover:bg-safety-green/90 text-white rounded-lg py-2 text-xs font-bold transition-all shadow-sm flex justify-center items-center gap-1 cursor-pointer">
                {submitting
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Cadastrar Usuário'}
              </button>
            </form>
          </div>
        )}

        {/* ── Users Table ── */}
        <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 ${isAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-safety-green" />
            Usuários Cadastrados ({users.length})
          </h2>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-safety-green border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-slate-400 font-semibold">Carregando usuários...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase text-left">
                    <th className="pb-2 font-bold">Nome</th>
                    <th className="pb-2 font-bold">Username</th>
                    <th className="pb-2 font-bold">Nível</th>
                    <th className="pb-2 font-bold">E-mail</th>
                    <th className="pb-2 font-bold">WhatsApp</th>
                    <th className="pb-2 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const canEdit   = isAdmin || u.id === currentUser.id;
                    const canDelete = isAdmin && u.id !== 'u_admin' && u.id !== currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-[10px] shrink-0">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="leading-tight">{u.name}</p>
                              {u.id === currentUser.id && (
                                <span className="text-[8px] text-safety-green font-mono uppercase">• você</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 font-mono text-slate-500">{u.username}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${ROLE_COLORS[u.role] || ROLE_COLORS['Colaborador']}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono text-[10px]">
                          {u.email || <span className="italic text-[9px]">—</span>}
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono text-[10px]">
                          {u.whatsapp || <span className="italic text-[9px]">—</span>}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button onClick={() => openEdit(u)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete ? (
                              <button onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Remover">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : u.id === 'u_admin' ? (
                              <span className="text-[9px] text-slate-400 italic font-mono">Protegido</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-safety-green" />
                  Editar Usuário
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">@{editUser.username}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none" />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  <Mail className="inline w-3 h-3 mr-1" />E-mail (recuperação de senha)
                </label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 px-3 text-xs outline-none" />
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  <Phone className="inline w-3 h-3 mr-1" />WhatsApp (recuperação de senha)
                </label>
                <input type="tel" value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 px-3 text-xs outline-none" />
              </div>

              {/* Perfil (somente admin pode alterar) */}
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                    <Shield className="inline w-3 h-3 mr-1" />Perfil / Nível
                  </label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value)}
                    disabled={editUser.id === 'u_admin'}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 px-2.5 text-xs outline-none disabled:opacity-50">
                    <option value="SST">Técnico de Segurança (SST)</option>
                    <option value="Admin">Administrador do Sistema</option>
                    <option value="GestorRH">Gestor de RH</option>
                    <option value="Almoxarife">Almoxarife (EPIs)</option>
                    <option value="Gestor">Gestor Geral</option>
                    <option value="Colaborador">Trabalhador / Operador</option>
                  </select>
                </div>
              )}

              {/* Nova Senha */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  <Lock className="inline w-3 h-3 mr-1" />Nova Senha <span className="text-slate-400 normal-case">(deixe em branco para manter)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 4 caracteres)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditUser(null)}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-safety-green hover:bg-safety-green/90 text-white rounded-lg py-2 text-xs font-bold transition-all flex justify-center items-center gap-1">
                  {submitting
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
