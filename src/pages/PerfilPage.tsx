import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { aplicarMascaraTelefone, extrairDigitos, formatarTelefone } from '../utils/phone';
import { User, Mail, Phone, Save, LogOut } from 'lucide-react';

interface PerfilPageProps {
  navigate: (to: string) => void;
}

export default function PerfilPage({ navigate }: PerfilPageProps) {
  const { perfil, atualizarPerfilInfo, logout } = useAuth();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome_usuario);
      setTelefone(formatarTelefone(perfil.telefone_usuario || ''));
    }
  }, [perfil]);

  if (!perfil) return null;

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome.trim()) {
      setErro('Nome é obrigatório.');
      return;
    }

    const telefoneLimpo = extrairDigitos(telefone);
    if (telefone && telefoneLimpo.length !== 11) {
      setErro('Telefone deve ter 11 dígitos.');
      return;
    }

    setSalvando(true);
    const { error } = await atualizarPerfilInfo(nome.trim(), telefoneLimpo);
    setSalvando(false);

    if (error) {
      setErro(error);
    } else {
      setSucesso('Perfil atualizado com sucesso.');
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('index');
  }

  return (
    <div className="page">
      <div className="section-header" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 className="page-title">Meu Perfil</h1>
          <p className="page-subtitle">Atualize suas informações e mantenha seus dados de contato corretos.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('historico')}>Meus Agendamentos</button>
          <button className="btn btn-secondary" onClick={handleLogout}><LogOut size={16} style={{ marginRight: 8 }} /> Sair</button>
        </div>
      </div>

      <div className="profile-card">
        {erro && <div className="alert alert-error">❌ {erro}</div>}
        {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}

        <form onSubmit={handleSalvar} noValidate>
          <div className="profile-field">
            <label className="profile-label"><User size={16} /> Nome completo</label>
            <input
              type="text"
              className="form-control"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="profile-field">
            <label className="profile-label"><Mail size={16} /> E-mail</label>
            <input
              type="email"
              className="form-control"
              value={perfil.email_usuario || ''}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label className="profile-label"><Phone size={16} /> Telefone</label>
            <input
              type="tel"
              className="form-control"
              value={telefone}
              onChange={e => setTelefone(aplicarMascaraTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('agendar')}>
              Voltar para agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
