import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getHojeISO, formatarData, formatarPreco } from '../lib/supabase';
import { Scissors, Calendar, Clock, DollarSign, ChevronRight } from 'lucide-react';

interface IndexPageProps {
  navigate: (to: string) => void;
}

interface ProximoAgendamento {
  id_agendamento: number;
  data_agendamento: string;
  hora_agendamento: string;
  status_agendamento: string;
  tb_usuario?: { nome_usuario: string };
  tb_barbeiro?: { nome_barbeiro: string };
  servicos?: Array<{
    id_servico: number;
    tipo_servico: string;
    preco_servico: number;
  }>;
  precoTotal?: number;
}

export default function IndexPage({ navigate }: IndexPageProps) {
  const { user, perfil } = useAuth();
  const [proximoAgendamento, setProximoAgendamento] = useState<ProximoAgendamento | null>(null);
  const [loadingAgendamento, setLoadingAgendamento] = useState(true);

  useEffect(() => {
    if (user && perfil && perfil.tipo_usuario === 'cliente') {
      carregarProximoAgendamento();
    } else {
      setLoadingAgendamento(false);
    }
  }, [user, perfil]);

  async function carregarProximoAgendamento() {
    setLoadingAgendamento(true);
    try {
      const hoje = getHojeISO();
      
      const { data } = await supabase
        .from('tb_agendamento')
        .select(`
          id_agendamento, data_agendamento, hora_agendamento, status_agendamento,
          tb_usuario ( nome_usuario ),
          tb_barbeiro ( nome_barbeiro ),
          tb_servico_has_tb_agendamento (
            tb_servico ( id_servico, tipo_servico, preco_servico )
          )
        `)
        .eq('tb_usuario_id_usuario', perfil?.id_usuario || 0)
        .gte('data_agendamento', hoje)
        .eq('status_agendamento', 'confirmado')
        .order('data_agendamento', { ascending: true })
        .order('hora_agendamento', { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const agendamento = data[0] as any;
        
        // Calcular preço total dos serviços
        const servicos = agendamento.tb_servico_has_tb_agendamento || [];
        const precoTotal = servicos.reduce((total: number, item: any) => {
          return total + (item.tb_servico?.preco_servico || 0);
        }, 0);

        setProximoAgendamento({
          ...agendamento,
          servicos: servicos.map((s: any) => s.tb_servico),
          precoTotal
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar próximo agendamento:', err);
    } finally {
      setLoadingAgendamento(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-inner container">
          <div>
            <h1 className="hero-title">
              Agende seu <span>horário</span> com facilidade
            </h1>
            <p className="hero-desc">
              Sistema moderno de agendamento para barbearia. Escolha seu barbeiro ideal,
              confira horários disponíveis e confirme tudo em poucos cliques.
            </p>
            <div className="hero-actions">
              {user ? (
                perfil?.tipo_usuario === 'admin' ? (
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('dashboard')}>
                    Ir para o Dashboard
                  </button>
                ) : (
                  <>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('agendar')}>
                      Agendar agora
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={() => navigate('historico')}>
                      Meus agendamentos
                    </button>
                  </>
                )
              ) : (
                <>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('auth')}>
                    Agendar agora
                  </button>
                  <button className="btn btn-secondary btn-lg" onClick={() => navigate('servicos')}>
                    Ver serviços
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="hero-visual">
            {user && perfil?.tipo_usuario === 'cliente' ? (
              <div className="hero-card-showcase">
                <div style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Próximo agendamento
                </div>
                
                {loadingAgendamento ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                    <div className="loading-spinner" style={{ marginBottom: 12 }}></div>
                    Carregando...
                  </div>
                ) : proximoAgendamento ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--color-primary-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                      }}>
                        <Scissors size={24} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', marginBottom: 2 }}>
                          {proximoAgendamento.tb_barbeiro?.nome_barbeiro || 'Barbeiro'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                          {proximoAgendamento.servicos?.map(s => s.tipo_servico).join(' + ') || 'Serviço'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <div style={{
                        flex: 1, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                        padding: '12px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Calendar size={12} /> Data
                        </div>
                        <div style={{ fontWeight: 600 }}>{formatarData(proximoAgendamento.data_agendamento)}</div>
                      </div>
                      <div style={{
                        flex: 1, background: 'var(--color-primary-dim)', borderRadius: 'var(--radius-sm)',
                        padding: '12px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Clock size={12} /> Horário
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{proximoAgendamento.hora_agendamento.substring(0, 5)}</div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 16, borderTop: '1px solid var(--border)'
                    }}>
                      <span className="badge badge-confirmado">Confirmado</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={16} />
                        {formatarPreco(proximoAgendamento.precoTotal || 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                      <Calendar size={40} />
                    </div>
                    <p style={{ marginBottom: 16 }}>Nenhum agendamento confirmado</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                      Volte para a página de agendamento e escolha um horário.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="hero-card-showcase">
                <div style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Como funciona
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-primary-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', flexShrink: 0
                    }}>1</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Crie sua conta</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rápido e seguro</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-primary-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', flexShrink: 0
                    }}>2</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Escolha o barbeiro</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Veja disponibilidade em tempo real</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--color-primary-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', flexShrink: 0
                    }}>3</div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Confirme seu agendamento</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Receba confirmação na hora</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="container">
          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Calendar size={32} />
              </div>
              <div className="feature-title">Agendamento Online</div>
              <div className="feature-desc">Agende 24h por dia, 7 dias por semana, de qualquer dispositivo.</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Scissors size={32} />
              </div>
              <div className="feature-title">Escolha seu Barbeiro</div>
              <div className="feature-desc">Veja a disponibilidade de cada barbeiro e escolha seu favorito.</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <DollarSign size={32} />
              </div>
              <div className="feature-title">Preços Transparentes</div>
              <div className="feature-desc">Tabela de preços completa e atualizada sempre disponível.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        padding: '32px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', fontSize: '1.1rem', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Scissors size={20} /> BarberSync
        </div>
        <p>Sistema de Agendamento para Barbearia</p>
        <p style={{ marginTop: 8 }}>
          Projeto Integrador BDD + PW — EEEP Professora Maria Célia Pinheiro Falcão — 2026
        </p>
        <p style={{ marginTop: 4, fontSize: '0.75rem' }}>
          Equipe: Gustavo Araujo · Paulo Gabryel · Francisco Gabriel · Ellen Cristina · Antonio Lourenço · Charles Gabriel · Pedro Victor
        </p>
      </footer>
    </div>
  );
}
