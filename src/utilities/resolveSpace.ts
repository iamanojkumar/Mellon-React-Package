const SPACE_TOKENS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']);

export type SpaceValue = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | (string & {}) | number;

export function resolveSpace(value: SpaceValue | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  if (SPACE_TOKENS.has(value)) return `var(--ds-space-${value})`;
  return value;
}
