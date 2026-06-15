import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Servico, formatarPreco, formatarDuracao } from '../lib/supabase';
import { Scissors, Briefcase, Sparkles, AlertTriangle, CheckCircle, X, Clock, Pencil, Trash2, Save, Plus } from 'lucide-react';

interface ServicosPageProps {
  navigate: (to: string) => void;
  adminMode?: boolean;
}

const ICONES_SERVICO = [Scissors, Scissors, Briefcase, Sparkles, Sparkles, Sparkles, Sparkles, Sparkles];

function getIconeComponent(index: number) {
  const IconComponent = ICONES_SERVICO[index % ICONES_SERVICO.length];
  return <IconComponent size={32} strokeWidth={1.5} />;
}

export default function ServicosPage({ navigate, adminMode = false }: ServicosPageProps) {
  const { perfil } = useAuth();
  const isAdmin = perfil?.tipo_usuario === 'admin';
  const showAdminControls = adminMode || isAdmin;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formDuracao, setFormDuracao] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formErro, setFormErro] = useState('');

  const [editando, setEditando] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editErro, setEditErro] = useState('');

  const servicosFiltrados = servicos.filter(servico => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return true;
    return (
      servico.tipo_servico.toLowerCase().includes(termo) ||
      (servico.descricao_servico || '').toLowerCase().includes(termo)
    );
  });

  useEffect(() => {
    carregarServicos();
  }, []);

  async function carregarServicos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tb_servico')
      .select('*')
      .order('id_servico', { ascending: true });

    if (error) {
      setErro('Erro ao carregar serviÃ§os: ' + error.message);
    } else {
      setServicos((data || []) as Servico[]);
    }
    setLoading(false);
  }

  function duracaoParaInterval(valor: string): string {
    const trimmed = valor.trim();
    if (trimmed.includes(':')) {
      const [h, m] = trimmed.split(':');
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }

    const minutos = parseInt(trimmed, 10);
    if (isNaN(minutos)) return '00:30:00';

    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(restante).padStart(2, '0')}:00`;
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setFormErro('');

    if (!formTipo.trim()) {
      setFormErro('Nome do serviÃ§o Ã© obrigatÃ³rio.');
      return;
    }
    if (!formPreco || isNaN(parseFloat(formPreco))) {
      setFormErro('PreÃ§o invÃ¡lido.');
      return;
    }
    if (!formDuracao.trim()) {
      setFormErro('DuraÃ§Ã£o Ã© obrigatÃ³ria.');
      return;
    }

    setFormLoading(true);
    const { error } = await supabase.from('tb_servico').insert({
      tipo_servico: formTipo.trim(),
      descricao_servico: formDesc.trim() || null,
      preco_servico: parseFloat(formPreco),
      duracao_servico: duracaoParaInterval(formDuracao),
    });
    setFormLoading(false);

    if (error) {
      setFormErro('Erro ao cadastrar: ' + error.message);
      return;
    }

    setSucesso('ServiÃ§o cadastrado com sucesso!');
    setShowForm(false);
    setFormTipo('');
    setFormDesc('');
    setFormPreco('');
    setFormDuracao('');
    await carregarServicos();
    setTimeout(() => setSucesso(''), 4000);
  }

  function iniciarEdicao(servico: Servico) {
    setEditando(servico.id_servico);
    setEditTipo(servico.tipo_servico);
    setEditDesc(servico.descricao_servico || '');
    setEditPreco(String(servico.preco_servico));

    const duracao = servico.duracao_servico || '00:30:00';
    const match = duracao.match(/(\d+):(\d+)/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      setEditDuracao(h > 0 ? `${h}:${String(m).padStart(2, '0')}` : String(m));
    } else {
      setEditDuracao('30');
    }
    setEditErro('');
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setEditErro('');

    if (!editTipo.trim()) {
      setEditErro('Nome Ã© obrigatÃ³rio.');
      return;
    }
    if (!editPreco || isNaN(parseFloat(editPreco))) {
      setEditErro('PreÃ§o invÃ¡lido.');
      return;
    }

    setEditLoading(true);
    const { error } = await supabase
      .from('tb_servico')
      .update({
        tipo_servico: editTipo.trim(),
        descricao_servico: editDesc.trim() || null,
        preco_servico: parseFloat(editPreco),
        duracao_servico: duracaoParaInterval(editDuracao),
      })
      .eq('id_servico', editando);
    setEditLoading(false);

    if (error) {
      setEditErro('Erro ao editar: ' + error.message);
      return;
    }

    setSucesso('ServiÃ§o atualizado com sucesso!');
    setEditando(null);
    await carregarServicos();
    setTimeout(() => setSucesso(''), 4000);
  }

  async function handleExcluir(id: number) {
    const { count } = await supabase
      .from('tb_servico_has_tb_agendamento')
      .select('tb_servico_id_servico', { count: 'exact', head: true })
      .eq('tb_servico_id_servico', id);

    if (count && count > 0) {
      setErro(`NÃ£o Ã© possÃ­vel excluir este serviÃ§o: existem ${count} agendamento(s) vinculado(s) a ele.`);
      return;
    }
    if (!confirm('Confirmar exclusÃ£o do serviÃ§o?')) return;

    const { error } = await supabase.from('tb_servico').delete().eq('id_servico', id);
    if (error) {
      setErro('Erro ao excluir: ' + error.message);
      return;
    }

    setSucesso('ServiÃ§o excluÃ­do com sucesso!');
    await carregarServicos();
    setTimeout(() => setSucesso(''), 4000);
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 className="page-title">{showAdminControls ? 'Gerenciar ServiÃ§os' : 'ServiÃ§os e PreÃ§os'}</h1>
          <p className="page-subtitle">
            {showAdminControls
              ? 'Cadastre, edite e gerencie os serviÃ§os oferecidos pela barbearia.'
              : 'ConheÃ§a nossos serviÃ§os e preÃ§os. Agende com facilidade!'}
          </p>
        </div>
        {showAdminControls && (
          <button type="button" className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormErro(''); }}>
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Novo ServiÃ§o</>}
          </button>
        )}
      </div>

      {erro && (
        <div className="alert alert-error">
          <AlertTriangle size={20} /> {erro}
          <button type="button" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>
            <X size={18} />
          </button>
        </div>
      )}
      {sucesso && <div className="alert alert-success"><CheckCircle size={20} /> {sucesso}</div>}

      <div className="search-row" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="search"
          className="form-control"
          placeholder="Buscar serviÃ§o ou descriÃ§Ã£o..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 280px', minWidth: 0 }}
        />
        <button type="button" className="btn btn-secondary" onClick={() => setSearchTerm('')}>
          Limpar
        </button>
      </div>

      {showAdminControls && showForm && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 className="card-title" style={{ marginBottom: 20 }}>Novo ServiÃ§o</h3>
          <form onSubmit={handleCadastrar} noValidate>
            {formErro && <div className="alert alert-error"><AlertTriangle size={20} /> {formErro}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do serviÃ§o <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Corte de Cabelo"
                  value={formTipo}
                  onChange={e => setFormTipo(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">PreÃ§o (R$) <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ex: 35.00"
                  value={formPreco}
                  onChange={e => setFormPreco(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">DuraÃ§Ã£o <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: 30 ou 1:30"
                  value={formDuracao}
                  onChange={e => setFormDuracao(e.target.value)}
                  required
                />
                <span className="form-hint">Digite em minutos ou horas:minutos</span>
              </div>
              <div className="form-group">
                <label className="form-label">DescriÃ§Ã£o</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Breve descriÃ§Ã£o do serviÃ§o"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Salvando...' : 'Cadastrar ServiÃ§o'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
          <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
          Carregando serviÃ§os...
        </div>
      ) : servicosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Briefcase size={64} strokeWidth={1.5} /></div>
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8 }}>{servicos.length === 0 ? 'Nenhum serviÃ§o cadastrado' : 'Nenhum serviÃ§o encontrado'}</h3>
          <p>{servicos.length === 0 ? (showAdminControls ? 'Clique em "+ Novo ServiÃ§o" para comeÃ§ar.' : 'Em breve nossos serviÃ§os estarÃ£o disponÃ­veis.') : 'Ajuste sua busca para ver resultados.'}</p>
        </div>
      ) : (
        <div className="servicos-grid">
          {servicosFiltrados.map((servico, idx) => (
            <div key={servico.id_servico} className="servico-card">
              <div className="servico-icon">{getIconeComponent(idx)}</div>
              <h3 className="servico-nome">{servico.tipo_servico}</h3>
              {servico.descricao_servico && <p className="servico-desc">{servico.descricao_servico}</p>}
              <div className="servico-meta">
                <span className="servico-preco">{formatarPreco(servico.preco_servico)}</span>
                <span className="servico-duracao"><Clock size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />{formatarDuracao(servico.duracao_servico)}</span>
              </div>
              {showAdminControls && (
                <div className="servico-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => editando === servico.id_servico ? setEditando(null) : iniciarEdicao(servico)}>
                    {editando === servico.id_servico ? <><X size={16} /> Cancelar</> : <><Pencil size={16} /> Editar</>}
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleExcluir(servico.id_servico)}>
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              )}
              {showAdminControls && editando === servico.id_servico && (
                <div className="inline-form" style={{ marginTop: 18 }}>
                  <h4 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: '0.95rem' }}>Editar ServiÃ§o</h4>
                  <form onSubmit={handleEditar} noValidate>
                    {editErro && <div className="alert alert-error" style={{ marginBottom: 12 }}><AlertTriangle size={20} /> {editErro}</div>}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nome <span className="required">*</span></label>
                        <input type="text" className="form-control" value={editTipo} onChange={e => setEditTipo(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">PreÃ§o (R$) <span className="required">*</span></label>
                        <input type="number" className="form-control" value={editPreco} onChange={e => setEditPreco(e.target.value)} min="0" step="0.01" required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">DuraÃ§Ã£o</label>
                        <input type="text" className="form-control" placeholder="Ex: 30 ou 1:30" value={editDuracao} onChange={e => setEditDuracao(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">DescriÃ§Ã£o</label>
                        <input type="text" className="form-control" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                        {editLoading ? 'Salvando...' : <><Save size={16} style={{ marginRight: 4 }} /> Salvar</>}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>
                        Cancelar ediÃ§Ã£o
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

