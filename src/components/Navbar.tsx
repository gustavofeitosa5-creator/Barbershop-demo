import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Scissors, Menu, X, User, LogOut, ChevronRight, Calendar, Clock, DollarSign } from 'lucide-react';

interface NavbarProps {
  navigate: (to: string, params?: Record<string, string>) => void;
  goBack?: () => void;
}

export default function Navbar({ navigate, goBack }: NavbarProps) {
  const { user, perfil, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = perfil?.tipo_usuario === 'admin';
  const isBarbeiro = perfil?.tipo_usuario === 'barbeiro';

  function handleNav(page: string) {
    navigate(page);
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate('index');
    setMenuOpen(false);
  }

  const linkCliente = (
    <>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
      <button className="nav-link" onClick={() => handleNav('agendar')}>Agendar</button>
      <button className="nav-link" onClick={() => handleNav('historico')}>Meus Agendamentos</button>
      <button className="nav-link" onClick={() => handleNav('perfil')}>Perfil</button>
    </>
  );

  const linkBarbeiro = (
    <>
      <button className="nav-link" onClick={() => handleNav('barbeiro-dashboard')}>Meus Agendamentos</button>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
      <button className="nav-link" onClick={() => handleNav('perfil')}>Perfil</button>
    </>
  );

  const linkAdmin = (
    <>
      <button className="nav-link" onClick={() => handleNav('dashboard')}>Dashboard</button>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
      <button className="nav-link" onClick={() => handleNav('admin-agendamentos')}>Agendamentos</button>
      <button className="nav-link" onClick={() => handleNav('admin-barbeiros')}>Barbeiros</button>
      <button className="nav-link" onClick={() => handleNav('perfil')}>Perfil</button>
    </>
  );

  const linkPublico = (
    <>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
    </>
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {goBack && (
              <button 
                className="btn btn-icon btn-secondary" 
                onClick={goBack}
                aria-label="Voltar"
                style={{ marginRight: '4px' }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <button className="navbar-brand" onClick={() => handleNav('index')}>
              <Scissors className="brand-icon" size={24} />
              BarberSync
            </button>
          </div>

          <div className="navbar-links">
            {!user && linkPublico}
            {user && isAdmin && linkAdmin}
            {user && isBarbeiro && linkBarbeiro}
            {user && !isAdmin && !isBarbeiro && linkCliente}

            {user ? (
              <>
                <div className="navbar-user">
                  <span>{perfil?.nome_usuario?.split(' ')[0] || 'Usuário'}</span>
                  <span className="user-badge">{isAdmin ? 'Admin' : isBarbeiro ? 'Barbeiro' : 'Cliente'}</span>
                </div>
                <button className="nav-link btn-outline" onClick={handleLogout}>Sair</button>
              </>
            ) : (
              <button className="nav-link btn-outline" onClick={() => handleNav('auth')}>Entrar</button>
            )}
          </div>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {!user && (
          <>
            <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
            <button className="nav-link" onClick={() => handleNav('auth')}>Entrar / Cadastrar</button>
          </>
        )}
        {user && isAdmin && (
          <>
            <button className="nav-link" onClick={() => handleNav('dashboard')}>Dashboard</button>
            <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
            <button className="nav-link" onClick={() => handleNav('admin-agendamentos')}>Agendamentos</button>
            <button className="nav-link" onClick={() => handleNav('admin-barbeiros')}>Barbeiros</button>
            <button className="nav-link" onClick={() => handleNav('perfil')}>Perfil</button>
          </>
        )}
        {user && !isAdmin && (
          <>
            <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
            <button className="nav-link" onClick={() => handleNav('agendar')}>Agendar</button>
            <button className="nav-link" onClick={() => handleNav('historico')}>Meus Agendamentos</button>
            <button className="nav-link" onClick={() => handleNav('perfil')}>Perfil</button>
          </>
        )}
        {user && (
          <div className="mobile-menu" style={{ position: 'static', display: 'flex', flexDirection: 'column', gap: 0, padding: 0, background: 'none', border: 'none' }}>
            <div className="navbar-user" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <User size={16} style={{ marginRight: '8px' }} />
              <span>{perfil?.nome_usuario || 'Usuário'}</span>
              <span className="user-badge">{isAdmin ? 'Admin' : 'Cliente'}</span>
            </div>
            <button className="nav-link" onClick={() => handleNav('perfil')} style={{ margin: '0 0 4px' }}>
              Perfil
            </button>
            <button className="nav-link btn-outline" onClick={handleLogout} style={{ margin: '0 0 4px' }}>
              <LogOut size={16} style={{ marginRight: '8px' }} />
              Sair
            </button>
          </div>
        )}
      </div>
    </>
  );
}
