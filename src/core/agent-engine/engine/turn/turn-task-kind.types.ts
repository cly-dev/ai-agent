/** 用户任务类型（与 writeChannel / route 正交，Skill 对齐 SSOT）。 */
export type TurnTaskKind =
  | 'direct_answer'
  | 'page_read'
  | 'orchestrated_read'
  | 'http_mutation'
  | 'host_push';
