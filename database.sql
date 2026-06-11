-- ============================================
-- DATABASE SCHEMA - BARBEARIA
-- ============================================
-- Arquivo consolidado com todas as definições do banco de dados
-- Inclui: Schema, Migrações, Políticas RLS e Configurações

-- ============================================
-- SEÇÃO 1: CRIAÇÃO DAS TABELAS
-- ============================================

-- TABELA: tb_usuario
CREATE TABLE IF NOT EXISTS tb_usuario (
  id_usuario        SERIAL          NOT NULL,
  tipo_usuario      TEXT            NOT NULL DEFAULT 'cliente' CHECK (tipo_usuario IN ('cliente', 'admin', 'barbeiro')),
  nome_usuario      VARCHAR(100)    NOT NULL,
  email_usuario     VARCHAR(150)    NOT NULL UNIQUE,
  telefone_usuario  VARCHAR(20),
  created_at        TIMESTAMPTZ     DEFAULT now(),
  PRIMARY KEY (id_usuario)
);

-- TABELA: tb_barbeiro
CREATE TABLE IF NOT EXISTS tb_barbeiro (
  id_barbeiro            SERIAL       NOT NULL,
  nome_barbeiro          VARCHAR(100) NOT NULL,
  email_barbeiro         VARCHAR(150),
  telefone_barbeiro      VARCHAR(20),
  especialidade_barbeiro VARCHAR(100),
  created_at             TIMESTAMPTZ  DEFAULT now(),
  PRIMARY KEY (id_barbeiro),
  UNIQUE(email_barbeiro)
);

-- TABELA: tb_servico
CREATE TABLE IF NOT EXISTS tb_servico (
  id_servico      SERIAL          NOT NULL,
  tipo_servico    VARCHAR(100)    NOT NULL,
  descricao_servico VARCHAR(255),
  preco_servico   NUMERIC(10,2)   NOT NULL,
  duracao_servico INTERVAL        NOT NULL,
  PRIMARY KEY (id_servico)
);

-- TABELA: tb_agendamento
CREATE TABLE IF NOT EXISTS tb_agendamento (
  id_agendamento          SERIAL  NOT NULL,
  data_agendamento        DATE    NOT NULL,
  hora_agendamento        TIME    NOT NULL,
  status_agendamento      TEXT    NOT NULL DEFAULT 'pendente' CHECK (status_agendamento IN ('pendente', 'confirmado', 'cancelado')),
  tb_usuario_id_usuario   INT     NOT NULL,
  tb_barbeiro_id_barbeiro INT     NOT NULL,
  PRIMARY KEY (id_agendamento),
  CONSTRAINT fk_agendamento_usuario
    FOREIGN KEY (tb_usuario_id_usuario)
    REFERENCES tb_usuario (id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_agendamento_barbeiro
    FOREIGN KEY (tb_barbeiro_id_barbeiro)
    REFERENCES tb_barbeiro (id_barbeiro)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- TABELA: tb_servico_has_tb_agendamento (N:N)
CREATE TABLE IF NOT EXISTS tb_servico_has_tb_agendamento (
  tb_servico_id_servico         INT NOT NULL,
  tb_agendamento_id_agendamento INT NOT NULL,
  PRIMARY KEY (tb_servico_id_servico, tb_agendamento_id_agendamento),
  CONSTRAINT fk_sha_servico
    FOREIGN KEY (tb_servico_id_servico)
    REFERENCES tb_servico (id_servico)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_sha_agendamento
    FOREIGN KEY (tb_agendamento_id_agendamento)
    REFERENCES tb_agendamento (id_agendamento)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- TABELA: tb_barbeiro_indisponibilidade
CREATE TABLE IF NOT EXISTS tb_barbeiro_indisponibilidade (
  id_indisponibilidade SERIAL       NOT NULL,
  tb_barbeiro_id_barbeiro  INT          NOT NULL,
  data_bloqueio        DATE         NOT NULL,
  hora_inicio          TIME,
  hora_fim             TIME,
  motivo               VARCHAR(100),
  PRIMARY KEY (id_indisponibilidade),
  CONSTRAINT fk_indisp_barbeiro
    FOREIGN KEY (tb_barbeiro_id_barbeiro)
    REFERENCES tb_barbeiro (id_barbeiro)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ============================================
-- SEÇÃO 2: MIGRAÇÕES E AJUSTES
-- ============================================

-- Adicionar coluna created_at em tb_barbeiro (se não existir)
ALTER TABLE public.tb_barbeiro
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Adicionar constraint UNIQUE em email_barbeiro (se não existir)
ALTER TABLE public.tb_barbeiro
DROP CONSTRAINT IF EXISTS unique_email_barbeiro;
ALTER TABLE public.tb_barbeiro
ADD CONSTRAINT unique_email_barbeiro UNIQUE (email_barbeiro);

-- Alterar CHECK constraint em tb_usuario para incluir 'barbeiro'
ALTER TABLE public.tb_usuario DROP CONSTRAINT IF EXISTS tb_usuario_tipo_usuario_check;
ALTER TABLE public.tb_usuario ADD CONSTRAINT tb_usuario_tipo_usuario_check 
  CHECK (tipo_usuario IN ('cliente', 'admin', 'barbeiro'));

-- ============================================
-- SEÇÃO 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Deletar políticas antigas
DROP POLICY IF EXISTS "Usuários podem inserir seu perfil" ON public.tb_usuario;
DROP POLICY IF EXISTS "Todos podem ver perfis" ON public.tb_usuario;
DROP POLICY IF EXISTS "Usuários podem atualizar seu perfil" ON public.tb_usuario;
DROP POLICY IF EXISTS "Usuários veem seus agendamentos" ON public.tb_agendamento;
DROP POLICY IF EXISTS "Clientes e barbeiros podem criar agendamentos" ON public.tb_agendamento;
DROP POLICY IF EXISTS "Clientes podem cancelar seus agendamentos" ON public.tb_agendamento;
DROP POLICY IF EXISTS "Clientes e barbeiros podem atualizar agendamentos" ON public.tb_agendamento;
DROP POLICY IF EXISTS "Todos podem ver barbeiros" ON public.tb_barbeiro;
DROP POLICY IF EXISTS "Admins podem criar barbeiros" ON public.tb_barbeiro;
DROP POLICY IF EXISTS "Admins podem atualizar barbeiros" ON public.tb_barbeiro;
DROP POLICY IF EXISTS "Admins podem deletar barbeiros" ON public.tb_barbeiro;
DROP POLICY IF EXISTS "Todos podem ver serviços" ON public.tb_servico;
DROP POLICY IF EXISTS "Admins podem criar serviços" ON public.tb_servico;
DROP POLICY IF EXISTS "Admins podem atualizar serviços" ON public.tb_servico;
DROP POLICY IF EXISTS "Admins podem deletar serviços" ON public.tb_servico;
DROP POLICY IF EXISTS "Todos podem ver relação serviços-agendamentos" ON public.tb_servico_has_tb_agendamento;
DROP POLICY IF EXISTS "Clientes podem vincular serviços aos agendamentos" ON public.tb_servico_has_tb_agendamento;
DROP POLICY IF EXISTS "Admins podem deletar relações serviços-agendamentos" ON public.tb_servico_has_tb_agendamento;
DROP POLICY IF EXISTS "Todos podem ver indisponibilidades" ON public.tb_barbeiro_indisponibilidade;
DROP POLICY IF EXISTS "Admins podem criar indisponibilidades" ON public.tb_barbeiro_indisponibilidade;
DROP POLICY IF EXISTS "Barbeiros podem criar seus bloqueios" ON public.tb_barbeiro_indisponibilidade;
DROP POLICY IF EXISTS "Admins podem deletar indisponibilidades" ON public.tb_barbeiro_indisponibilidade;
DROP POLICY IF EXISTS "Barbeiros podem deletar seus bloqueios" ON public.tb_barbeiro_indisponibilidade;

-- Habilitar RLS na tabela tb_usuario
ALTER TABLE public.tb_usuario ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_usuario
CREATE POLICY "Usuários podem inserir seu perfil"
ON public.tb_usuario
FOR INSERT
WITH CHECK (auth.uid()::text is not null);

CREATE POLICY "Todos podem ver perfis"
ON public.tb_usuario
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem atualizar seu perfil"
ON public.tb_usuario
FOR UPDATE
USING (email_usuario = auth.jwt() ->> 'email');

-- Habilitar RLS na tabela tb_agendamento
ALTER TABLE public.tb_agendamento ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_agendamento
CREATE POLICY "Usuários veem seus agendamentos"
ON public.tb_agendamento
FOR SELECT
USING (
  -- Cliente vê seus agendamentos
  tb_usuario_id_usuario = (
    SELECT id_usuario FROM tb_usuario 
    WHERE email_usuario = auth.jwt() ->> 'email'
  )
  OR 
  -- Admin vê tudo
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
  OR
  -- Barbeiro vê seus agendamentos
  tb_barbeiro_id_barbeiro = (
    SELECT id_barbeiro FROM tb_barbeiro 
    WHERE email_barbeiro = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clientes e barbeiros podem criar agendamentos"
ON public.tb_agendamento
FOR INSERT
WITH CHECK (auth.uid()::text is not null);

CREATE POLICY "Clientes e barbeiros podem atualizar agendamentos"
ON public.tb_agendamento
FOR UPDATE
USING (
  -- Cliente atualiza seus agendamentos
  tb_usuario_id_usuario = (
    SELECT id_usuario FROM tb_usuario 
    WHERE email_usuario = auth.jwt() ->> 'email'
  )
  OR
  -- Barbeiro atualiza seus agendamentos
  tb_barbeiro_id_barbeiro = (
    SELECT id_barbeiro FROM tb_barbeiro 
    WHERE email_barbeiro = auth.jwt() ->> 'email'
  )
);

-- Habilitar RLS na tabela tb_barbeiro
ALTER TABLE public.tb_barbeiro ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_barbeiro
CREATE POLICY "Todos podem ver barbeiros"
ON public.tb_barbeiro
FOR SELECT
USING (true);

CREATE POLICY "Admins podem criar barbeiros"
ON public.tb_barbeiro
FOR INSERT
WITH CHECK (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Admins podem atualizar barbeiros"
ON public.tb_barbeiro
FOR UPDATE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Admins podem deletar barbeiros"
ON public.tb_barbeiro
FOR DELETE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

-- Habilitar RLS na tabela tb_servico
ALTER TABLE public.tb_servico ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_servico
CREATE POLICY "Todos podem ver serviços"
ON public.tb_servico
FOR SELECT
USING (true);

CREATE POLICY "Admins podem criar serviços"
ON public.tb_servico
FOR INSERT
WITH CHECK (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Admins podem atualizar serviços"
ON public.tb_servico
FOR UPDATE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Admins podem deletar serviços"
ON public.tb_servico
FOR DELETE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

-- Habilitar RLS na tabela tb_servico_has_tb_agendamento
ALTER TABLE public.tb_servico_has_tb_agendamento ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_servico_has_tb_agendamento
CREATE POLICY "Todos podem ver relação serviços-agendamentos"
ON public.tb_servico_has_tb_agendamento
FOR SELECT
USING (true);

CREATE POLICY "Clientes podem vincular serviços aos agendamentos"
ON public.tb_servico_has_tb_agendamento
FOR INSERT
WITH CHECK (auth.uid()::text is not null);

CREATE POLICY "Admins podem deletar relações serviços-agendamentos"
ON public.tb_servico_has_tb_agendamento
FOR DELETE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

-- Habilitar RLS na tabela tb_barbeiro_indisponibilidade
ALTER TABLE public.tb_barbeiro_indisponibilidade ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS tb_barbeiro_indisponibilidade
CREATE POLICY "Todos podem ver indisponibilidades"
ON public.tb_barbeiro_indisponibilidade
FOR SELECT
USING (true);

CREATE POLICY "Admins podem criar indisponibilidades"
ON public.tb_barbeiro_indisponibilidade
FOR INSERT
WITH CHECK (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Barbeiros podem criar seus bloqueios"
ON public.tb_barbeiro_indisponibilidade
FOR INSERT
WITH CHECK (
  tb_barbeiro_id_barbeiro = (
    SELECT id_barbeiro FROM tb_barbeiro 
    WHERE email_barbeiro = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Admins podem deletar indisponibilidades"
ON public.tb_barbeiro_indisponibilidade
FOR DELETE
USING (
  (SELECT tipo_usuario FROM tb_usuario WHERE email_usuario = auth.jwt() ->> 'email') = 'admin'
);

CREATE POLICY "Barbeiros podem deletar seus bloqueios"
ON public.tb_barbeiro_indisponibilidade
FOR DELETE
USING (
  tb_barbeiro_id_barbeiro = (
    SELECT id_barbeiro FROM tb_barbeiro 
    WHERE email_barbeiro = auth.jwt() ->> 'email'
  )
);

-- ============================================
-- SEÇÃO 4: CONFIGURAÇÕES E DADOS
-- ============================================

-- Adicionar durações aos serviços
-- Formato: '00:30:00' = 30 minutos, '01:00:00' = 1 hora, etc

UPDATE public.tb_servico 
SET duracao_servico = INTERVAL '00:30:00'
WHERE tipo_servico ILIKE '%corte%' AND duracao_servico IS NULL;

UPDATE public.tb_servico 
SET duracao_servico = INTERVAL '00:45:00'
WHERE tipo_servico ILIKE '%barba%' AND duracao_servico IS NULL;

UPDATE public.tb_servico 
SET duracao_servico = INTERVAL '01:00:00'
WHERE tipo_servico ILIKE '%completo%' OR tipo_servico ILIKE '%hidratar%' AND duracao_servico IS NULL;

-- Verificar os serviços atuais:
-- SELECT id_servico, tipo_servico, preco_servico, duracao_servico FROM public.tb_servico;
