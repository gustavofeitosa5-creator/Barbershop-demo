/**
 * Exemplo de Componente Responsivo
 * Demonstra como criar componentes que se adaptam a diferentes tamanhos de tela
 */

import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveComponentExampleProps {
  title?: string;
}

export function ResponsiveComponentExample({ title = 'Componente Responsivo' }: ResponsiveComponentExampleProps) {
  const { isMobile, isTablet, isDesktop, isLargeDesktop, screenWidth } = useResponsive();

  return (
    <div className="responsive-example">
      <div className="card">
        <h2>{title}</h2>
        
        {/* Mostrar informações do breakpoint atual */}
        <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
            <strong>Breakpoint Atual:</strong> {
              isMobile ? '📱 Mobile (< 480px)' :
              isTablet && !isDesktop ? '📱 Tablet (480px - 1024px)' :
              isDesktop && !isLargeDesktop ? '💻 Desktop (1025px - 1439px)' :
              isLargeDesktop ? '🖥️ Large Desktop (≥ 1440px)' :
              'Unknown'
            }
          </p>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
            <strong>Resolução:</strong> {screenWidth}px
          </p>
        </div>

        {/* Layout que muda baseado no dispositivo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
            <p style={{ fontSize: '0.9rem' }}>Mobile: 1 coluna</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
            <p style={{ fontSize: '0.9rem' }}>Tablet: 2 colunas</p>
          </div>
          <div className="card" style={{ padding: '16px', display: isMobile ? 'none' : 'block' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💻</div>
            <p style={{ fontSize: '0.9rem' }}>Desktop: 3 colunas</p>
          </div>
        </div>

        {/* Mostrar conteúdo diferente baseado no dispositivo */}
        {isMobile && (
          <div style={{ padding: '12px', background: 'var(--color-primary-dim)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
              ✓ Você está em um celular! O menu é compacto e os botões são maiores para toque fácil.
            </p>
          </div>
        )}

        {isTablet && !isDesktop && (
          <div style={{ padding: '12px', background: 'var(--info-bg)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--info)' }}>
              ✓ Você está em um tablet! O layout é otimizado com 2 colunas.
            </p>
          </div>
        )}

        {isDesktop && (
          <div style={{ padding: '12px', background: 'var(--success-bg)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
              ✓ Você está em um desktop! Aproveite o layout completo com múltiplas colunas.
            </p>
          </div>
        )}

        {isLargeDesktop && (
          <div style={{ padding: '12px', background: 'var(--warning-bg)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>
              ✓ Você está em um monitor grande! Conteúdo otimizado para alta resolução.
            </p>
          </div>
        )}

        {/* Tabela responsiva */}
        <div className="table-wrapper" style={{ marginTop: '20px' }}>
          <table>
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Resolução</th>
                {!isMobile && <th>Colunas</th>}
                {isDesktop && <th>Descrição</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>📱 Mobile</td>
                <td>&lt; 480px</td>
                {!isMobile && <td>1</td>}
                {isDesktop && <td>Smartphones</td>}
              </tr>
              <tr>
                <td>📱 Tablet P.</td>
                <td>480px - 768px</td>
                {!isMobile && <td>2</td>}
                {isDesktop && <td>Tablets pequenos</td>}
              </tr>
              <tr>
                <td>📱 Tablet M.</td>
                <td>769px - 1024px</td>
                {!isMobile && <td>2-3</td>}
                {isDesktop && <td>Tablets médios</td>}
              </tr>
              <tr>
                <td>💻 Desktop</td>
                <td>1025px - 1439px</td>
                {!isMobile && <td>3</td>}
                {isDesktop && <td>Computadores</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .responsive-example h2 {
          margin-bottom: 20px;
          color: var(--color-primary);
        }

        @media (max-width: 480px) {
          .responsive-example .card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default ResponsiveComponentExample;
