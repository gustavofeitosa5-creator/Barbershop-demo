# 🗑️ Limpeza do Banco de Dados

Este documento descreve como limpar o banco de dados da aplicação Barbearia.

## 📋 Tabelas do Banco

O banco de dados possui as seguintes tabelas:

1. **tb_usuario** - Usuários da aplicação
2. **tb_barbeiro** - Dados dos barbeiros
3. **tb_servico** - Serviços disponíveis
4. **tb_agendamento** - Agendamentos realizados
5. **tb_servico_has_tb_agendamento** - Relacionamento N:N (serviços por agendamento)
6. **tb_barbeiro_indisponibilidade** - Períodos de indisponibilidade dos barbeiros

## 🔧 Opções de Limpeza

### Opção 1: Via SQL (Direto no Banco)

Use o arquivo `database-cleanup.sql`:

```bash
# Se estiver usando psql (PostgreSQL)
psql -U seu_usuario -d seu_banco -f database-cleanup.sql

# Ou copie o conteúdo e execute no Supabase Dashboard > SQL Editor
```

**Vantagens:**
- Mais rápido e eficiente
- Executa no servidor
- Reseta automaticamente os IDs (sequences)

---

### Opção 2: Via TypeScript/JavaScript (Código da Aplicação)

Use o arquivo `src/utils/dbCleanup.ts`:

```typescript
import { 
  limparBancoDados, 
  limparTabelaEspecifica, 
  obterContagemTabelas 
} from './utils/dbCleanup';

// Limpar TODAS as tabelas
await limparBancoDados();

// Limpar apenas uma tabela específica
await limparTabelaEspecifica('tb_usuario');

// Verificar contagem de registros
const contagem = await obterContagemTabelas();
console.log(contagem);
```

**Vantagens:**
- Pode ser integrado na aplicação
- Permite limpeza seletiva
- Logs detalhados do processo

---

## 📝 Exemplos de Uso

### Exemplo 1: Limpar tudo verificando antes e depois

```typescript
import { limparBancoDados, obterContagemTabelas } from './utils/dbCleanup';

async function executarLimpeza() {
  // Ver quantos registros existem
  console.log('Antes:', await obterContagemTabelas());

  // Confirmar com o usuário (adicionar confirmação no UI)
  if (confirm('⚠️ Tem certeza? Isso deletará TODOS os dados!')) {
    // Limpar tudo
    await limparBancoDados();
    
    // Verificar resultado
    console.log('Depois:', await obterContagemTabelas());
  }
}
```

### Exemplo 2: Limpar apenas usuários

```typescript
import { limparTabelaEspecifica } from './utils/dbCleanup';

async function limparUsuarios() {
  try {
    await limparTabelaEspecifica('tb_usuario');
    console.log('✅ Usuários deletados com sucesso');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}
```

### Exemplo 3: Criar um botão de admin para limpeza

```typescript
// Em uma página de admin
import { limparBancoDados } from './utils/dbCleanup';

export function AdminPainel() {
  const handleLimparDB = async () => {
    const confirmacao = window.confirm(
      '⚠️ AVISO: Isto deletará TODOS os dados do banco!\n\n' +
      'Digite "CONFIRMAR" para prosseguir:'
    );

    if (confirmacao) {
      try {
        await limparBancoDados();
        alert('✅ Banco de dados limpo com sucesso!');
      } catch (error) {
        alert('❌ Erro ao limpar: ' + error.message);
      }
    }
  };

  return (
    <button 
      onClick={handleLimparDB}
      style={{ background: '#dc2626', color: 'white', padding: '10px 20px' }}
    >
      🗑️ Limpar Banco de Dados
    </button>
  );
}
```

---

## ⚠️ Cuidados Importantes

1. **NÃO EXECUTE EM PRODUÇÃO** sem confirmar com o time
2. **SEMPRE FAÇA BACKUP** antes de executar a limpeza
3. **VERIFIQUE AS PERMISSÕES** - precisa estar autenticado como admin
4. **CONFIRME COM O USUÁRIO** antes de deletar dados
5. **RESPEITE A ORDEM** - as dependências de foreign keys são importantes

---

## 🔄 Ordem de Limpeza (Importante)

As tabelas são limpas nesta ordem para respeitar as relações:

1. ✅ `tb_servico_has_tb_agendamento` (depende de outras)
2. ✅ `tb_agendamento` (depende de usuário e barbeiro)
3. ✅ `tb_barbeiro_indisponibilidade` (depende de barbeiro)
4. ✅ `tb_usuario` (tabela principal)
5. ✅ `tb_barbeiro` (tabela principal)
6. ✅ `tb_servico` (tabela principal)

---

## 📊 Visualizar Contagem Atual

```typescript
import { obterContagemTabelas } from './utils/dbCleanup';

const contagem = await obterContagemTabelas();
console.table(contagem);

/* Resultado esperado:
┌─────────────────────────────────────────┬─────┐
│ (index)                                 │ Count │
├─────────────────────────────────────────┼─────┤
│ tb_usuario                              │ 5   │
│ tb_barbeiro                             │ 3   │
│ tb_servico                              │ 10  │
│ tb_agendamento                          │ 15  │
│ tb_servico_has_tb_agendamento           │ 30  │
│ tb_barbeiro_indisponibilidade           │ 2   │
└─────────────────────────────────────────┴─────┘
*/
```

---

## 🐛 Troubleshooting

### "Erro de permissão"
- Verifique se o usuário Supabase tem permissões DELETE
- Às vezes o JWT está expirado

### "Foreign Key Constraint Violation"
- Isso não deve acontecer com o código fornecido
- Se acontecer, limpe na ordem correta (tabelas dependentes primeiro)

### "Sequence não foi resetada"
- Se os IDs não começarem do 1 após limpeza
- Execute manualmente:
```sql
ALTER SEQUENCE tb_usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE tb_barbeiro_id_barbeiro_seq RESTART WITH 1;
-- ... etc para outras sequences
```

---

## ✅ Checklist de Segurança

- [ ] Tenho backup dos dados?
- [ ] Verifiquei quantos registros serão deletados?
- [ ] Confirmei com o time?
- [ ] Não estou em produção?
- [ ] Estou autenticado como admin?
- [ ] Li os avisos acima?

---

**Criado em:** 2026-06-11  
**Última atualização:** 2026-06-11
