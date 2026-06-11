/**
 * Módulo para limpeza do banco de dados
 * Deleta todos os dados das tabelas respeitando as dependências de foreign keys
 */

import { supabase } from './supabase';

/**
 * Limpar todas as tabelas do banco de dados
 * A ordem importa: deleta primeiro as tabelas dependentes, depois as principais
 */
export async function limparBancoDados(): Promise<void> {
  try {
    console.log('🗑️ Iniciando limpeza do banco de dados...');

    // 1. Limpar tabela de relacionamento N:N (tb_servico_has_tb_agendamento)
    console.log('Limpando tb_servico_has_tb_agendamento...');
    const { error: error1 } = await supabase
      .from('tb_servico_has_tb_agendamento')
      .delete()
      .neq('tb_servico_id_servico', -1); // Deleta todos os registros

    if (error1) throw new Error(`Erro ao limpar tb_servico_has_tb_agendamento: ${error1.message}`);

    // 2. Limpar tb_agendamento (depende de tb_usuario e tb_barbeiro)
    console.log('Limpando tb_agendamento...');
    const { error: error2 } = await supabase
      .from('tb_agendamento')
      .delete()
      .neq('id_agendamento', -1);

    if (error2) throw new Error(`Erro ao limpar tb_agendamento: ${error2.message}`);

    // 3. Limpar tb_barbeiro_indisponibilidade (depende de tb_barbeiro)
    console.log('Limpando tb_barbeiro_indisponibilidade...');
    const { error: error3 } = await supabase
      .from('tb_barbeiro_indisponibilidade')
      .delete()
      .neq('id_indisponibilidade', -1);

    if (error3) throw new Error(`Erro ao limpar tb_barbeiro_indisponibilidade: ${error3.message}`);

    // 4. Limpar tb_usuario
    console.log('Limpando tb_usuario...');
    const { error: error4 } = await supabase
      .from('tb_usuario')
      .delete()
      .neq('id_usuario', -1);

    if (error4) throw new Error(`Erro ao limpar tb_usuario: ${error4.message}`);

    // 5. Limpar tb_barbeiro
    console.log('Limpando tb_barbeiro...');
    const { error: error5 } = await supabase
      .from('tb_barbeiro')
      .delete()
      .neq('id_barbeiro', -1);

    if (error5) throw new Error(`Erro ao limpar tb_barbeiro: ${error5.message}`);

    // 6. Limpar tb_servico
    console.log('Limpando tb_servico...');
    const { error: error6 } = await supabase
      .from('tb_servico')
      .delete()
      .neq('id_servico', -1);

    if (error6) throw new Error(`Erro ao limpar tb_servico: ${error6.message}`);

    console.log('✅ Todas as tabelas foram limpas com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

/**
 * Limpar apenas uma tabela específica
 * @param tableName - Nome da tabela a limpar
 */
export async function limparTabelaEspecifica(tableName: string): Promise<void> {
  try {
    console.log(`🗑️ Limpando tabela: ${tableName}...`);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', -1); // Condição que sempre é verdadeira para deletar todos

    if (error) throw new Error(`Erro ao limpar ${tableName}: ${error.message}`);

    console.log(`✅ Tabela ${tableName} foi limpa com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao limpar ${tableName}:`, error);
    throw error;
  }
}

/**
 * Obter contagem de registros de todas as tabelas
 */
export async function obterContagemTabelas(): Promise<Record<string, number>> {
  const tabelas = [
    'tb_usuario',
    'tb_barbeiro',
    'tb_servico',
    'tb_agendamento',
    'tb_servico_has_tb_agendamento',
    'tb_barbeiro_indisponibilidade'
  ];

  const contagem: Record<string, number> = {};

  try {
    for (const tabela of tabelas) {
      const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`Erro ao contar ${tabela}:`, error);
        contagem[tabela] = -1;
      } else {
        contagem[tabela] = count || 0;
      }
    }

    return contagem;
  } catch (error) {
    console.error('Erro ao obter contagem:', error);
    throw error;
  }
}
