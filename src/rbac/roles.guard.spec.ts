import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RolesGuard } from './roles.guard';
import { Role } from './role.enum';

function mockContext(user: { role: Role } | undefined): ExecutionContext {
  const ctx = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ({ req: { user } }),
  } as any);

  return ctx;
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(mockContext({ role: Role.PATIENT }))).toBe(true);
  });

  it('throws FORBIDDEN when the user role is not in the required list', () => {
    const reflector = { getAllAndOverride: () => [Role.SYSTEM_ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    try {
      guard.canActivate(mockContext({ role: Role.PATIENT }));
      fail('expected canActivate to throw');
    } catch (error: any) {
      expect(error.extensions.code).toBe('FORBIDDEN');
    }
  });

  it('allows access when the user role matches', () => {
    const reflector = { getAllAndOverride: () => [Role.SYSTEM_ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(mockContext({ role: Role.SYSTEM_ADMIN }))).toBe(true);
  });

  it('throws UNAUTHENTICATED when there is no user on the request', () => {
    const reflector = { getAllAndOverride: () => [Role.SYSTEM_ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    try {
      guard.canActivate(mockContext(undefined));
      fail('expected canActivate to throw');
    } catch (error: any) {
      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    }
  });
});
