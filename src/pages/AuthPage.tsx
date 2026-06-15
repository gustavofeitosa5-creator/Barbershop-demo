import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatarTelefone, validarTelefone, extrairDigitos } from '../utils/phone';
import { Scissors, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthPageProps {
  navigate: (to: string) => void;
  mensagem?: string;
}

export default function AuthPage({ navigate, mensagem }: AuthPageProps) {
  const { login, cadastro, recuperarSenha, perfil, user } = useAuth();
  const [aba, setAba] = useState<'login' | 'cadastro'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErro, setLoginErro] = useState('');
  const [loginSucesso, setLoginSucesso] = useState('');

  // Cadastro state
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadTelefone, setCadTelefone] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmar, setCadConfirmar] = useState('');
  const [cadLoading, setCadLoading] = useState(false);
  const [cadErro, setCadErro] = useState('');

  // Recuperar senha
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [recEmail, setRecEmail] = useState('');
  const [recLoading, setRecLoading] = useState(false);
  const [recMensagem, setRecMensagem] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && perfil) {
      if (perfil.tipo_usuario === 'admin') {
        navigate('dashboard');
      } else if (perfil.tipo_usuario === 'barbeiro') {
        navigate('barbeiro-dashboard');
      } else {
        navigate('agendar');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, perfil]);

  if (user && perfil) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro('');
    setLoginSucesso('');

    if (!loginEmail.trim() || !loginSenha.trim()) {
      setLoginErro('Preencha e-mail e senha.');
      return;
    }

    setLoginLoading(true);
    const { error } = await login(loginEmail.trim(), loginSenha);
    setLoginLoading(false);

    if (error) {
      setLoginErro(error);
    } else {
      setLoginSucesso('Login realizado! Redirecionando...');
      // Navigate handled by useEffect when perfil is set
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCadErro('');

    if (!cadNome.trim()) { setCadErro('Nome completo é obrigatório.'); return; }
    if (!cadEmail.trim()) { setCadErro('E-mail é obrigatório.'); return; }
    if (cadSenha.length < 8) { setCadErro('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (cadSenha !== cadConfirmar) { setCadErro('As senhas não coincidem.'); return; }
    
    const telefoneValidacao = validarTelefone(cadTelefone);
    if (!telefoneValidacao.valido) { setCadErro(telefoneValidacao.erro || 'Telefone inválido.'); return; }

    setCadLoading(true);
    const { error } = await cadastro(cadNome, cadEmail.trim(), extrairDigitos(cadTelefone), cadSenha, cadConfirmar);
    setCadLoading(false);

    if (error) {
      setCadErro(error);
    } else {
      navigate('agendar');
    }
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setRecMensagem('');
    if (!recEmail.trim()) return;
    setRecLoading(true);
    const { error } = await recuperarSenha(recEmail.trim());
    setRecLoading(false);
    if (error) {
      setRecMensagem('Erro: ' + error);
    } else {
      setRecMensagem('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <Scissors size={32} /> BarberSync
          </h1>
          <p>Sistema de Agendamento para Barbearia</p>
        </div>

        {mensagem && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            {mensagem}
          </div>
        )}

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${aba === 'login' ? 'active' : ''}`}
              onClick={() => { setAba('login'); setLoginErro(''); setCadErro(''); }}
            >
              Entrar
            </button>
            <button
              className={`auth-tab ${aba === 'cadastro' ? 'active' : ''}`}
              onClick={() => { setAba('cadastro'); setLoginErro(''); setCadErro(''); }}
            >
              Criar Conta
            </button>
          </div>

          {/* =============== LOGIN =============== */}
          {aba === 'login' && !showRecuperar && (
            <form onSubmit={handleLogin} noValidate>
              {loginErro && (
                <div className="alert alert-error">
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  {loginErro}
                </div>
              )}
              {loginSucesso && (
                <div className="alert alert-success">
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  {loginSucesso}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  E-mail <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Senha <span className="required">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Sua senha"
                  value={loginSenha}
                  onChange={e => setLoginSenha(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-text"
                  style={{ padding: '0', color: 'var(--color-primary)' }}
                  onClick={() => setShowRecuperar(true)}
                >
                  Esqueceu a senha?
                </button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Use seu e-mail para receber o link de redefinição.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loginLoading}
                style={{ marginTop: 8 }}
              >
                {loginLoading ? (
                  <><span className="spinner-sm"></span> Entrando...</>
                ) : 'Entrar'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Não tem conta?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                  onClick={() => setAba('cadastro')}
                >
                  Criar gratuitamente
                </button>
              </p>
            </form>
          )}

          {/* =============== RECUPERAR SENHA =============== */}
          {aba === 'login' && showRecuperar && (
            <form onSubmit={handleRecuperar} noValidate>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', marginBottom: 16 }}>
                Recuperar Senha
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              {recMensagem && (
                <div className={`alert ${recMensagem.startsWith('Erro') ? 'alert-error' : 'alert-success'}`}>
                  {recMensagem.startsWith('Erro') ? (
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  ) : (
                    <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  )}
                  {recMensagem}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">E-mail <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={recEmail}
                  onChange={e => setRecEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowRecuperar(false); setRecMensagem(''); setRecEmail(''); }}
                >
                  ← Voltar
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={recLoading}>
                  {recLoading ? <><span className="spinner-sm"></span> Enviando...</> : 'Enviar Link'}
                </button>
              </div>
            </form>
          )}

          {/* =============== CADASTRO =============== */}
          {aba === 'cadastro' && (
            <form onSubmit={handleCadastro} noValidate>
              {cadErro && (
                <div className="alert alert-error">
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  {cadErro}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nome completo <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Seu nome completo"
                  value={cadNome}
                  onChange={e => setCadNome(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={cadEmail}
                  onChange={e => setCadEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone <span className="required">*</span></label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="(84) 99999-9999"
                  value={cadTelefone}
                  onChange={e => setCadTelefone(formatarTelefone(e.target.value))}
                  maxLength={15}
                  autoComplete="tel"
                />
                {cadTelefone && !validarTelefone(cadTelefone).valido && (
                  <span className="form-error">{validarTelefone(cadTelefone).erro}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Senha <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 8 caracteres"
                  value={cadSenha}
                  onChange={e => setCadSenha(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <span className="form-hint">A senha deve ter pelo menos 8 caracteres.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar senha <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Repita a senha"
                  value={cadConfirmar}
                  onChange={e => setCadConfirmar(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {cadConfirmar && cadSenha !== cadConfirmar && (
                  <span className="form-error">As senhas não coincidem.</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={cadLoading}
                style={{ marginTop: 8 }}
              >
                {cadLoading ? (
                  <><span className="spinner-sm"></span> Criando conta...</>
                ) : 'Criar Conta'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Já tem conta?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                  onClick={() => setAba('login')}
                >
                  Entrar
                </button>
              </p>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          © 2026 BarberSync — EEEP Professora Maria Célia Pinheiro Falcão
        </p>
      </div>
    </div>
  );
}
