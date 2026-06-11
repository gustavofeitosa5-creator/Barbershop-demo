-- ============================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- ============================================
-- Script para deletar todos os dados das tabelas
-- Respeita as dependências de foreign keys

-- Desabilitar constraints temporariamente (apenas para segurança)
-- Deletar em ordem de dependência (da última para a primeira)

-- 1. Limpar tabela de relacionamento N:N
TRUNCATE TABLE tb_servico_has_tb_agendamento CASCADE;

-- 2. Limpar tabelas que possuem foreign keys
TRUNCATE TABLE tb_agendamento CASCADE;
TRUNCATE TABLE tb_barbeiro_indisponibilidade CASCADE;

-- 3. Limpar tabelas principais
TRUNCATE TABLE tb_usuario CASCADE;
TRUNCATE TABLE tb_barbeiro CASCADE;
TRUNCATE TABLE tb_servico CASCADE;

-- 4. Resetar sequences (auto_increment) para começar do 1
ALTER SEQUENCE tb_usuario_id_usuario_seq RESTART WITH 1;
ALTER SEQUENCE tb_barbeiro_id_barbeiro_seq RESTART WITH 1;
ALTER SEQUENCE tb_servico_id_servico_seq RESTART WITH 1;
ALTER SEQUENCE tb_agendamento_id_agendamento_seq RESTART WITH 1;
ALTER SEQUENCE tb_barbeiro_indisponibilidade_id_indisponibilidade_seq RESTART WITH 1;

-- Confirmação
SELECT 'Todas as tabelas foram limpas com sucesso!' AS mensagem;
