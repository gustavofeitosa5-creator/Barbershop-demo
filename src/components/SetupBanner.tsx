export default function SetupBanner() {
  const isConfigured =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder_anon_key';

  if (isConfigured) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(15, 15, 15, 0.97)',
      borderTop: '2px solid var(--color-primary)',
      padding: '16px 24px',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: '1.5rem' }}>⚙️</div>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 6, fontFamily: 'var(--font-serif)' }}>
          Configuração do Supabase necessária
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 8 }}>
          Para usar o sistema, configure as variáveis de ambiente do Supabase:
        </p>
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '0.78rem',
          fontFamily: 'monospace',
          color: 'var(--text-secondary)',
          lineHeight: 2,
        }}>
          <div><span style={{ color: 'var(--color-primary)' }}>VITE_SUPABASE_URL</span>=https://sua-url.supabase.co</div>
          <div><span style={{ color: 'var(--color-primary)' }}>VITE_SUPABASE_ANON_KEY</span>=sua_anon_key</div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
          Crie um arquivo <code style={{ background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 3 }}>.env</code> na raiz do projeto com as variáveis acima.
          Execute o SQL do schema no Supabase e reinicie o servidor com <code style={{ background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 3 }}>npm run dev</code>.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm"
        >
          Abrir Supabase →
        </a>
      </div>
    </div>
  );
}
