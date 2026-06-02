/** 简单 {{varName}} 占位符替换（无逻辑分支）。 */

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string | number | boolean | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = variables[name];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
}
