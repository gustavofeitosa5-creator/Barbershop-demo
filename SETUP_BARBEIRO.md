# Implementação de Tipo "Barbeiro" - Guia de Configuração

## 📋 Resumo das Mudanças

1. **Schema SQL**: Adicionado tipo `barbeiro` em `tb_usuario`
2. **AuthContext**: Detecção automática - se o email existe em `tb_barbeiro`, cria usuário como barbeiro
3. **Interface**: Nova página `BarbeiroDashboardPage` para barbeiros gerenciarem agendamentos
4. **Navegação**: Redirecionamento automático - barbeiros → `barbeiro-dashboard`, admins → `dashboard`, clientes → `agendar`
5. **Segurança RLS**: Políticas atualizadas para permitir barbeiros confirmarem/cancelarem seus agendamentos

---

## 🚀 Passos de Configuração no Supabase

### 1. Executar Migração
Vá em **SQL Editor** no Supabase e execute o arquivo: `migration-barbeiro.sql`

```sql
-- Isso irá:
-- - Adicionar coluna created_at em tb_barbeiro
-- - Adicionar constraint UNIQUE em email_barbeiro
-- - Atualizar CHECK constraint para incluir 'barbeiro'
```

### 2. Atualizar Políticas RLS
Execute o arquivo: `rls-policies-reset.sql`

```sql
-- Isso irá recriar todas as políticas com suporte a:
-- - Barbeiros criarem seus próprios bloqueios de horário
-- - Barbeiros confirmarem/cancelarem agendamentos seus
-- - Clientes vincularem serviços aos agendamentos
```

---

## 👨‍💼 Fluxo de Cadastro Barbeiro

### Visão do Admin
1. Admin vai em **Barbeiros** → **+ Novo Barbeiro**
2. Preenche: Nome, Email, Telefone, Especialidade
3. **Importante**: Salvar o email (ex: `itamar@barbearia.com`)

### Visão do Barbeiro
1. Barbeiro clica em **Criar Conta**
2. Nome: `Itamar`
3. Email: `itamar@barbearia.com` ✅ (IGUAL ao cadastrado pelo admin)
4. Telefone: `84 91111111`
5. Senha: `SuaSenha123`
6. **Sistema detecta**: Email existe em `tb_barbeiro` → Cria como tipo `barbeiro`
7. Redirecionado para **Meus Agendamentos** (dashboard barbeiro)

---

## 🔐 Permissões por Tipo

### Cliente
- ✅ Ver serviços
- ✅ Fazer agendamentos
- ✅ Ver/cancelar seus agendamentos
- ❌ Gerenciar barbeiros/serviços

### Barbeiro
- ✅ Ver seus agendamentos
- ✅ **Confirmar** agendamentos
- ✅ **Cancelar** agendamentos
- ✅ Criar bloqueios de horário
- ✅ Ver serviços (informativo)
- ❌ Criar agendamentos novos
- ❌ Gerenciar barbeiros/serviços

### Admin
- ✅ Tudo
- Dashboard com estatísticas
- Gerenciar barbeiros, serviços, agendamentos

---

## 🧪 Testes Recomendados

1. **Admin cria barbeiro** com email `barbeiro@teste.com`
2. **Barbeiro faz signup** com mesmo email
3. **Sistema detecta** e cria como tipo `barbeiro`
4. **Barbeiro loga** → Vê **"Meus Agendamentos"** ao invés de **"Agendar"**
5. **Cliente agenda** com esse barbeiro
6. **Barbeiro confirma** na interface
7. **Cliente vê** agendamento como "✅ Confirmado"

---

## 📁 Arquivos Alterados

- `schema.sql` - Adicionado tipo 'barbeiro'
- `migration-barbeiro.sql` - Nova migração
- `rls-policies-reset.sql` - Políticas RLS atualizadas
- `src/lib/supabase.ts` - Interface Usuario com 'barbeiro'
- `src/contexts/AuthContext.tsx` - Lógica de detecção
- `src/pages/BarbeiroDashboardPage.tsx` - Nova página
- `src/pages/AuthPage.tsx` - Redirecionamento barbeiro
- `src/components/Navbar.tsx` - Links navegação barbeiro
- `src/App.tsx` - Rota e proteção

---

## ⚠️ Possíveis Erros

### Erro: "unknown type 'barbeiro'"
**Solução**: Executar `migration-barbeiro.sql` no Supabase SQL Editor

### Erro: "violates row-level security policy"
**Solução**: Executar `rls-policies-reset.sql` para recriar políticas

### Barbeiro não vê seus agendamentos
**Solução**: Garantir que:
1. `email_barbeiro` em `tb_barbeiro` = `email_usuario` em `tb_usuario`
2. `tipo_usuario` = 'barbeiro'
3. RLS políticas ativas

---

## 💾 Checklist Final

- [ ] Executar `migration-barbeiro.sql`
- [ ] Executar `rls-policies-reset.sql`
- [ ] Criar barbeiro com email via admin
- [ ] Barbeiro registra-se com mesmo email
- [ ] Verificar redirecionamento automático
- [ ] Testar confirmação de agendamento
- [ ] Testar criação de bloqueio

Pronto! 🎉
