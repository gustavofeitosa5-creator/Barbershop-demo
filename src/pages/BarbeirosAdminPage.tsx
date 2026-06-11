import { useState, useEffect } from 'react';
import { supabase, Barbeiro, Indisponibilidade, formatarData, getHojeISO } from '../lib/supabase';
import { formatarTelefone, validarTelefone, extrairDigitos } from '../utils/phone';

interface BarbeirosAdminPageProps {
  navigate: (to: string) => void;
}

export default function BarbeirosAdminPage({ navigate }: BarbeirosAdminPageProps) {
  void navigate; // available for future use
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [bloqueios, setBloqueios] = useState<(Indisponibilidade & { barbeiro_nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Form novo barbeiro
  const [showForm, setShowForm] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEspecialidade, setFormEspecialidade] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formErro, setFormErro] = useState('');

  // Edição inline
  const [editando, setEditando] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEspecialidade, setEditEspecialidade] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editErro, setEditErro] = useState('');

  // Bloqueio inline
  const [bloqueando, setBloqueando] = useState<number | null>(null);
  const [blkData, setBlkData] = useState('');
  const [blkHoraInicio, setBlkHoraInicio] = useState('');
  const [blkHoraFim, setBlkHoraFim] = useState('');
  const [blkMotivo, setBlkMotivo] = useState('');
  const [blkLoading, setBlkLoading] = useState(false);
  const [blkErro, setBlkErro] = useState('');

  const hoje = getHojeISO();

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro('');

    const [{ data: bsData, error: bsErr }, { data: blData, error: blErr }] = await Promise.all([
      supabase.from('tb_barbeiro').select('*').order('nome_barbeiro'),
      supabase
        .from('tb_barbeiro_indisponibilidade')
        .select('*, tb_barbeiro(nome_barbeiro)')
        .order('data_bloqueio', { ascending: false }),
    ]);

    if (bsErr) setErro('Erro ao carregar barbeiros: ' + bsErr.message);
    else setBarbeiros((bsData || []) as Barbeiro[]);

    if (!blErr && blData) {
      const formatted = blData.map((b: Indisponibilidade & { tb_barbeiro?: { nome_barbeiro: string } }) => ({
        ...b,
        barbeiro_nome: b.tb_barbeiro?.nome_barbeiro || '—',
      }));
      setBloqueios(formatted);
    }

    setLoading(false);
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setFormErro('');
    if (!formNome.trim()) { setFormErro('Nome é obrigatório.'); return; }
    
    const telefoneValidacao = validarTelefone(formTelefone);
    if (!telefoneValidacao.valido) { setFormErro(telefoneValidacao.erro || 'Telefone inválido.'); return; }

    setFormLoading(true);
    const { error } = await supabase.from('tb_barbeiro').insert({
      nome_barbeiro: formNome.trim(),
      telefone_barbeiro: extrairDigitos(formTelefone) || null,
      email_barbeiro: formEmail.trim() || null,
      especialidade_barbeiro: formEspecialidade.trim() || null,
    });
    setFormLoading(false);

    if (error) {
      setFormErro('Erro ao cadastrar: ' + error.message);
    } else {
      setSucesso('Barbeiro cadastrado com sucesso!');
      setShowForm(false);
      setFormNome(''); setFormTelefone(''); setFormEmail(''); setFormEspecialidade('');
      await carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  function iniciarEdicao(b: Barbeiro) {
    setEditando(b.id_barbeiro);
    setEditNome(b.nome_barbeiro);
    setEditTelefone(b.telefone_barbeiro || '');
    setEditEmail(b.email_barbeiro || '');
    setEditEspecialidade(b.especialidade_barbeiro || '');
    setEditErro('');
    setBloqueando(null);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setEditErro('');
    if (!editNome.trim()) { setEditErro('Nome é obrigatório.'); return; }
    
    const telefoneValidacao = validarTelefone(editTelefone);
    if (!telefoneValidacao.valido) { setEditErro(telefoneValidacao.erro || 'Telefone inválido.'); return; }

    setEditLoading(true);
    const { error } = await supabase
      .from('tb_barbeiro')
      .update({
        nome_barbeiro: editNome.trim(),
        telefone_barbeiro: extrairDigitos(editTelefone) || null,
        email_barbeiro: editEmail.trim() || null,
        especialidade_barbeiro: editEspecialidade.trim() || null,
      })
      .eq('id_barbeiro', editando);
    setEditLoading(false);

    if (error) {
      setEditErro('Erro ao editar: ' + error.message);
    } else {
      setSucesso('Barbeiro atualizado com sucesso!');
      setEditando(null);
      await carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  async function handleExcluir(id: number) {
    // Verificar dependências (RN06)
    const { count } = await supabase
      .from('tb_agendamento')
      .select('id_agendamento', { count: 'exact', head: true })
      .eq('tb_barbeiro_id_barbeiro', id);

    if (count && count > 0) {
      setErro(`Não é possível excluir este barbeiro: existem ${count} agendamento(s) vinculado(s). Cancele os agendamentos antes de excluir.`);
      return;
    }

    if (!confirm('Confirmar exclusão do barbeiro? Esta ação é irreversível.')) return;

    const { error } = await supabase.from('tb_barbeiro').delete().eq('id_barbeiro', id);
    if (error) {
      setErro('Erro ao excluir: ' + error.message);
    } else {
      setSucesso('Barbeiro excluído com sucesso!');
      await carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  function iniciarBloqueio(id: number) {
    setBloqueando(id);
    setBlkData('');
    setBlkHoraInicio('');
    setBlkHoraFim('');
    setBlkMotivo('');
    setBlkErro('');
    setEditando(null);
  }

  async function handleBloquear(e: React.FormEvent) {
    e.preventDefault();
    if (!bloqueando) return;
    setBlkErro('');

    if (!blkData) { setBlkErro('Data é obrigatória.'); return; }
    if (blkData < hoje) { setBlkErro('Não é possível bloquear datas passadas.'); return; }
    if ((blkHoraInicio && !blkHoraFim) || (!blkHoraInicio && blkHoraFim)) {
      setBlkErro('Informe ambos os horários (início e fim) ou deixe ambos em branco para bloquear o dia inteiro.');
      return;
    }
    if (blkHoraInicio && blkHoraFim && blkHoraInicio >= blkHoraFim) {
      setBlkErro('A hora de início deve ser anterior à hora de fim.');
      return;
    }

    setBlkLoading(true);
    const { error } = await supabase.from('tb_barbeiro_indisponibilidade').insert({
      tb_barbeiro_id_barbeiro: bloqueando,
      data_bloqueio: blkData,
      hora_inicio: blkHoraInicio || null,
      hora_fim: blkHoraFim || null,
      motivo: blkMotivo.trim() || null,
    });
    setBlkLoading(false);

    if (error) {
      setBlkErro('Erro ao bloquear: ' + error.message);
    } else {
      setSucesso('Bloqueio cadastrado com sucesso!');
      setBloqueando(null);
      await carregarDados();
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  async function handleRemoverBloqueio(id: number) {
    if (!confirm('Remover este bloqueio?')) return;
    const { error } = await supabase.from('tb_barbeiro_indisponibilidade').delete().eq('id_indisponibilidade', id);
    if (error) {
      setErro('Erro ao remover bloqueio: ' + error.message);
    } else {
      setSucesso('Bloqueio removido.');
      await carregarDados();
      setTimeout(() => setSucesso(''), 3000);
    }
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 className="page-title">Barbeiros</h1>
          <p className="page-subtitle">Gerencie os barbeiros da barbearia.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormErro(''); }}>
          {showForm ? '✕ Cancelar' : '+ Novo Barbeiro'}
        </button>
      </div>

      {erro && (
        <div className="alert alert-error">
          ❌ {erro}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>✕</button>
        </div>
      )}
      {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}

      {/* Formulário de cadastro */}
      {showForm && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 className="card-title" style={{ marginBottom: 20 }}>Novo Barbeiro</h3>
          <form onSubmit={handleCadastrar} noValidate>
            {formErro && <div className="alert alert-error">❌ {formErro}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome completo"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="barbeiro@email.com"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telefone <span className="required">*</span></label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="(84) 99999-9999"
                  value={formTelefone}
                  onChange={e => setFormTelefone(formatarTelefone(e.target.value))}
                  maxLength={15}
                />
                {formTelefone && !validarTelefone(formTelefone).valido && (
                  <span className="form-error">{validarTelefone(formTelefone).erro}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Especialidade</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Corte e Barba"
                  value={formEspecialidade}
                  onChange={e => setFormEspecialidade(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? <><span className="spinner-sm"></span> Salvando...</> : 'Cadastrar Barbeiro'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de barbeiros */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 60, justifyContent: 'center' }}>
          <div className="loading-spinner"></div>
          Carregando barbeiros...
        </div>
      ) : barbeiros.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✂️</div>
          <p>Nenhum barbeiro cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {barbeiros.map(b => (
            <div key={b.id_barbeiro} className="barbeiro-item">
              <div className="barbeiro-header">
                <div className="barbeiro-avatar">✂️</div>
                <div className="barbeiro-info" style={{ flex: 1 }}>
                  <h3>{b.nome_barbeiro}</h3>
                  <p>
                    {b.especialidade_barbeiro && <span>{b.especialidade_barbeiro}</span>}
                    {b.email_barbeiro && <span style={{ marginLeft: 8 }}>• {b.email_barbeiro}</span>}
                    {b.telefone_barbeiro && <span style={{ marginLeft: 8 }}>• {b.telefone_barbeiro}</span>}
                  </p>
                </div>
              </div>

              <div className="barbeiro-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => editando === b.id_barbeiro ? setEditando(null) : iniciarEdicao(b)}
                >
                  {editando === b.id_barbeiro ? 'Cancelar' : '✏️ Editar'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => bloqueando === b.id_barbeiro ? setBloqueando(null) : iniciarBloqueio(b.id_barbeiro)}
                >
                  {bloqueando === b.id_barbeiro ? 'Cancelar' : '🚫 Bloquear Horário'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleExcluir(b.id_barbeiro)}
                >
                  🗑️ Excluir
                </button>
              </div>

              {/* Form edição inline */}
              {editando === b.id_barbeiro && (
                <div className="barbeiro-detail">
                  <div className="inline-form">
                    <h4 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: '0.95rem' }}>
                      Editar Barbeiro
                    </h4>
                    <form onSubmit={handleEditar} noValidate>
                      {editErro && <div className="alert alert-error">❌ {editErro}</div>}
                      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-group">
                          <label className="form-label">Nome <span className="required">*</span></label>
                          <input type="text" className="form-control" value={editNome} onChange={e => setEditNome(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">E-mail</label>
                          <input type="email" className="form-control" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Telefone <span className="required">*</span></label>
                          <input type="tel" className="form-control" placeholder="(84) 99999-9999" value={editTelefone} onChange={e => setEditTelefone(formatarTelefone(e.target.value))} maxLength={15} />
                          {editTelefone && !validarTelefone(editTelefone).valido && (
                            <span className="form-error">{validarTelefone(editTelefone).erro}</span>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Especialidade</label>
                          <input type="text" className="form-control" value={editEspecialidade} onChange={e => setEditEspecialidade(e.target.value)} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                        {editLoading ? <><span className="spinner-sm"></span> Salvando...</> : '💾 Salvar Alterações'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Form bloqueio inline */}
              {bloqueando === b.id_barbeiro && (
                <div className="barbeiro-detail">
                  <div className="inline-form">
                    <h4 style={{ color: 'var(--warning)', marginBottom: 8, fontSize: '0.95rem' }}>
                      🚫 Bloquear Disponibilidade — {b.nome_barbeiro}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>
                      Deixe os campos de horário em branco para bloquear o dia inteiro.
                    </p>
                    <form onSubmit={handleBloquear} noValidate>
                      {blkErro && <div className="alert alert-error">❌ {blkErro}</div>}
                      <div className="form-group">
                        <label className="form-label">Data <span className="required">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          value={blkData}
                          onChange={e => setBlkData(e.target.value)}
                          min={hoje}
                          required
                          style={{ maxWidth: 200 }}
                        />
                      </div>
                      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
                        <div className="form-group">
                          <label className="form-label">Hora início</label>
                          <input
                            type="time"
                            className="form-control"
                            value={blkHoraInicio}
                            onChange={e => setBlkHoraInicio(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Hora fim</label>
                          <input
                            type="time"
                            className="form-control"
                            value={blkHoraFim}
                            onChange={e => setBlkHoraFim(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Motivo</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: Folga, viagem..."
                            value={blkMotivo}
                            onChange={e => setBlkMotivo(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={blkLoading}>
                        {blkLoading ? <><span className="spinner-sm"></span> Salvando...</> : '🚫 Registrar Bloqueio'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista de bloqueios */}
      {bloqueios.length > 0 && (
        <>
          <div className="divider"></div>
          <div className="section-header">
            <h2 className="section-title">📅 Bloqueios Registrados</h2>
          </div>
          <div>
            {bloqueios.map(bl => (
              <div key={bl.id_indisponibilidade} className="bloqueio-item">
                <div className="bloqueio-info">
                  <strong>{bl.barbeiro_nome}</strong>
                  {' — '}
                  {formatarData(bl.data_bloqueio)}
                  {' '}
                  {bl.hora_inicio && bl.hora_fim
                    ? `das ${bl.hora_inicio?.substring(0, 5)} às ${bl.hora_fim?.substring(0, 5)}`
                    : '(dia inteiro)'}
                  {bl.motivo && <span style={{ color: 'var(--text-muted)' }}> — {bl.motivo}</span>}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoverBloqueio(bl.id_indisponibilidade)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
