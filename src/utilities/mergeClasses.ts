type ClassValue = string | number | boolean | null | undefined;

export function mergeClasses(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
