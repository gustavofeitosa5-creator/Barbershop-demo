import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Agendamento, Indisponibilidade, formatarData, formatarHora, formatarPreco, getHojeISO } from '../lib/supabase';
import { Calendar, CheckCircle, X, AlertTriangle, Trash2, Clock, Scissors, User, Plus } from 'lucide-react';

interface BarbeiroDashboardPageProps {
  navigate: (to: string) => void;
}

export default function BarbeiroDashboardPage({ navigate }: BarbeiroDashboardPageProps) {
  const { perfil } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Indisponibilidade[]>([]);
  const [filtro, setFiltro] = useState<'pendente' | 'confirmado' | 'cancelado' | 'todos'>('pendente');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [id_barbeiro, setId_barbeiro] = useState<number | null>(null);
  
  // Formulário bloqueio
  const [dataBloqueio, setDataBloqueio] = useState('');
  const [horaBloqueioInicio, setHoraBloqueioInicio] = useState('');
  const [horaBloqueioFim, setHoraBloqueioFim] = useState('');
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [loadingBloqueio, setLoadingBloqueio] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [sucessoForm, setSucessoForm] = useState('');

  useEffect(() => {
    carregarDados();
  }, [filtro]);

  async function carregarDados() {
    if (!perfil) return;
    setLoading(true);
    setErro('');

    // Primeiro, buscar o id_barbeiro correspondente ao usuário
    const { data: barbeiroData } = await supabase
      .from('tb_barbeiro')
      .select('id_barbeiro')
      .eq('email_barbeiro', perfil.email_usuario)
      .maybeSingle();
    
    if (!barbeiroData?.id_barbeiro) {
      setErro('Erro ao carregar dados do barbeiro.');
      setLoading(false);
      return;
    }

    const id_barbeiro_value = barbeiroData.id_barbeiro;
    setId_barbeiro(id_barbeiro_value);

    // Buscar agendamentos
    let query = supabase
      .from('tb_agendamento')
      .select(`
        id_agendamento, data_agendamento, hora_agendamento, status_agendamento,
        tb_usuario_id_usuario, tb_barbeiro_id_barbeiro,
        tb_usuario ( id_usuario, nome_usuario ),
        tb_servico_has_tb_agendamento (
          tb_servico ( id_servico, tipo_servico, preco_servico )
        )
      `)
      .eq('tb_barbeiro_id_barbeiro', id_barbeiro_value)
      .order('data_agendamento', { ascending: true });

    if (filtro !== 'todos') {
      query = query.eq('status_agendamento', filtro);
    }

    const [{ data: agData, error: agError }, { data: blData, error: blError }] = await Promise.all([
      query,
      supabase
        .from('tb_barbeiro_indisponibilidade')
        .select('*')
        .eq('tb_barbeiro_id_barbeiro', id_barbeiro_value)
        .order('data_bloqueio', { ascending: false })
    ]);

    if (agError) {
      setErro('Erro ao carregar agendamentos: ' + agError.message);
    } else {
      setAgendamentos((agData || []) as unknown as Agendamento[]);
    }

    if (blError) {
      console.error('Erro ao carregar bloqueios:', blError);
    } else {
      setBloqueios((blData || []) as Indisponibilidade[]);
    }

    setLoading(false);
  }

  async function handleConfirmar(id: number) {
    if (!perfil) return;

    // Buscar dados completos do agendamento (incluindo serviços)
    const { data: agData, error: agError } = await supabase
      .from('tb_agendamento')
      .select(`
        id_agendamento, data_agendamento, hora_agendamento, status_agendamento,
        tb_barbeiro_id_barbeiro,
        tb_servico_has_tb_agendamento (
          tb_servico ( duracao_servico )
        )
      `)
      .eq('id_agendamento', id)
      .single();

    if (agError || !agData) {
      setErro('Erro ao buscar agendamento: ' + (agError?.message || 'Desconhecido'));
      return;
    }

    // Calcular duração total dos serviços
    let totalMinutos = 0;
    if (agData.tb_servico_has_tb_agendamento && agData.tb_servico_has_tb_agendamento.length > 0) {
      for (const sag of agData.tb_servico_has_tb_agendamento) {
        if (sag.tb_servico?.duracao_servico) {
          // Converter INTERVAL para minutos
          // Formato esperado: "00:30:00" ou similar
          const duracao = sag.tb_servico.duracao_servico;
          const partes = duracao.split(':');
          if (partes.length >= 2) {
            const horas = parseInt(partes[0]) || 0;
            const minutos = parseInt(partes[1]) || 0;
            totalMinutos += horas * 60 + minutos;
          }
        }
      }
    }

    // Calcular hora fim
    const [horaStr, minutosStr] = agData.hora_agendamento.split(':');
    const hora = parseInt(horaStr);
    const minutos = parseInt(minutosStr);
    const totalMinutosInicio = hora * 60 + minutos;
    const totalMinutosFim = totalMinutosInicio + totalMinutos;
    
    const horaFim = Math.floor(totalMinutosFim / 60);
    const minutosFim = totalMinutosFim % 60;
    const horaFimStr = `${String(horaFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}:00`;

    // 1. Criar bloqueio automático de indisponibilidade
    const { error: bloqueioError } = await supabase
      .from('tb_barbeiro_indisponibilidade')
      .insert({
        tb_barbeiro_id_barbeiro: id_barbeiro,
        data_bloqueio: agData.data_agendamento,
        hora_inicio: agData.hora_agendamento,
        hora_fim: horaFimStr,
        motivo: 'Agendamento confirmado',
      });

    if (bloqueioError) {
      setErro('Erro ao criar bloqueio automático: ' + bloqueioError.message);
      return;
    }

    // 2. Confirmar o agendamento
    const { error: updateError } = await supabase
      .from('tb_agendamento')
      .update({ status_agendamento: 'confirmado' })
      .eq('id_agendamento', id);

    if (updateError) {
      setErro('Erro ao confirmar: ' + updateError.message);
    } else {
      await carregarDados();
    }
  }

  async function handleCancelar(id: number) {
    if (!confirm('Confirmar cancelamento?')) return;
    
    const { error } = await supabase
      .from('tb_agendamento')
      .update({ status_agendamento: 'cancelado' })
      .eq('id_agendamento', id);

    if (error) {
      setErro('Erro ao cancelar: ' + error.message);
    } else {
      await carregarDados();
    }
  }

  async function handleAdicionarBloqueio(e: React.FormEvent) {
    e.preventDefault();
    setErroForm('');
    setSucessoForm('');

    if (!dataBloqueio) {
      setErroForm('Data é obrigatória.');
      return;
    }

    if (!perfil || !id_barbeiro) return;

    setLoadingBloqueio(true);

    const { error } = await supabase
      .from('tb_barbeiro_indisponibilidade')
      .insert({
        tb_barbeiro_id_barbeiro: id_barbeiro,
        data_bloqueio: dataBloqueio,
        hora_inicio: horaBloqueioInicio || null,
        hora_fim: horaBloqueioFim || null,
        motivo: motivoBloqueio || null,
      });

    setLoadingBloqueio(false);

    if (error) {
      setErroForm('Erro ao registrar bloqueio: ' + error.message);
    } else {
      setSucessoForm('Bloqueio registrado com sucesso!');
      setDataBloqueio('');
      setHoraBloqueioInicio('');
      setHoraBloqueioFim('');
      setMotivoBloqueio('');
      await carregarDados();
      setTimeout(() => setSucessoForm(''), 3000);
    }
  }

  async function handleRemoverBloqueio(id: number) {
    if (!confirm('Remover este bloqueio?')) return;

    const { error } = await supabase
      .from('tb_barbeiro_indisponibilidade')
      .delete()
      .eq('id_indisponibilidade', id);

    if (error) {
      setErro('Erro ao remover bloqueio: ' + error.message);
    } else {
      await carregarDados();
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title"><Calendar size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Meus Agendamentos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus agendamentos e disponibilidade</p>
      </div>

      {erro && <div className="alert alert-error"><AlertTriangle size={20} /> {erro}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
        <button
          onClick={() => setFiltro('pendente')}
          style={{
            background: 'none',
            border: 'none',
            color: filtro === 'pendente' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: filtro === 'pendente' ? 600 : 400,
            borderBottom: filtro === 'pendente' ? '3px solid var(--color-primary)' : 'none',
            paddingBottom: 8,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <Clock size={18} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pendentes
        </button>
        <button
          onClick={() => setFiltro('confirmado')}
          style={{
            background: 'none',
            border: 'none',
            color: filtro === 'confirmado' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: filtro === 'confirmado' ? 600 : 400,
            borderBottom: filtro === 'confirmado' ? '3px solid var(--color-primary)' : 'none',
            paddingBottom: 8,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <CheckCircle size={18} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Confirmados
        </button>
        <button
          onClick={() => setFiltro('todos')}
          style={{
            background: 'none',
            border: 'none',
            color: filtro === 'todos' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: filtro === 'todos' ? 600 : 400,
            borderBottom: filtro === 'todos' ? '3px solid var(--color-primary)' : 'none',
            paddingBottom: 8,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <Calendar size={18} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Todos
        </button>
      </div>

      {/* Seção Agendamentos */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>Agendamentos</h2>
        
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
            <div className="loading-spinner"></div> Carregando...
          </div>
        ) : agendamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {agendamentos.map(ag => (
              <div key={ag.id_agendamento} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cliente</p>
                    <p style={{ fontWeight: 600 }}>{ag.tb_usuario?.nome_usuario || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</p>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          ag.status_agendamento === 'pendente'
                            ? '#ffa500'
                            : ag.status_agendamento === 'confirmado'
                              ? '#28a745'
                              : '#dc3545',
                      }}
                    >
                      {ag.status_agendamento === 'pendente' && <><Clock size={16} style={{ marginRight: 4 }} /> Pendente</>}
                      {ag.status_agendamento === 'confirmado' && <><CheckCircle size={16} style={{ marginRight: 4 }} /> Confirmado</>}
                      {ag.status_agendamento === 'cancelado' && <><X size={16} style={{ marginRight: 4 }} /> Cancelado</>}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Data</p>
                    <p style={{ fontWeight: 600 }}>{formatarData(ag.data_agendamento)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Horário</p>
                    <p style={{ fontWeight: 600 }}>{formatarHora(ag.hora_agendamento)}</p>
                  </div>
                </div>

                {/* Serviços */}
                {ag.tb_servico_has_tb_agendamento && ag.tb_servico_has_tb_agendamento.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Serviços</p>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {ag.tb_servico_has_tb_agendamento.map((sag, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span>{sag.tb_servico.tipo_servico}</span>
                          <span style={{ fontWeight: 600 }}>{formatarPreco(sag.tb_servico.preco_servico)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações */}
                {ag.status_agendamento === 'pendente' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleConfirmar(ag.id_agendamento)}
                    >
                      <CheckCircle size={16} style={{ marginRight: 4 }} /> Confirmar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelar(ag.id_agendamento)}
                    >
                      <X size={16} style={{ marginRight: 4 }} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção Bloqueios */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}><Ban size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Bloquear Disponibilidade</h2>
        
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          {erroForm && <div className="alert alert-error"><AlertTriangle size={20} /> {erroForm}</div>}
          {sucessoForm && <div className="alert alert-success"><CheckCircle size={20} /> {sucessoForm}</div>}
          
          <form onSubmit={handleAdicionarBloqueio} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Data <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  value={dataBloqueio}
                  onChange={e => setDataBloqueio(e.target.value)}
                  min={getHojeISO()}
                  required
                />
              </div>
              <div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Hora início</label>
                <input
                  type="time"
                  className="form-control"
                  value={horaBloqueioInicio}
                  onChange={e => setHoraBloqueioInicio(e.target.value)}
                  placeholder="HH:MM"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hora fim</label>
                <input
                  type="time"
                  className="form-control"
                  value={horaBloqueioFim}
                  onChange={e => setHoraBloqueioFim(e.target.value)}
                  placeholder="HH:MM"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Almoço, Folga..."
                  value={motivoBloqueio}
                  onChange={e => setMotivoBloqueio(e.target.value)}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Deixe os horários em branco para bloquear o dia inteiro.
            </p>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loadingBloqueio}
            >
              {loadingBloqueio ? <><span className="spinner-sm"></span> Registrando...</> : '🚫 Registrar Bloqueio'}
            </button>
          </form>
        </div>

        {/* Lista de Bloqueios */}
        {bloqueios.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Bloqueios Registrados</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {bloqueios.map(bl => (
                <div key={bl.id_indisponibilidade} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 6 }}>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{formatarData(bl.data_bloqueio)}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {bl.hora_inicio && bl.hora_fim ? `${bl.hora_inicio} - ${bl.hora_fim}` : 'Dia inteiro'}
                      {bl.motivo && ` • ${bl.motivo}`}
                    </p>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoverBloqueio(bl.id_indisponibilidade)}
                  >
                    <Trash2 size={16} style={{ marginRight: 4 }} /> Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
