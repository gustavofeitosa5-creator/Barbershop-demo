/**
 * Formata o telefone para exibição: (XX) XXXXX-XXXX
 * Sempre com DDD (11 dígitos)
 * Aceita apenas dígitos e remove caracteres especiais
 */
export function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  
  if (numeros.length === 0) return '';
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  
  // Máximo 11 dígitos (2 de DDD + 9 dígitos do telefone)
  const limitado = numeros.slice(0, 11);
  return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(7)}`;
}

/**
 * Valida se o telefone tem exatamente 11 dígitos (com DDD)
 */
export function validarTelefone(valor: string): { valido: boolean; erro?: string } {
  const numeros = valor.replace(/\D/g, '');
  
  if (!numeros) {
    return { valido: false, erro: 'Telefone é obrigatório' };
  }
  
  // Aceita apenas 11 dígitos (com DDD)
  if (numeros.length !== 11) {
    return { valido: false, erro: 'Telefone deve ter 11 dígitos (DDD + 9 números)' };
  }
  
  return { valido: true };
}

/**
 * Extrai apenas os dígitos do telefone
 */
export function extrairDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Aplica máscara de telefone enquanto o usuário digita
 * Retorna o valor formatado com máximo de 11 dígitos
 */
export function aplicarMascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  
  if (numeros.length === 0) return '';
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}
