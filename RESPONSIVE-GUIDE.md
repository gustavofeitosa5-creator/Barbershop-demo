# 📱 Guia de Responsividade da Aplicação

A aplicação BarberSync é totalmente responsiva e funciona perfeitamente em todos os dispositivos: smartphones, tablets e desktops.

## 📊 Breakpoints Definidos

| Dispositivo | Resolução | CSS Class |
|---|---|---|
| **Mobile** | < 480px | `.mobile` |
| **Tablet Pequeno** | 480px - 768px | `.small` |
| **Tablet** | 480px - 1024px | `.tablet` |
| **Tablet Grande** | 769px - 1024px | `.medium` |
| **Desktop** | ≥ 1025px | `.desktop` |
| **Desktop Grande** | ≥ 1440px | `.lg-desktop` |

---

## 🎯 Recursos Responsivos Implementados

### ✅ Navbar/Menu
- **Mobile**: Menu hamburger retrátil com drawer
- **Tablet**: Menu hamburger ou completo (dependendo)
- **Desktop**: Menu completo horizontal

### ✅ Tipografia
- Tamanho de fonte adapta-se ao dispositivo
- Espaçamento ajustado para legibilidade
- Preserva hierarquia visual em todos os tamanhos

### ✅ Grid de Conteúdo
- **Mobile**: 1 coluna
- **Tablet**: 2 colunas
- **Desktop**: 3+ colunas (auto-fit)

### ✅ Formulários
- **Mobile**: Campo por linha (100% width)
- **Tablet**: 2 campos por linha
- **Desktop**: Múltiplas colunas com layout flexível

### ✅ Tabelas
- **Mobile**: Scroll horizontal
- **Tablet/Desktop**: Scroll nativo ou display completo

### ✅ Botões
- **Mobile**: Tamanho aumentado para toque (48px mínimo)
- **Desktop**: Tamanho normal com hover effects

---

## 🛠️ Como Usar a Responsividade

### Método 1: CSS Media Queries

Aplicar estilos diferentes baseado na resolução:

```css
/* Mobile First */
.my-container {
  padding: 12px;
  font-size: 14px;
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 480px) {
  .my-container {
    padding: 16px;
    font-size: 15px;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .my-container {
    padding: 24px;
    font-size: 16px;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Método 2: React Hook - useResponsive

Usar lógica responsiva dentro de componentes React:

```tsx
import { useResponsive } from '../hooks/useResponsive';

export function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div>
      {isMobile && <p>Você está em um celular</p>}
      {isTablet && <p>Você está em um tablet</p>}
      {isDesktop && <p>Você está em um desktop</p>}
    </div>
  );
}
```

### Método 3: Hook useMediaQuery

Criar queries personalizadas:

```tsx
import { useMediaQuery } from '../hooks/useResponsive';

export function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 480px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  return (
    <div>
      {isMobile && isLandscape && <p>Celular em paisagem</p>}
    </div>
  );
}
```

### Método 4: Hooks Especializados

```tsx
import {
  useResponsive,
  useTouchDevice,
  useDarkMode,
  usePrefersReducedMotion,
  useOrientation
} from '../hooks/useResponsive';

export function MyComponent() {
  const isTouch = useTouchDevice();
  const isDark = useDarkMode();
  const reducedMotion = usePrefersReducedMotion();
  const orientation = useOrientation();

  return (
    <div>
      {isTouch ? 'Toque' : 'Mouse'}
      {isDark ? 'Escuro' : 'Claro'}
      {orientation === 'landscape' ? 'Paisagem' : 'Retrato'}
    </div>
  );
}
```

---

## 📐 Técnicas de Responsividade Usadas

### 1. **Mobile-First Approach**
Começar com estilos para mobile e adicionar estilos maiores com media queries.

### 2. **Flexbox & Grid**
- Flexbox para layouts lineares (navbar, botões)
- CSS Grid para layouts de múltiplas colunas

### 3. **Viewport Meta Tag**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 4. **Fluid Typography**
```css
font-size: clamp(14px, 2vw, 16px);
```

### 5. **Responsive Images**
```css
img {
  max-width: 100%;
  height: auto;
}
```

### 6. **Responsive Containers**
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--padding);
}
```

---

## 🧪 Testar Responsividade

### Browser DevTools (Chrome/Firefox/Safari)
1. Abrir DevTools (F12)
2. Clicar em "Toggle device toolbar" (Ctrl+Shift+M)
3. Selecionar diferentes dispositivos

### Dispositivos Para Testar
- **iPhone 12/13/14**: 390px
- **Samsung Galaxy S21**: 360px
- **iPad**: 768px
- **iPad Pro**: 1024px
- **Desktop**: 1920px, 2560px

### Orientações
- Portrait (retrato)
- Landscape (paisagem)

---

## 🎨 Personalizar Breakpoints

Para adicionar novos breakpoints, edite `responsive.css`:

```css
/* Novo breakpoint customizado */
@media (max-width: 1200px) {
  /* Estilos para telas menores que 1200px */
}
```

Ou use no React:

```tsx
const isCustom = useMediaQuery('(max-width: 1200px)');
```

---

## ⚡ Performance em Dispositivos Móveis

### Otimizações Implementadas
✅ Imagens otimizadas  
✅ CSS minificado  
✅ Eventos resize debounced  
✅ Touch-friendly buttons (48px)  
✅ Reduced motion respected  
✅ Viewport optimizada  

---

## 📱 Checklist de Responsividade

Quando criar novo componente, verifique:

- [ ] Funciona em celular (320px+)
- [ ] Funciona em tablet (768px)
- [ ] Funciona em desktop (1920px)
- [ ] Imagens responsivas
- [ ] Botões toque-friendly
- [ ] Sem scroll horizontal (exceto tabelas)
- [ ] Fontes legíveis em todos os tamanhos
- [ ] Touch events testados
- [ ] Orientação landscape funcionando
- [ ] Menu mobile funcionando

---

## 📚 Arquivos Relacionados

| Arquivo | Descrição |
|---|---|
| `src/styles/responsive.css` | Media queries para todos os breakpoints |
| `src/styles/global.css` | Estilos base (mobile-first) |
| `src/hooks/useResponsive.ts` | Hooks React para responsividade |
| `index.html` | Meta tags de viewport |

---

## 🔗 Recursos Úteis

- [MDN - Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [CSS Tricks - Mobile First](https://css-tricks.com/mobile-first-css-is-cool/)
- [Web.dev - Responsive Design](https://web.dev/responsive-web-design-basics/)

---

**Última atualização:** 2026-06-11  
**Status:** ✅ Totalmente Responsivo
