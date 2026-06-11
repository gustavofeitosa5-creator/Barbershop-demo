/**
 * Exemplo de uso do módulo de limpeza de banco de dados
 * Este arquivo mostra como usar as funções de limpeza
 */

import { limparBancoDados, limparTabelaEspecifica, obterContagemTabelas } from './utils/dbCleanup';

/**
 * Exemplo 1: Limpar todas as tabelas
 */
async function exemplo1_LimparTudo() {
  try {
    console.log('--- Exemplo 1: Limpar todos os dados ---');
    
    // Verificar contagem antes
    console.log('Contagem ANTES da limpeza:');
    const contagemAntes = await obterContagemTabelas();
    console.table(contagemAntes);

    // Limpar tudo
    await limparBancoDados();

    // Verificar contagem depois
    console.log('Contagem DEPOIS da limpeza:');
    const contagemDepois = await obterContagemTabelas();
    console.table(contagemDepois);
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 2: Limpar apenas uma tabela específica
 */
async function exemplo2_LimparTabelaEspecifica() {
  try {
    console.log('--- Exemplo 2: Limpar apenas usuários ---');
    
    await limparTabelaEspecifica('tb_usuario');
    
    const contagem = await obterContagemTabelas();
    console.table(contagem);
  } catch (error) {
    console.error('Erro:', error);
  }
}

/**
 * Exemplo 3: Apenas verificar contagem
 */
async function exemplo3_VerificarContagem() {
  try {
    console.log('--- Exemplo 3: Verificar contagem de registros ---');
    
    const contagem = await obterContagemTabelas();
    console.log('Contagem de registros por tabela:');
    console.table(contagem);

    const total = Object.values(contagem).reduce((sum, count) => sum + count, 0);
    console.log(`Total de registros: ${total}`);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Descomente a função desejada para executar
// exemplo1_LimparTudo();
// exemplo2_LimparTabelaEspecifica();
// exemplo3_VerificarContagem();

export { exemplo1_LimparTudo, exemplo2_LimparTabelaEspecifica, exemplo3_VerificarContagem };
