import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ServicosPage from './pages/ServicosPage';
import AgendarPage from './pages/AgendarPage';
import AgendamentosAdminPage from './pages/AgendamentosAdminPage';
import BarbeirosAdminPage from './pages/BarbeirosAdminPage';
import BarbeiroDashboardPage from './pages/BarbeiroDashboardPage';
import HistoricoPage from './pages/HistoricoPage';
import IndexPage from './pages/IndexPage';
import NotFoundPage from './pages/NotFoundPage';
import PerfilPage from './pages/PerfilPage';
import Navbar from './components/Navbar';


function AppInner() {
  const { user, perfil, loading } = useAuth();
  const [page, setPage] = useState<string>('index');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const pageHistoryRef = useRef<string[]>(['index']);

  function navigate(to: string, params: Record<string, string> = {}) {
    // Adiciona página ao histórico se for diferente da atual
    if (to !== page) {
      pageHistoryRef.current.push(to);
    }
    setPage(to);
    setPageParams(params);
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (pageHistoryRef.current.length > 1) {
      pageHistoryRef.current.pop();
      const previousPage = pageHistoryRef.current[pageHistoryRef.current.length - 1];
      setPage(previousPage);
      setPageParams({});
      window.scrollTo(0, 0);
    } else {
      // Se não há histórico, volta para index
      navigate('index');
    }
  }

  useEffect(() => {
    if (!loading) {
      const rawHash = window.location.hash.replace('#', '');
      const hashPage = rawHash ? rawHash.split('?')[0] : '';
      const pathPage = window.location.pathname.replace(/\/$/, '');
      const initialPage = hashPage || (pathPage === '/auth' ? 'auth' : 'index');
      setPage(initialPage);
      pageHistoryRef.current = [initialPage];
    }
  }, [loading]);

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Route guards
  const rotasProtegidas = ['perfil', 'agendar', 'historico', 'dashboard', 'admin-agendamentos', 'admin-barbeiros', 'admin-servicos', 'barbeiro-dashboard'];
  const rotasAdmin = ['dashboard', 'admin-agendamentos', 'admin-barbeiros', 'admin-servicos'];
  const rotasBarbeiro = ['barbeiro-dashboard'];

  if (rotasProtegidas.includes(page) && !user) {
    return (
      <AuthPage navigate={navigate} mensagem="Faça login para continuar." />
    );
  }

  if (rotasAdmin.includes(page) && perfil?.tipo_usuario !== 'admin') {
    return (
      <div className="error-page">
        <Navbar navigate={navigate} />
        <NotFoundPage navigate={navigate} mensagem="Acesso negado. Área restrita ao administrador." codigo={403} />
      </div>
    );
  }

  if (rotasBarbeiro.includes(page) && perfil?.tipo_usuario !== 'barbeiro') {
    return (
      <div className="error-page">
        <Navbar navigate={navigate} />
        <NotFoundPage navigate={navigate} mensagem="Acesso negado. Área restrita a barbeiros." codigo={403} />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'index':
        return <IndexPage navigate={navigate} />;
      case 'auth':
        return <AuthPage navigate={navigate} />;
      case 'dashboard':
        return <DashboardPage navigate={navigate} />;
      case 'perfil':
        return <PerfilPage navigate={navigate} />;
      case 'servicos':
        return <ServicosPage navigate={navigate} />;
      case 'agendar':
        return <AgendarPage navigate={navigate} params={pageParams} />;
      case 'admin-agendamentos':
        return <AgendamentosAdminPage navigate={navigate} />;
      case 'admin-barbeiros':
        return <BarbeirosAdminPage navigate={navigate} />;
      case 'admin-servicos':
        return <ServicosPage navigate={navigate} adminMode={true} />;
      case 'barbeiro-dashboard':
        return <BarbeiroDashboardPage navigate={navigate} />;
      case 'historico':
        return <HistoricoPage navigate={navigate} goBack={goBack} />;
      default:
        return <NotFoundPage navigate={navigate} />;
    }
  };

  const showNavbar = page !== 'auth';

  return (
    <div className="app-wrapper">
      {showNavbar && <Navbar navigate={navigate} goBack={page !== 'index' ? goBack : undefined} />}
      <main className={showNavbar ? 'with-navbar' : ''}>
        {renderPage()}
      </main>
      {/* Setup banner removed to avoid showing configuration hints in production */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
