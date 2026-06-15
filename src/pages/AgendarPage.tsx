import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  supabase, Barbeiro, Servico,
  formatarPreco, formatarDuracao, getHojeISO, HORARIOS_FUNCIONAMENTO
} from '../lib/supabase';
import { Calendar, Clock, AlertTriangle, Info, CheckCircle, RotateCcw, Scissors, DollarSign } from 'lucide-react';

interface AgendarPageProps {
  navigate: (to: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export default function AgendarPage({ navigate, params = {} }: AgendarPageProps) {
  const { user, perfil } = useAuth();

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  // Form fields
  const [barbeiroId, setBarbeiroId] = useState(params.barbeiro || '');
  const [data, setData] = useState(params.data || '');
  const [horarioSelecionado, setHorarioSelecionado] = useState(params.hora || '');
  const [servicosSelecionados, setServicosSelecionados] = useState<number[]>([]);

  // Horários disponíveis
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [horariosCarregados, setHorariosCarregados] = useState(false);

  // Form feedback
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const hoje = getHojeISO();
  const isReagendamento = params.reagendar === '1';

  // Verificar se o usuário logado é um barbeiro e obter seu ID
  const usuarioEhBarbeiro = perfil?.tipo_usuario === 'barbeiro';
  const idBarbeiroLogado = usuarioEhBarbeiro ? perfil?.id_usuario : null;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoadingDados(true);
    const [{ data: bsData }, { data: svData }] = await Promise.all([
      supabase.from('tb_barbeiro').select('*').order('nome_barbeiro'),
      supabase.from('tb_servico').select('*').order('tipo_servico'),
    ]);
    
    let barbeirosList = (bsData || []) as Barbeiro[];
    
    // Regra de negócio: Barbeiro não pode agendar consigo mesmo
    // Filtra o próprio barbeiro da lista se o usuário logado for um barbeiro
    if (usuarioEhBarbeiro && idBarbeiroLogado) {
      barbeirosList = barbeirosList.filter(b => b.id_barbeiro !== idBarbeiroLogado);
    }
    
    setBarbeiros(barbeirosList);
    setServicos((svData || []) as Servico[]);
    setLoadingDados(false);
  }

  const buscarHorarios = useCallback(async () => {
    if (!barbeiroId || !data) return;

    setLoadingHorarios(true);
    setHorariosCarregados(false);
    setHorarioSelecionado('');

    try {
      // 1. Buscar agendamentos já ocupados
      const { data: agendados } = await supabase
        .from('tb_agendamento')
        .select('hora_agendamento')
        .eq('tb_barbeiro_id_barbeiro', parseInt(barbeiroId))
        .eq('data_agendamento', data)
        .neq('status_agendamento', 'cancelado');

      const ocupados = new Set((agendados || []).map((a: { hora_agendamento: string }) => a.hora_agendamento.substring(0, 5)));

      // 2. Buscar bloqueios do barbeiro para a data
      const { data: bloqueios } = await supabase
        .from('tb_barbeiro_indisponibilidade')
        .select('hora_inicio, hora_fim')
        .eq('tb_barbeiro_id_barbeiro', parseInt(barbeiroId))
        .eq('data_bloqueio', data);

      // 3. Verificar se dia inteiro está bloqueado
      const diaBloqueado = (bloqueios || []).some(
        (b: { hora_inicio: string | null; hora_fim: string | null }) => b.hora_inicio === null && b.hora_fim === null
      );

      if (diaBloqueado) {
        setHorariosDisponiveis([]);
        setHorariosCarregados(true);
        setLoadingHorarios(false);
        return;
      }

      // 4. Filtrar horários
      const agora = new Date();
      const isHoje = data === hoje;

      const disponiveis = HORARIOS_FUNCIONAMENTO.filter(horario => {
        // Verificar se está ocupado
        if (ocupados.has(horario)) return false;

        // Verificar se passou (para hoje)
        if (isHoje) {
          const [hh, mm] = horario.split(':').map(Number);
          const horarioDate = new Date();
          horarioDate.setHours(hh, mm, 0, 0);
          if (horarioDate <= agora) return false;
        }

        // Verificar bloqueios de intervalo
        for (const bloqueio of (bloqueios || [])) {
          const b = bloqueio as { hora_inicio: string | null; hora_fim: string | null };
          if (b.hora_inicio && b.hora_fim) {
            const hiStr = b.hora_inicio.substring(0, 5);
            const hfStr = b.hora_fim.substring(0, 5);
            if (horario >= hiStr && horario < hfStr) return false;
          }
        }

        return true;
      });

      setHorariosDisponiveis(disponiveis);
    } catch {
      setHorariosDisponiveis([]);
    } finally {
      setLoadingHorarios(false);
      setHorariosCarregados(true);
    }
  }, [barbeiroId, data, hoje]);

  useEffect(() => {
    if (barbeiroId && data) {
      buscarHorarios();
    } else {
      setHorariosDisponiveis([]);
      setHorariosCarregados(false);
      setHorarioSelecionado('');
    }
  }, [barbeiroId, data, buscarHorarios]);

  function toggleServico(id: number) {
    setServicosSelecionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function getValorTotal(): number {
    return servicos
      .filter(s => servicosSelecionados.includes(s.id_servico))
      .reduce((sum, s) => sum + s.preco_servico, 0);
  }

  function getBarbeiroSelecionado(): Barbeiro | undefined {
    return barbeiros.find(b => b.id_barbeiro === parseInt(barbeiroId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    // Validações client-side
    if (!barbeiroId) { setErro('Selecione um barbeiro.'); return; }
    if (!data) { setErro('Selecione uma data.'); return; }
    if (data < hoje) { setErro('Não é possível agendar para datas passadas.'); return; }
    if (!horarioSelecionado) { setErro('Selecione um horário.'); return; }
    if (servicosSelecionados.length === 0) { setErro('Selecione pelo menos um serviço.'); return; }

    // Verificar horário passado no dia atual
    if (data === hoje) {
      const [hh, mm] = horarioSelecionado.split(':').map(Number);
      const horarioDate = new Date();
      horarioDate.setHours(hh, mm, 0, 0);
      if (horarioDate <= new Date()) {
        setErro('Este horário já passou. Selecione um horário futuro.');
        return;
      }
    }

    if (!user) { setErro('Você precisa estar logado para agendar.'); return; }

    setLoading(true);

    // Verificação server-side de conflito (RN01)
    const { data: conflito } = await supabase
      .from('tb_agendamento')
      .select('id_agendamento')
      .eq('tb_barbeiro_id_barbeiro', parseInt(barbeiroId))
      .eq('data_agendamento', data)
      .eq('hora_agendamento', horarioSelecionado + ':00')
      .neq('status_agendamento', 'cancelado')
      .single();

    if (conflito) {
      setErro('Este horário já foi reservado. Por favor, escolha outro horário.');
      setLoading(false);
      await buscarHorarios();
      return;
    }

    // Verificação de bloqueios (RN03)
    const { data: bloqueioDia } = await supabase
      .from('tb_barbeiro_indisponibilidade')
      .select('id_indisponibilidade, hora_inicio, hora_fim')
      .eq('tb_barbeiro_id_barbeiro', parseInt(barbeiroId))
      .eq('data_bloqueio', data);

    if (bloqueioDia && bloqueioDia.length > 0) {
      for (const b of bloqueioDia) {
        const bl = b as { hora_inicio: string | null; hora_fim: string | null };
        if (!bl.hora_inicio && !bl.hora_fim) {
          setErro('O barbeiro está indisponível neste dia.');
          setLoading(false);
          return;
        }
        if (bl.hora_inicio && bl.hora_fim) {
          const hiStr = bl.hora_inicio.substring(0, 5);
          const hfStr = bl.hora_fim.substring(0, 5);
          if (horarioSelecionado >= hiStr && horarioSelecionado < hfStr) {
            setErro(`O barbeiro está indisponível das ${hiStr} às ${hfStr}.`);
            setLoading(false);
            return;
          }
        }
      }
    }

    // Criar agendamento
    const { data: agendamento, error: errAg } = await supabase
      .from('tb_agendamento')
      .insert({
        data_agendamento: data,
        hora_agendamento: horarioSelecionado + ':00',
        status_agendamento: 'pendente',
        tb_usuario_id_usuario: perfil?.id_usuario,
        tb_barbeiro_id_barbeiro: parseInt(barbeiroId),
      })
      .select('id_agendamento')
      .single();

    if (errAg || !agendamento) {
      setErro('Erro ao criar agendamento: ' + (errAg?.message || 'Tente novamente.'));
      setLoading(false);
      return;
    }

    // Inserir relações N:N de serviços
    const registros = servicosSelecionados.map(sid => ({
      tb_servico_id_servico: sid,
      tb_agendamento_id_agendamento: (agendamento as { id_agendamento: number }).id_agendamento,
    }));

    const { error: errServicos } = await supabase
      .from('tb_servico_has_tb_agendamento')
      .insert(registros);

    if (errServicos) {
      setErro('Agendamento criado, mas erro ao vincular serviços: ' + errServicos.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('historico');
  }

  const barbeiro = getBarbeiroSelecionado();
  const servicosEscolhidos = servicos.filter(s => servicosSelecionados.includes(s.id_servico));

  if (loadingDados) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: 80, justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
        Carregando formulário...
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">
          {isReagendamento ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={24} /> Reagendar
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={24} /> Fazer Agendamento
            </span>
          )}
        </h1>
        <p className="page-subtitle">
          Olá, {perfil?.nome_usuario?.split(' ')[0]}! Escolha o barbeiro, serviço, data e horário.
        </p>
      </div>

      {erro && (
        <div className="alert alert-error">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          {erro}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => setErro('')}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="agendar-layout">
          {/* Coluna principal */}
          <div>
            {/* Barbeiro */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>1. Escolha o Barbeiro</h3>
              {barbeiros.length === 0 ? (
                usuarioEhBarbeiro ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    Não há outros barbeiros disponíveis para agendamento.
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    Nenhum barbeiro disponível no momento.
                  </div>
                )
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {barbeiros.map(b => (
                    <label
                      key={b.id_barbeiro}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        background: barbeiroId === String(b.id_barbeiro) ? 'var(--color-primary-dim)' : 'var(--bg-input)',
                        border: `1px solid ${barbeiroId === String(b.id_barbeiro) ? 'var(--color-primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <input
                        type="radio"
                        name="barbeiro"
                        value={String(b.id_barbeiro)}
                        checked={barbeiroId === String(b.id_barbeiro)}
                        onChange={e => setBarbeiroId(e.target.value)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{b.nome_barbeiro}</div>
                        {b.especialidade_barbeiro && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.especialidade_barbeiro}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Serviços */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 4 }}>2. Selecione os Serviços</h3>
              <p className="form-hint" style={{ marginBottom: 16 }}>Você pode selecionar mais de um serviço.</p>
              {servicos.length === 0 ? (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  Nenhum serviço disponível.
                </div>
              ) : (
                <div className="checkbox-group">
                  {servicos.map(s => (
                    <label key={s.id_servico} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={servicosSelecionados.includes(s.id_servico)}
                        onChange={() => toggleServico(s.id_servico)}
                      />
                      <label style={{ flex: 1, cursor: 'pointer' }}>
                        <span style={{ fontWeight: 500 }}>{s.tipo_servico}</span>
                        {s.descricao_servico && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 6 }}>
                            — {s.descricao_servico}
                          </span>
                        )}
                        <span style={{ float: 'right', display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {formatarDuracao(s.duracao_servico)}
                          </span>
                          <span className="price-tag">{formatarPreco(s.preco_servico)}</span>
                        </span>
                      </label>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Data */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 20 }}>3. Escolha a Data</h3>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="date"
                  className="form-control"
                  value={data}
                  min={hoje}
                  onChange={e => setData(e.target.value.slice(0, 10))}
                  required
                  style={{ maxWidth: 260 }}
                  maxLength={10}
                  pattern="\d{4}-\d{2}-\d{2}"
                  title="Formato de data: YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Horários */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title" style={{ marginBottom: 8 }}>4. Escolha o Horário</h3>

              {!barbeiroId || !data ? (
                <p className="text-secondary" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  Selecione um barbeiro e uma data para ver os horários disponíveis.
                </p>
              ) : loadingHorarios ? (
                <div className="horarios-loading">
                  <span className="spinner-sm"></span>
                  Verificando disponibilidade...
                </div>
              ) : horariosCarregados && horariosDisponiveis.length === 0 ? (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  Nenhum horário disponível para esta data. Tente outra data ou barbeiro.
                </div>
              ) : horariosCarregados ? (
                <div className="horarios-grid">
                  {HORARIOS_FUNCIONAMENTO.map(h => {
                    const disponivel = horariosDisponiveis.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        className={`horario-btn ${horarioSelecionado === h ? 'selected' : ''}`}
                        disabled={!disponivel}
                        onClick={() => disponivel && setHorarioSelecionado(h)}
                        title={disponivel ? '' : 'Horário indisponível'}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !barbeiroId || !data || !horarioSelecionado || servicosSelecionados.length === 0}
              >
                {loading ? (
                  <><span className="spinner-sm"></span> Confirmando...</>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={20} /> Confirmar Agendamento
                  </span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('historico')}
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Coluna resumo */}
          <div className="resumo-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scissors size={20} /> Resumo
            </h3>

            <div className="resumo-item">
              <span className="resumo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scissors size={18} />
              </span>
              <div>
                <span className="resumo-label">Barbeiro</span>
                <span className="resumo-value">
                  {barbeiro ? barbeiro.nome_barbeiro : <span style={{ color: 'var(--text-muted)' }}>Não selecionado</span>}
                </span>
              </div>
            </div>

            <div className="resumo-item">
              <span className="resumo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} />
              </span>
              <div>
                <span className="resumo-label">Data</span>
                <span className="resumo-value">
                  {data ? data.split('-').reverse().join('/') : <span style={{ color: 'var(--text-muted)' }}>Não selecionada</span>}
                </span>
              </div>
            </div>

            <div className="resumo-item">
              <span className="resumo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </span>
              <div>
                <span className="resumo-label">Horário</span>
                <span className="resumo-value">
                  {horarioSelecionado || <span style={{ color: 'var(--text-muted)' }}>Não selecionado</span>}
                </span>
              </div>
            </div>

            {servicosEscolhidos.length > 0 && (
              <div className="resumo-item">
                <span className="resumo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} />
                </span>
                <div>
                  <span className="resumo-label">Serviços</span>
                  <div>
                    {servicosEscolhidos.map(s => (
                      <div key={s.id_servico} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.85rem', marginBottom: 4
                      }}>
                        <span className="resumo-value">{s.tipo_servico}</span>
                        <span style={{ color: 'var(--color-primary)' }}>{formatarPreco(s.preco_servico)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="resumo-total">
              <span className="resumo-total-label">Total estimado</span>
              <span className="resumo-total-value">{formatarPreco(getValorTotal())}</span>
            </div>

            {servicosSelecionados.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                Selecione ao menos um serviço.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
