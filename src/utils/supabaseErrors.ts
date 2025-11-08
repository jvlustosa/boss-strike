import type { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseErrorInfo {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Extracts user-friendly error information from Supabase errors
 */
export function parseSupabaseError(error: any): SupabaseErrorInfo {
  // Supabase PostgrestError
  if (error?.code && error?.message) {
    const pgError = error as PostgrestError;
    return {
      message: getErrorMessage(pgError),
      code: pgError.code,
      details: pgError.details,
      hint: pgError.hint,
    };
  }

  // Supabase AuthError
  if (error?.status && error?.message) {
    return {
      message: getAuthErrorMessage(error),
      code: error.status?.toString(),
      details: error.message,
    };
  }

  // Generic error
  if (error?.message) {
    return {
      message: error.message,
      code: error.code || error.status?.toString(),
    };
  }

  // Fallback
  return {
    message: 'Ocorreu um erro inesperado',
    code: 'UNKNOWN',
  };
}

/**
 * Gets user-friendly error messages for PostgreSQL errors
 */
function getErrorMessage(error: PostgrestError): string {
  const code = error.code;
  const message = error.message.toLowerCase();

  // Unique constraint violations
  if (code === '23505') {
    if (message.includes('username')) {
      return 'Este nome de usuário já está em uso';
    }
    if (message.includes('email')) {
      return 'Este email já está cadastrado';
    }
    return 'Este valor já existe no sistema';
  }

  // Foreign key violations
  if (code === '23503') {
    return 'Referência inválida';
  }

  // Check constraint violations
  if (code === '23514') {
    if (message.includes('username')) {
      return 'Nome de usuário inválido (3-30 caracteres, apenas letras, números e _)';
    }
    return 'Valor não atende aos requisitos';
  }

  // Not null violations
  if (code === '23502') {
    return 'Campo obrigatório não preenchido';
  }

  // Default error message
  return error.message || 'Erro no banco de dados';
}

/**
 * Gets user-friendly error messages for Auth errors
 */
function getAuthErrorMessage(error: any): string {
  const status = error.status;
  const message = error.message?.toLowerCase() || '';

  // Common auth error codes
  switch (status) {
    case 400:
      if (message.includes('email')) {
        return 'Email inválido';
      }
      if (message.includes('password')) {
        return 'Senha muito fraca (mínimo 6 caracteres)';
      }
      return 'Dados inválidos';
    
    case 401:
      return 'Email ou senha incorretos';
    
    case 403:
      return 'Acesso negado';
    
    case 404:
      return 'Usuário não encontrado';
    
    case 422:
      if (message.includes('email')) {
        return 'Email já está em uso';
      }
      if (message.includes('user')) {
        return 'Usuário já existe';
      }
      return 'Dados inválidos';
    
    case 429:
      return 'Muitas tentativas. Tente novamente mais tarde';
    
    case 500:
      return 'Erro no servidor. Tente novamente';
    
    default:
      return error.message || 'Erro de autenticação';
  }
}

/**
 * Common Supabase error codes reference
 */
export const SUPABASE_ERROR_CODES = {
  // PostgreSQL errors
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',
  
  // Auth errors
  INVALID_CREDENTIALS: '401',
  USER_NOT_FOUND: '404',
  EMAIL_ALREADY_EXISTS: '422',
  WEAK_PASSWORD: '400',
} as const;

