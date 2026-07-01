/** Host Tool DSL 真流式总开关（默认开启；`HOST_TOOL_STREAM=0` 关闭）。 */
export function isHostToolStreamEnabled(): boolean {
  const raw = process.env.HOST_TOOL_STREAM?.trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
    return false;
  }
  return true;
}
