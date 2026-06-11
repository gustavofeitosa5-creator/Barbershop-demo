import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Agendamento, formatarData, formatarHora, getHojeISO, formatarPreco } from '../lib/supabase';
import { Calendar, Scissors, Clock, Briefcase, Plus, RefreshCw, Inbox, AlertTriangle } from 'lucide-react';

interface DashboardPageProps {
  navigate: (to: string) => void;
}

interface MetricasDia {
  totalAgendamentos: number;
  barbeirosAtivos: number;
  proximoHorario: string;
}

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const { perfil } = useAuth();
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([]);
  const [metricas, setMetricas] = useState<MetricasDia>({ totalAgendamentos: 0, barbeirosAtivos: 0, proximoHorario: '—' });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const hoje = getHojeISO();
  const agoraStr = new Date().toTimeString().substring(0, 5);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro('');
    try {
      // Agendamentos de hoje com JOINs
      const { data: agendamentos, error: errAg } = await supabase
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
        .eq('data_agendamento', hoje)
        .neq('status_agendamento', 'cancelado')
        .order('hora_agendamento', { ascending: true });

      if (errAg) throw errAg;

      const ag = (agendamentos || []) as unknown as Agendamento[];
      setAgendamentosHoje(ag);

      // Próximo horário
      const futuros = ag.filter(a => a.hora_agendamento.substring(0, 5) >= agoraStr);
      const proximo = futuros.length > 0 ? formatarHora(futuros[0].hora_agendamento) : '—';

      // Barbeiros ativos
      const { count: barbeirosCount } = await supabase
        .from('tb_barbeiro')
        .select('id_barbeiro', { count: 'exact', head: true });

      setMetricas({
        totalAgendamentos: ag.length,
        barbeirosAtivos: barbeirosCount || 0,
        proximoHorario: proximo,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro('Erro ao carregar dados: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  function getBadgeClass(status: string) {
    if (status === 'confirmado') return 'badge badge-confirmado';
    if (status === 'cancelado') return 'badge badge-cancelado';
    return 'badge badge-pendente';
  }

  function getServicosNomes(ag: Agendamento): string {
    if (!ag.tb_servico_has_tb_agendamento || ag.tb_servico_has_tb_agendamento.length === 0) return '—';
    return ag.tb_servico_has_tb_agendamento
      .map(s => s.tb_servico?.tipo_servico || '')
      .filter(Boolean)
      .join(', ');
  }

  function getValorTotal(ag: Agendamento): number {
    if (!ag.tb_servico_has_tb_agendamento) return 0;
    return ag.tb_servico_has_tb_agendamento.reduce((sum, s) => sum + (s.tb_servico?.preco_servico || 0), 0);
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Olá, {perfil?.nome_usuario?.split(' ')[0] || 'Admin'}! Aqui está o resumo do dia — {formatarData(hoje)}.
        </p>
      </div>

      {erro && <div className="alert alert-error"><AlertTriangle size={20} /> {erro}</div>}

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><Calendar size={28} /></div>
          <div className="metric-value">{loading ? '—' : metricas.totalAgendamentos}</div>
          <div className="metric-label">Agendamentos hoje</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Scissors size={28} /></div>
          <div className="metric-value">{loading ? '—' : metricas.barbeirosAtivos}</div>
          <div className="metric-label">Barbeiros cadastrados</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Clock size={28} /></div>
          <div className="metric-value" style={{ fontSize: '1.8rem' }}>
            {loading ? '—' : metricas.proximoHorario}
          </div>
          <div className="metric-label">Próximo atendimento</div>
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div className="section-header">
        <h2 className="section-title">Acesso Rápido</h2>
      </div>

      <div className="quick-actions" style={{ marginBottom: 40 }}>
        <button className="quick-action-btn" onClick={() => navigate('admin-barbeiros')}>
          <span className="action-icon"><Scissors size={24} /></span>
          <span className="action-label">Gerenciar Barbeiros</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('admin-servicos')}>
          <span className="action-icon"><Briefcase size={24} /></span>
          <span className="action-label">Gerenciar Serviços</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('admin-agendamentos')}>
          <span className="action-icon"><Calendar size={24} /></span>
          <span className="action-label">Ver Agendamentos</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('agendar')}>
          <span className="action-icon"><Plus size={24} /></span>
          <span className="action-label">Novo Agendamento</span>
        </button>
      </div>

      {/* Agendamentos do dia */}
      <div className="section-header">
        <h2 className="section-title">Agendamentos de Hoje</h2>
        <button className="btn btn-secondary btn-sm" onClick={carregarDados}>
          <RefreshCw size={16} style={{ marginRight: 4 }} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 40 }}>
          <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
          Carregando agendamentos...
        </div>
      ) : agendamentosHoje.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Inbox size={48} /></div>
          <p>Nenhum agendamento para hoje.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Serviços</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentosHoje.map(ag => (
                <tr key={ag.id_agendamento}>
                  <td>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {formatarHora(ag.hora_agendamento)}
                    </strong>
                  </td>
                  <td>{((ag.tb_usuario as unknown) as { nome_usuario: string } | undefined)?.nome_usuario || '—'}</td>
                  <td>{((ag.tb_barbeiro as unknown) as { nome_barbeiro: string } | undefined)?.nome_barbeiro || '—'}</td>
                  <td>
                    <div className="tags-list">
                      {getServicosNomes(ag).split(', ').map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {formatarPreco(getValorTotal(ag))}
                  </td>
                  <td>
                    <span className={getBadgeClass(ag.status_agendamento)}>
                      {ag.status_agendamento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {agendamentosHoje.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('admin-agendamentos')}>
            Ver todos os agendamentos →
          </button>
        </div>
      )}
    </div>
  );
}
