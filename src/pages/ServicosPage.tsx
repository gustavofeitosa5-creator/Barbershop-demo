import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Servico, formatarPreco, formatarDuracao } from '../lib/supabase';

interface ServicosPageProps {
  navigate: (to: string) => void;
  adminMode?: boolean;
}

const ICONES_SERVICO = ['✂️', '🪒', '💈', '👔', '🧖', '💇', '🎨', '✨'];

function getIcone(index: number): string {
  return ICONES_SERVICO[index % ICONES_SERVICO.length];
}

export default function ServicosPage({ navigate, adminMode = false }: ServicosPageProps) {
  const { perfil } = useAuth();
  const isAdmin = perfil?.tipo_usuario === 'admin';
  const showAdminControls = adminMode || isAdmin;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Form novo serviço
  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formDuracao, setFormDuracao] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formErro, setFormErro] = useState('');

  // Form edição
  const [editando, setEditando] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editErro, setEditErro] = useState('');

  useEffect(() => {
    carregarServicos();
  }, []);

  async function carregarServicos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tb_servico')
      .select('*')
      .order('id_servico', { ascending: true });
    if (error) setErro('Erro ao carregar serviços: ' + error.message);
    else setServicos((data || []) as Servico[]);
    setLoading(false);
  }

  function duracaoParaInterval(val: string): string {
    // Aceita "30" (minutos) ou "1:30" (horas:min)
    const valTrim = val.trim();
    if (valTrim.includes(':')) {
      const [h, m] = valTrim.split(':');
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }
    const mins = parseInt(valTrim);
    if (isNaN(mins)) return '00:30:00';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setFormErro('');

    if (!formTipo.trim()) { setFormErro('Nome do serviço é obrigatório.'); return; }
    if (!formPreco || isNaN(parseFloat(formPreco))) { setFormErro('Preço inválido.'); return; }
    if (!formDuracao.trim()) { setFormErro('Duração é obrigatória.'); return; }

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
    } else {
      setSucesso('Serviço cadastrado com sucesso!');
      setShowForm(false);
      setFormTipo(''); setFormDesc(''); setFormPreco(''); setFormDuracao('');
      await carregarServicos();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  function iniciarEdicao(s: Servico) {
    setEditando(s.id_servico);
    setEditTipo(s.tipo_servico);
    setEditDesc(s.descricao_servico || '');
    setEditPreco(String(s.preco_servico));
    // Formatar duração do formato interval para exibição
    const dur = s.duracao_servico || '00:30:00';
    const match = dur.match(/(\d+):(\d+)/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
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

    if (!editTipo.trim()) { setEditErro('Nome é obrigatório.'); return; }
    if (!editPreco || isNaN(parseFloat(editPreco))) { setEditErro('Preço inválido.'); return; }

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
    } else {
      setSucesso('Serviço atualizado com sucesso!');
      setEditando(null);
      await carregarServicos();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  async function handleExcluir(id: number) {
    // Verificar dependências (agendamentos vinculados)
    const { count } = await supabase
      .from('tb_servico_has_tb_agendamento')
      .select('tb_servico_id_servico', { count: 'exact', head: true })
      .eq('tb_servico_id_servico', id);

    if (count && count > 0) {
      setErro(`Não é possível excluir este serviço: existem ${count} agendamento(s) vinculado(s) a ele.`);
      return;
    }

    if (!confirm('Confirmar exclusão do serviço?')) return;

    const { error } = await supabase.from('tb_servico').delete().eq('id_servico', id);
    if (error) {
      setErro('Erro ao excluir: ' + error.message);
    } else {
      setSucesso('Serviço excluído com sucesso!');
      await carregarServicos();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 className="page-title">
            {showAdminControls ? 'Gerenciar Serviços' : 'Serviços e Preços'}
          </h1>
          <p className="page-subtitle">
            {showAdminControls
              ? 'Cadastre, edite e gerencie os serviços oferecidos pela barbearia.'
              : 'Conheça nossos serviços e preços. Agende com facilidade!'}
          </p>
        </div>
        {showAdminControls && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormErro(''); }}>
            {showForm ? '✕ Cancelar' : '+ Novo Serviço'}
          </button>
        )}
      </div>

      {erro && (
        <div className="alert alert-error">
          ❌ {erro}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>✕</button>
        </div>
      )}
      {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}

      {/* Formulário de cadastro */}
      {showAdminControls && showForm && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 className="card-title" style={{ marginBottom: 20 }}>Novo Serviço</h3>
          <form onSubmit={handleCadastrar} noValidate>
            {formErro && <div className="alert alert-error">❌ {formErro}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do serviço <span className="required">*</span></label>
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
                <label className="form-label">Preço (R$) <span className="required">*</span></label>
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
                <label className="form-label">Duração <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: 30 (min) ou 1:30 (h:min)"
                  value={formDuracao}
                  onChange={e => setFormDuracao(e.target.value)}
                  required
                />
                <span className="form-hint">Digite em minutos (ex: 30) ou horas:minutos (ex: 1:30)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Breve descrição do serviço"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? <><span className="spinner-sm"></span> Salvando...</> : 'Cadastrar Serviço'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de serviços */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
          <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
          Carregando serviços...
        </div>
      ) : servicos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>💼</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 8 }}>Nenhum serviço cadastrado</h3>
          <p>{showAdminControls ? 'Clique em "+ Novo Serviço" para começar.' : 'Em breve nossos serviços estarão disponíveis.'}</p>
        </div>
      ) : (
        <div className="servicos-grid">
          {servicos.map((s, idx) => (
            <div key={s.id_servico} className="servico-card">
              <div className="servico-icon">{getIcone(idx)}</div>
              <h3 className="servico-nome">{s.tipo_servico}</h3>
              {s.descricao_servico && (
                <p className="servico-desc">{s.descricao_servico}</p>
              )}
              <div className="servico-meta">
                <span className="servico-preco">{formatarPreco(s.preco_servico)}</span>
                <span className="servico-duracao">
                  ⏱ {formatarDuracao(s.duracao_servico)}
                </span>
              </div>

              {/* Admin controls */}
              {showAdminControls && (
                <div className="servico-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => editando === s.id_servico ? setEditando(null) : iniciarEdicao(s)}
                  >
                    {editando === s.id_servico ? 'Cancelar' : '✏️ Editar'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleExcluir(s.id_servico)}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              )}

              {/* Inline edit form */}
              {showAdminControls && editando === s.id_servico && (
                <div className="inline-form">
                  <h4 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: '0.95rem' }}>
                    Editar Serviço
                  </h4>
                  <form onSubmit={handleEditar} noValidate>
                    {editErro && <div className="alert alert-error" style={{ marginBottom: 12 }}>❌ {editErro}</div>}
                    <div className="form-group">
                      <label className="form-label">Nome <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTipo}
                        onChange={e => setEditTipo(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Descrição</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group">
                        <label className="form-label">Preço (R$) <span className="required">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={editPreco}
                          onChange={e => setEditPreco(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duração</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: 30 ou 1:30"
                          value={editDuracao}
                          onChange={e => setEditDuracao(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                      {editLoading ? <><span className="spinner-sm"></span> Salvando...</> : '💾 Salvar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CTA para clientes não logados */}
      {!perfil && (
        <div style={{
          marginTop: 48, textAlign: 'center', padding: '40px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', borderColor: 'var(--color-primary)',
          borderLeftWidth: 4
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 12 }}>
            Pronto para agendar?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Crie sua conta e agende seu horário com o barbeiro de sua preferência.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('auth')}>
              Criar Conta Grátis
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('auth')}>
              Já tenho conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
