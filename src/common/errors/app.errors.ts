import { GraphQLError } from 'graphql';

export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_OTP'
  | 'IDENTIFIER_IN_USE'
  | 'SESSION_ALREADY_ACTIVE'
  | 'SESSION_NOT_ACTIVE'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_NOT_FOUND'
  | 'INSUFFICIENT_FUNDS'
  | 'PRICE_NOT_SET'
  | 'ALREADY_DISPENSED';

export function appError(code: AppErrorCode, message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code } });
}
