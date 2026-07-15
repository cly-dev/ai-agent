/** N 张图 → 固定网格；不随原图比例变化。 */

export function layoutForCount(count: number): { rows: number; cols: number } {
  const n = Math.max(0, Math.floor(count));
  if (n <= 1) {
    return { rows: 1, cols: 1 };
  }
  if (n === 2) {
    return { rows: 1, cols: 2 };
  }
  if (n <= 4) {
    return { rows: 2, cols: 2 };
  }
  return { rows: 2, cols: 3 };
}
