export function normalizeDependsOn(dependsOn?: string | string[]): string[] {
  if (!dependsOn) return [];
  return Array.isArray(dependsOn) ? dependsOn : [dependsOn];
}

export function isEmptyParent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === '';
}

// Names the missing parent, rather than leaving a disabled control with no
// explanation for why it will not open.
export function gatedText(dependsOnList: string[]): string {
  return `Select ${dependsOnList.join(', ')} first`;
}
