import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Key, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: string;
  created_at?: string;
}

interface UsersTabProps {
  currentUser: { id: string; username: string; name: string; role: string };
}

export default function UsersTab({ currentUser }: UsersTabProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('SST');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim() || !name.trim() || !role) {
      setError('Todos os campos do formulário são obrigatórios.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário.');
      }

      setSuccess(`Usuário "${name}" criado com sucesso!`);
      setUsername('');
      setPassword('');
      setName('');
      setRole('SST');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (id === currentUser.id) {
      setError('Não é possível excluir a sua própria conta ativa.');
      return;
    }
    if (id === 'u_admin') {
      setError('Não é possível excluir o Administrador Principal do sistema.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${userName}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário.');
      }

      setSuccess('Usuário removido com sucesso.');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover o usuário.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-safety-green" />
          Usuários do Sistema
        </h1>
        <p className="text-xs text-slate-500">
          Gerenciamento de credenciais e permissões para técnicos, gestores e operadores do SESMT Novo Horizonte.
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
        {/* User Creation Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-safety-green" />
            Cadastrar Novo Usuário
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Nome Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dr. Pedro Silva"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Login (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: pedrosilva"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Senha Inicial</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <Key className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina a senha"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Perfil / Nível</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-safety-green/80 rounded-lg py-1.5 px-2.5 text-xs outline-none transition-all"
              >
                <option value="SST">Técnico de Segurança (SST)</option>
                <option value="Admin">Administrador do Sistema</option>
                <option value="Almoxarife">Almoxarife (EPIs)</option>
                <option value="Gestor">Gestor Geral</option>
                <option value="Colaborador">Trabalhador / Operador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-safety-green hover:bg-safety-green/90 text-white rounded-lg py-2 text-xs font-bold transition-all shadow-sm flex justify-center items-center gap-1 cursor-pointer"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Cadastrar Usuário'
              )}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm md:col-span-2 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-safety-green" />
            Usuários Cadastrados ({users.length})
          </h2>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-safety-green border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400 font-semibold">Carregando usuários...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase text-left">
                    <th className="pb-2 font-bold">Nome</th>
                    <th className="pb-2 font-bold">Username</th>
                    <th className="pb-2 font-bold">Nível / Role</th>
                    <th className="pb-2 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-[10px]">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-500">{u.username}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                          u.role === 'Admin' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                            : u.role === 'SST'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {u.id !== 'u_admin' && u.id !== currentUser.id ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic font-mono">Protegido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
