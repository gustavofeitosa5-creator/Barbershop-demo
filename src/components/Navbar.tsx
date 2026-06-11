import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  navigate: (to: string, params?: Record<string, string>) => void;
}

export default function Navbar({ navigate }: NavbarProps) {
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
    </>
  );

  const linkBarbeiro = (
    <>
      <button className="nav-link" onClick={() => handleNav('barbeiro-dashboard')}>Meus Agendamentos</button>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
    </>
  );

  const linkAdmin = (
    <>
      <button className="nav-link" onClick={() => handleNav('dashboard')}>Dashboard</button>
      <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
      <button className="nav-link" onClick={() => handleNav('admin-agendamentos')}>Agendamentos</button>
      <button className="nav-link" onClick={() => handleNav('admin-barbeiros')}>Barbeiros</button>
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
          <button className="navbar-brand" onClick={() => handleNav('index')}>
            <span className="brand-icon">✂️</span>
            BarberSync
          </button>

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
            <span></span>
            <span></span>
            <span></span>
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
          </>
        )}
        {user && !isAdmin && (
          <>
            <button className="nav-link" onClick={() => handleNav('servicos')}>Serviços</button>
            <button className="nav-link" onClick={() => handleNav('agendar')}>Agendar</button>
            <button className="nav-link" onClick={() => handleNav('historico')}>Meus Agendamentos</button>
          </>
        )}
        {user && (
          <div className="mobile-menu" style={{ position: 'static', display: 'flex', flexDirection: 'column', gap: 0, padding: 0, background: 'none', border: 'none' }}>
            <div className="navbar-user" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <span>{perfil?.nome_usuario || 'Usuário'}</span>
              <span className="user-badge">{isAdmin ? 'Admin' : 'Cliente'}</span>
            </div>
            <button className="nav-link btn-outline" onClick={handleLogout} style={{ margin: '0 0 4px' }}>Sair</button>
          </div>
        )}
      </div>
    </>
  );
}
