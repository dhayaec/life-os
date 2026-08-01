export const ROLES = ['user', 'admin'] as const;

export type Role = (typeof ROLES)[number];

const ROLE_RANK: Record<Role, number> = {
  user: 0,
  admin: 1,
};

export function hasRole(role: string | null | undefined, required: readonly Role[]): boolean {
  if (!role) return false;
  return required.some((r) => r === role);
}

export function roleAtLeast(role: string | null | undefined, minimum: Role): boolean {
  if (!role) return false;
  const rank = ROLE_RANK[role as Role];
  return rank !== undefined && rank >= ROLE_RANK[minimum];
}

export function assertRole(role: string | null | undefined, required: readonly Role[]): void {
  if (!hasRole(role, required)) {
    throw new Error('Forbidden: insufficient role');
  }
}
