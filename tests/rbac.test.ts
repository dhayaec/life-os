import { describe, expect, it } from 'vitest';

import { assertRole, hasRole, roleAtLeast } from '@/utils/rbac';

describe('hasRole', () => {
  it('allows a user whose role is in the required set', () => {
    expect(hasRole('admin', ['admin'])).toBe(true);
    expect(hasRole('user', ['user', 'admin'])).toBe(true);
  });

  it('rejects a role not in the required set', () => {
    expect(hasRole('user', ['admin'])).toBe(false);
  });

  it('rejects missing or unknown roles', () => {
    expect(hasRole(null, ['admin'])).toBe(false);
    expect(hasRole(undefined, ['admin'])).toBe(false);
    expect(hasRole('owner', ['admin'])).toBe(false);
  });
});

describe('roleAtLeast', () => {
  it('treats admin as at least admin', () => {
    expect(roleAtLeast('admin', 'admin')).toBe(true);
  });

  it('treats admin as at least user', () => {
    expect(roleAtLeast('admin', 'user')).toBe(true);
  });

  it('treats user as not at least admin', () => {
    expect(roleAtLeast('user', 'admin')).toBe(false);
  });

  it('rejects missing roles', () => {
    expect(roleAtLeast(null, 'user')).toBe(false);
  });
});

describe('assertRole', () => {
  it('does not throw when the role is allowed', () => {
    expect(() => assertRole('admin', ['admin'])).not.toThrow();
  });

  it('throws when the role is not allowed', () => {
    expect(() => assertRole('user', ['admin'])).toThrow('Forbidden');
  });
});
