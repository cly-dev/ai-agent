/** 决策环可用的 Host Tool 元数据（执行在浏览器，不含 handler）。 */
export type HostToolDecisionDefinition = {
  id: number;
  name: string;
  description: string;
  argsSchema: Record<string, unknown>;
  /** SkillHostTool.isRequired；未绑 Skill 时为 false。 */
  isRequired?: boolean;
};
