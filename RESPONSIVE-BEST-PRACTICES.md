# 🎯 Boas Práticas de Responsividade

Guia para manter a aplicação responsiva ao adicionar novos componentes e funcionalidades.

## ✅ Antes de Criar um Novo Componente

### 1. **Planeje para Mobile First**
```
Começar sempre com mobile, depois adicionar estilos maiores com @media
```

### 2. **Use Unidades Flexíveis**
```css
/* ❌ Evite */
.container {
  width: 1200px;
  padding: 20px;
  font-size: 16px;
}

/* ✅ Prefira */
.container {
  max-width: 1200px;
  padding: clamp(12px, 5%, 24px);
  font-size: clamp(14px, 2vw, 16px);
}
```

### 3. **Use CSS Grid e Flexbox**
```css
/* ✅ Grid responsivo */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

/* ✅ Flexbox responsivo */
.flex {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
```

### 4. **Dimensione Elementos Responsivamente**
```css
/* ✅ Imagens responsivas */
img {
  max-width: 100%;
  height: auto;
}

/* ✅ Vidéos responsivos */
iframe,
video {
  max-width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}
```

---

## 📝 Checklist para Novos Componentes

Ao criar novo componente, certifique-se de:

- [ ] **Mobile** (< 480px)
  - [ ] Sem scroll horizontal
  - [ ] Botões toque-friendly (≥ 44px)
  - [ ] Texto legível (≥ 14px)
  - [ ] Menu hamburger se necessário

- [ ] **Tablet** (480px - 1024px)
  - [ ] Layout flexível
  - [ ] Imagens redimensionam
  - [ ] Inputs com tamanho apropriado

- [ ] **Desktop** (≥ 1025px)
  - [ ] Aproveita espaço completo
  - [ ] Hover effects funcionam
  - [ ] Layout multi-coluna

- [ ] **Acessibilidade**
  - [ ] Contraste de cores ok
  - [ ] Fontes legíveis
  - [ ] Elementos focáveis com Tab
  - [ ] ARIA labels onde necessário

- [ ] **Performance**
  - [ ] Imagens otimizadas
  - [ ] CSS crítico inline
  - [ ] Sem JS desnecessário

---

## 🛡️ Estrutura de Media Queries Padrão

Use este template ao criar novos estilos:

```css
/* Mobile First - Base (< 480px) */
.my-component {
  padding: 12px;
  font-size: 14px;
  grid-template-columns: 1fr;
}

/* Small Tablets (480px - 768px) */
@media (min-width: 480px) {
  .my-component {
    padding: 14px;
    font-size: 14.5px;
  }
}

/* Medium Tablets (769px - 1024px) */
@media (min-width: 769px) {
  .my-component {
    padding: 16px;
    font-size: 15px;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1025px - 1439px) */
@media (min-width: 1025px) {
  .my-component {
    padding: 20px;
    font-size: 15px;
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop (≥ 1440px) */
@media (min-width: 1440px) {
  .my-component {
    padding: 24px;
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🎨 Padrões Responsivos Comuns

### Pattern: Sidebar Toggle
```tsx
import { useResponsive } from '../hooks/useResponsive';

export function Layout() {
  const { isDesktop } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  return (
    <div>
      {!isDesktop && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>Menu</button>
      )}
      {(sidebarOpen || isDesktop) && <Sidebar />}
      <Content />
    </div>
  );
}
```

### Pattern: Responsive Table
```tsx
export function Table({ data }) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <div>
        {data.map(item => (
          <Card key={item.id} data={item} />
        ))}
      </div>
    );
  }

  return (
    <table>
      {/* Desktop table */}
    </table>
  );
}
```

### Pattern: Responsive Grid
```tsx
export function Grid({ items }) {
  const { isMobile, isTablet } = useResponsive();

  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '16px'
    }}>
      {items.map(item => <Item key={item.id} data={item} />)}
    </div>
  );
}
```

---

## 🚀 Performance & Responsividade

### Image Optimization
```tsx
export function ResponsiveImage({ src, alt }) {
  return (
    <picture>
      <source media="(max-width: 480px)" srcSet={`${src}-sm.jpg`} />
      <source media="(max-width: 1024px)" srcSet={`${src}-md.jpg`} />
      <img src={`${src}-lg.jpg`} alt={alt} style={{
        maxWidth: '100%',
        height: 'auto'
      }} />
    </picture>
  );
}
```

### CSS Size Calc
```css
/* Tamanho que muda gradualmente */
.element {
  padding: clamp(12px, 2vw, 24px);
  font-size: clamp(14px, 1.5vw, 18px);
  width: clamp(100%, 95vw, 1200px);
}
```

---

## 🔍 Debugging Responsivo

### 1. **Chrome DevTools**
- F12 → Device Toolbar (Ctrl+Shift+M)
- Testar diferentes dispositivos
- Usar "Responsive" para custom sizes

### 2. **Firefox DevTools**
- F12 → Responsive Design Mode (Ctrl+Shift+M)
- Simular diferentes conexões
- Teste em múltiplos idiomas

### 3. **Safari DevTools**
- Developer Menu → Enter Responsive Design Mode
- Testar em diferentes zooms

### 4. **Console Commands**
```javascript
// Ver breakpoint atual
window.innerWidth

// Simular touch
document.documentElement.classList.add('is-touch')

// Ver media query
matchMedia('(max-width: 480px)').matches
```

---

## ⚠️ Armadilhas Comuns a Evitar

❌ **NÃO** use pixel units fixos em tudo
```css
/* Ruim */
.button {
  width: 200px;  /* Muito largo em mobile */
}
```

❌ **NÃO** se esqueça do viewport meta tag
```html
<!-- Ruim - sem viewport -->
<html>

<!-- Bom - com viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

❌ **NÃO** use imagens muito grandes
```tsx
/* Ruim - 5MB para 100px */
<img src="huge-image.jpg" width="100" />

/* Bom - otimizado */
<img src="optimized.jpg" width="100" srcSet="2x.jpg 2x" />
```

❌ **NÃO** esqueça do scroll horizontal
```css
/* Ruim - força scroll */
.container {
  width: 1200px;  /* Em mobile fica com scroll */
}

/* Bom - responsivo */
.container {
  max-width: 100%;
  overflow-x: auto;
}
```

❌ **NÃO** use hover em mobile
```css
/* Ruim - não funciona em touch */
button:hover {
  background: blue;
}

/* Melhor */
button:active {
  background: blue;
}

@media (hover: hover) {
  button:hover {
    background: blue;
  }
}
```

---

## 📚 Referências Rápidas

### Breakpoints Globais
```javascript
const BREAKPOINTS = {
  mobile: '< 480px',
  tablet: '480px - 1024px',
  desktop: '>= 1025px'
}
```

### Touch-Friendly Sizes
```css
button {
  min-width: 44px;      /* Botões toque-friendly */
  min-height: 44px;
  padding: 12px 16px;
}

input {
  min-height: 44px;     /* Inputs toque-friendly */
}
```

### Font Sizes
```css
/* Body */
body { font-size: 14px; }        /* Mobile */
@media (min-width: 768px) { body { font-size: 15px; } }
@media (min-width: 1025px) { body { font-size: 16px; } }

/* Headings */
h1 { font-size: 1.5rem; }        /* Mobile */
@media (min-width: 768px) { h1 { font-size: 2rem; } }
@media (min-width: 1025px) { h1 { font-size: 2.5rem; } }
```

---

## ✨ Exemplo Completo

```tsx
// src/components/ResponsiveCard.tsx
import { useResponsive } from '../hooks/useResponsive';
import './responsive-card.css';

interface Card {
  title: string;
  description: string;
  image: string;
}

export function ResponsiveCard({ data }: { data: Card }) {
  const { isMobile, isTablet } = useResponsive();

  return (
    <article className="card">
      <img 
        src={data.image} 
        alt={data.title}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: isMobile ? '200px' : '300px'
        }}
      />
      <div className="card-content">
        <h3>{data.title}</h3>
        {!isMobile && <p>{data.description}</p>}
        <button className="btn btn-primary">Saiba Mais</button>
      </div>
    </article>
  );
}
```

```css
/* src/components/responsive-card.css */
.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow: hidden;
  transition: var(--transition);
}

.card-content {
  padding: 12px;  /* Mobile */
}

@media (min-width: 480px) {
  .card-content {
    padding: 14px;
  }
}

@media (min-width: 768px) {
  .card {
    display: flex;
    align-items: center;
  }

  .card img {
    width: 40%;
  }

  .card-content {
    flex: 1;
    padding: 18px;
  }
}

@media (min-width: 1025px) {
  .card {
    flex-direction: column;
  }

  .card img {
    width: 100%;
  }

  .card-content {
    padding: 20px;
  }
}
```

---

## 🎓 Recursos para Aprender Mais

- [MDN - Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [CSS Tricks - A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Web.dev - Responsive Web Design](https://web.dev/responsive-web-design-basics/)
- [Google Fonts - Typography](https://fonts.google.com/)

---

**Mantendo a responsividade sempre!** 🚀
