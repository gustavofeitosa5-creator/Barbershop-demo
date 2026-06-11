interface NotFoundPageProps {
  navigate: (to: string) => void;
  mensagem?: string;
  codigo?: number;
}

export default function NotFoundPage({ navigate, mensagem, codigo = 404 }: NotFoundPageProps) {
  return (
    <div className="not-found">
      <div className="error-code">{codigo}</div>
      <h2>{codigo === 403 ? 'Acesso Negado' : 'Página não encontrada'}</h2>
      <p>{mensagem || 'A página que você está procurando não existe ou foi removida.'}</p>
      <button className="btn btn-primary" onClick={() => navigate('index')}>
        Voltar ao Início
      </button>
    </div>
  );
}
