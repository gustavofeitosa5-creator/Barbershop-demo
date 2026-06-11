import { useState, useEffect } from 'react';
import { supabase, Agendamento, Barbeiro, formatarData, formatarHora, formatarPreco } from '../lib/supabase';

interface AgendamentosAdminPageProps {
  navigate: (to: string) => void;
}

export default function AgendamentosAdminPage({ navigate }: AgendamentosAdminPageProps) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Filtros
  const [filtroData, setFiltroData] = useState('');
  const [filtroBarbeiro, setFiltroBarbeiro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Status edit
  const [editandoStatus, setEditandoStatus] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState<number | null>(null);

  useEffect(() => {
    carregarBarbeiros();
    carregarAgendamentos();
  }, []);

  async function carregarBarbeiros() {
    const { data } = await supabase.from('tb_barbeiro').select('*').order('nome_barbeiro');
    setBarbeiros((data || []) as Barbeiro[]);
  }

  async function carregarAgendamentos() {
    setLoading(true);
    setErro('');

    let query = supabase
      .from('tb_agendamento')
      .select(`
        id_agendamento, data_agendamento, hora_agendamento, status_agendamento,
        tb_usuario_id_usuario, tb_barbeiro_id_barbeiro,
        tb_usuario ( nome_usuario ),
        tb_barbeiro ( id_barbeiro, nome_barbeiro ),
        tb_servico_has_tb_agendamento (
          tb_servico ( id_servico, tipo_servico, preco_servico )
        )
      `)
      .order('data_agendamento', { ascending: false })
      .order('hora_agendamento', { ascending: true });

    if (filtroData) query = query.eq('data_agendamento', filtroData);
    if (filtroBarbeiro) query = query.eq('tb_barbeiro_id_barbeiro', parseInt(filtroBarbeiro));
    if (filtroStatus) query = query.eq('status_agendamento', filtroStatus);

    const { data, error } = await query;

    if (error) {
      setErro('Erro ao carregar agendamentos: ' + error.message);
    } else {
      const ags = (data || []) as unknown as Agendamento[];
      setAgendamentos(ags);
      // Inicializar status editable
      const statusMap: Record<number, string> = {};
      ags.forEach(ag => { statusMap[ag.id_agendamento] = ag.status_agendamento; });
      setEditandoStatus(statusMap);
    }
    setLoading(false);
  }

  function handleFiltrar(e: React.FormEvent) {
    e.preventDefault();
    carregarAgendamentos();
  }

  function limparFiltros() {
    setFiltroData('');
    setFiltroBarbeiro('');
    setFiltroStatus('');
    setTimeout(carregarAgendamentos, 50);
  }

  async function handleSalvarStatus(ag: Agendamento) {
    const novoStatus = editandoStatus[ag.id_agendamento];
    if (!novoStatus || novoStatus === ag.status_agendamento) return;

    setSalvando(ag.id_agendamento);
    const { error } = await supabase
      .from('tb_agendamento')
      .update({ status_agendamento: novoStatus })
      .eq('id_agendamento', ag.id_agendamento);

    if (error) {
      setErro('Erro ao atualizar status: ' + error.message);
    } else {
      setSucesso('Status atualizado com sucesso!');
      await carregarAgendamentos();
      setTimeout(() => setSucesso(''), 3000);
    }
    setSalvando(null);
  }

  async function handleCancelar(ag: Agendamento) {
    if (ag.status_agendamento === 'cancelado') return;
    if (!confirm(`Cancelar agendamento #${ag.id_agendamento}?`)) return;

    setSalvando(ag.id_agendamento);
    const { error } = await supabase
      .from('tb_agendamento')
      .update({ status_agendamento: 'cancelado' })
      .eq('id_agendamento', ag.id_agendamento);

    if (error) {
      setErro('Erro ao cancelar: ' + error.message);
    } else {
      setSucesso('Agendamento cancelado.');
      await carregarAgendamentos();
      setTimeout(() => setSucesso(''), 3000);
    }
    setSalvando(null);
  }

  function getBadgeClass(status: string) {
    if (status === 'confirmado') return 'badge badge-confirmado';
    if (status === 'cancelado') return 'badge badge-cancelado';
    return 'badge badge-pendente';
  }

  function getValorTotal(ag: Agendamento): number {
    if (!ag.tb_servico_has_tb_agendamento) return 0;
    return ag.tb_servico_has_tb_agendamento.reduce((sum, s) => sum + (s.tb_servico?.preco_servico || 0), 0);
  }

  function getServicos(ag: Agendamento): string[] {
    if (!ag.tb_servico_has_tb_agendamento) return [];
    return ag.tb_servico_has_tb_agendamento
      .map(s => s.tb_servico?.tipo_servico || '')
      .filter(Boolean);
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">Gerencie todos os agendamentos da barbearia.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('agendar')}>
          + Novo Agendamento
        </button>
      </div>

      {erro && (
        <div className="alert alert-error">
          ❌ {erro}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>✕</button>
        </div>
      )}
      {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}

      {/* Filtros */}
      <form className="filters-bar" onSubmit={handleFiltrar}>
        <div className="form-group">
          <label className="form-label">Data</label>
          <input
            type="date"
            className="form-control"
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Barbeiro</label>
          <select
            className="form-control"
            value={filtroBarbeiro}
            onChange={e => setFiltroBarbeiro(e.target.value)}
          >
            <option value="">Todos</option>
            {barbeiros.map(b => (
              <option key={b.id_barbeiro} value={b.id_barbeiro}>{b.nome_barbeiro}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">🔍 Filtrar</button>
        <button type="button" className="btn btn-secondary" onClick={limparFiltros}>✕ Limpar</button>
      </form>

      {/* Resultado */}
      <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {!loading && `${agendamentos.length} agendamento(s) encontrado(s)`}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 60, justifyContent: 'center' }}>
          <div className="loading-spinner"></div>
          Carregando agendamentos...
        </div>
      ) : agendamentos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
          <p>Nenhum agendamento encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Serviços</th>
                <th>Valor</th>
                <th>Status Atual</th>
                <th>Alterar Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(ag => {
                const usuario = ag.tb_usuario as { nome_usuario: string } | undefined;
                const barbeiro = ag.tb_barbeiro as { nome_barbeiro: string } | undefined;
                return (
                  <tr key={ag.id_agendamento} style={{ opacity: ag.status_agendamento === 'cancelado' ? 0.65 : 1 }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{ag.id_agendamento}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatarData(ag.data_agendamento)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {formatarHora(ag.hora_agendamento)}
                      </strong>
                    </td>
                    <td>{usuario?.nome_usuario || '—'}</td>
                    <td>{barbeiro?.nome_barbeiro || '—'}</td>
                    <td>
                      <div className="tags-list">
                        {getServicos(ag).map((s, i) => (
                          <span key={i} className="tag">{s}</span>
                        ))}
                        {getServicos(ag).length === 0 && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {formatarPreco(getValorTotal(ag))}
                      </strong>
                    </td>
                    <td>
                      <span className={getBadgeClass(ag.status_agendamento)}>
                        {ag.status_agendamento}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          className="status-select"
                          value={editandoStatus[ag.id_agendamento] || ag.status_agendamento}
                          onChange={e => setEditandoStatus(prev => ({
                            ...prev,
                            [ag.id_agendamento]: e.target.value
                          }))}
                          disabled={ag.status_agendamento === 'cancelado'}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleSalvarStatus(ag)}
                          disabled={
                            salvando === ag.id_agendamento ||
                            ag.status_agendamento === 'cancelado' ||
                            editandoStatus[ag.id_agendamento] === ag.status_agendamento
                          }
                          title="Salvar novo status"
                        >
                          {salvando === ag.id_agendamento ? <span className="spinner-sm"></span> : '💾'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="td-actions">
                        {ag.status_agendamento !== 'cancelado' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelar(ag)}
                            disabled={salvando === ag.id_agendamento}
                          >
                            ✕ Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
