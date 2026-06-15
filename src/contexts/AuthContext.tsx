import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Usuario } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  perfil: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ error: string | null }>;
  cadastro: (nome: string, email: string, telefone: string, senha: string, confirmarSenha: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<{ error: string | null }>;
  atualizarPerfil: () => Promise<void>;
  atualizarPerfilInfo: (nome: string, telefone?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  async function buscarPerfil(userId: string): Promise<Usuario | null> {
    // userId é o UUID do Supabase Auth
    // Mas tb_usuario usa SERIAL, então busco pelo email armazenado em metadata
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) return null;
    
    const emailTrimmed = authUser.email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('tb_usuario')
      .select('*')
      .eq('email_usuario', emailTrimmed)
      .maybeSingle();
    
    // Log de erro para debug
    if (error) {
      console.warn('Erro ao buscar perfil:', error);
      return null;
    }
    return data as Usuario;
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await buscarPerfil(session.user.id);
        setPerfil(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await buscarPerfil(session.user.id);
        setPerfil(p);
      } else {
        setPerfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, senha: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      if (error.message.includes('Invalid login')) return { error: 'E-mail ou senha incorretos.' };
      return { error: error.message };
    }
    if (data.user) {
      const p = await buscarPerfil(data.user.id);
      setPerfil(p);
    }
    return { error: null };
  }

  async function cadastro(
    nome: string,
    email: string,
    telefone: string,
    senha: string,
    confirmarSenha: string
  ): Promise<{ error: string | null }> {
    if (senha !== confirmarSenha) return { error: 'As senhas não coincidem.' };
    if (senha.length < 8) return { error: 'A senha deve ter pelo menos 8 caracteres.' };
    if (!nome.trim()) return { error: 'Nome completo é obrigatório.' };

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      if (error.message.includes('already registered')) return { error: 'Este e-mail já está cadastrado.' };
      return { error: error.message };
    }
    if (!data.user) return { error: 'Erro ao criar usuário.' };

    // Verificar se o email existe em tb_barbeiro
    const emailTrimmed = email.toLowerCase().trim();
    const { data: barbeiroData } = await supabase
      .from('tb_barbeiro')
      .select('id_barbeiro, nome_barbeiro')
      .eq('email_barbeiro', emailTrimmed)
      .maybeSingle();

    // Determinar tipo: barbeiro (se encontrado) ou cliente
    const tipoUsuario = barbeiroData ? 'barbeiro' : 'cliente';

    // id_usuario é SERIAL (auto-increment), não inserir
    const { error: perfilError } = await supabase
      .from('tb_usuario')
      .insert({
        nome_usuario: nome.trim(),
        email_usuario: emailTrimmed,
        telefone_usuario: telefone.trim() || null,
        tipo_usuario: tipoUsuario,
      });

    if (perfilError) return { error: 'Erro ao salvar perfil: ' + perfilError.message };

    const p = await buscarPerfil(data.user.id);
    setPerfil(p);
    return { error: null };
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
  }

  async function recuperarSenha(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#auth',
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function atualizarPerfilInfo(nome: string, telefone?: string): Promise<{ error: string | null }> {
    if (!user) return { error: 'Usuário não autenticado.' };

    const emailTrimmed = user.email?.toLowerCase().trim();
    if (!emailTrimmed) return { error: 'E-mail do usuário não disponível.' };

    const { error } = await supabase
      .from('tb_usuario')
      .update({
        nome_usuario: nome,
        telefone_usuario: telefone?.trim() || null,
      })
      .eq('email_usuario', emailTrimmed);

    if (error) return { error: error.message };

    await atualizarPerfil();
    return { error: null };
  }

  async function atualizarPerfil(): Promise<void> {
    if (user) {
      const p = await buscarPerfil(user.id);
      setPerfil(p);
    }
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, cadastro, logout, recuperarSenha, atualizarPerfil, atualizarPerfilInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
