import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Agendamento, formatarData, formatarHora, formatarPreco, isDataPassada } from '../lib/supabase';

interface HistoricoPageProps {
  navigate: (to: string, params?: Record<string, string>) => void;
  goBack?: () => void;
}

export default function HistoricoPage({ navigate, goBack }: HistoricoPageProps) {
  const { user, perfil } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cancelando, setCancelando] = useState<number | null>(null);

  useEffect(() => {
    if (user) carregarHistorico();
  }, [user]);

  async function carregarHistorico() {
    if (!user) return;
    setLoading(true);
    setErro('');

    const { data, error } = await supabase
      .from('tb_agendamento')
      .select(`
        id_agendamento, data_agendamento, hora_agendamento, status_agendamento,
        tb_usuario_id_usuario, tb_barbeiro_id_barbeiro,
        tb_barbeiro ( id_barbeiro, nome_barbeiro ),
        tb_servico_has_tb_agendamento (
          tb_servico ( id_servico, tipo_servico, preco_servico )
        )
      `)
      .eq('tb_usuario_id_usuario', perfil?.id_usuario)
      .order('data_agendamento', { ascending: false });

    if (error) {
      setErro('Erro ao carregar histórico: ' + error.message);
    } else {
      setAgendamentos((data || []) as unknown as Agendamento[]);
    }
    setLoading(false);
  }

  async function handleCancelar(ag: Agendamento) {
    if (!confirm('Confirmar cancelamento deste agendamento?')) return;
    setCancelando(ag.id_agendamento);

    const { error } = await supabase
      .from('tb_agendamento')
      .update({ status_agendamento: 'cancelado' })
      .eq('id_agendamento', ag.id_agendamento)
      .eq('tb_usuario_id_usuario', perfil!.id_usuario); // RN05: apenas o próprio usuário

    if (error) {
      setErro('Erro ao cancelar: ' + error.message);
    } else {
      setSucesso('Agendamento cancelado com sucesso.');
      await carregarHistorico();
      setTimeout(() => setSucesso(''), 4000);
    }
    setCancelando(null);
  }

  function handleReagendar(ag: Agendamento) {
    const barbeiro = (ag.tb_barbeiro as { id_barbeiro: number; nome_barbeiro: string } | undefined);
    navigate('agendar', {
      reagendar: '1',
      barbeiro: String(barbeiro?.id_barbeiro || ''),
      data: ag.data_agendamento,
      hora: ag.hora_agendamento.substring(0, 5),
    });
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

  function podeCancel(ag: Agendamento): boolean {
    if (ag.status_agendamento === 'cancelado') return false;
    return !isDataPassada(ag.data_agendamento, ag.hora_agendamento);
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 className="page-title">Meus Agendamentos</h1>
          <p className="page-subtitle">
            Olá, {perfil?.nome_usuario?.split(' ')[0]}! Aqui estão todos os seus agendamentos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate('agendar')}>
            + Novo Agendamento
          </button>
          <button className="btn btn-secondary" onClick={() => goBack ? goBack() : navigate('index')}>
            ← Voltar
          </button>
        </div>
      </div>

      {erro && (
        <div className="alert alert-error">
          ❌ {erro}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>✕</button>
        </div>
      )}
      {sucesso && <div className="alert alert-success">✅ {sucesso}</div>}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 60, justifyContent: 'center' }}>
          <div className="loading-spinner"></div>
          Carregando seus agendamentos...
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="historico-empty">
          <div className="empty-icon">📭</div>
          <h3>Nenhum agendamento encontrado</h3>
          <p>Você ainda não fez nenhum agendamento. Que tal marcar agora?</p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('agendar')}>
            Fazer Primeiro Agendamento
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Barbeiro</th>
                <th>Serviços</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(ag => {
                const barbeiro = ag.tb_barbeiro as { id_barbeiro: number; nome_barbeiro: string } | undefined;
                const passado = isDataPassada(ag.data_agendamento, ag.hora_agendamento);
                return (
                  <tr key={ag.id_agendamento} style={{ opacity: ag.status_agendamento === 'cancelado' ? 0.6 : 1 }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{ag.id_agendamento}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatarData(ag.data_agendamento)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {formatarHora(ag.hora_agendamento)}
                      </strong>
                    </td>
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
                      {passado && ag.status_agendamento !== 'cancelado' && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Realizado
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReagendar(ag)}
                          title="Reagendar com os mesmos dados"
                        >
                          🔄 Reagendar
                        </button>
                        {podeCancel(ag) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelar(ag)}
                            disabled={cancelando === ag.id_agendamento}
                          >
                            {cancelando === ag.id_agendamento
                              ? <span className="spinner-sm"></span>
                              : '✕ Cancelar'}
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
