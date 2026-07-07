import type { SkillDetailRow, SkillListRow, SkillResponse } from '../types/skill.types';
export declare function toSkillResponse(row: SkillDetailRow): SkillResponse;
export declare function toSkillListResponse(row: SkillListRow): SkillResponse;
export declare function toSkillResponseList(rows: SkillDetailRow[]): SkillResponse[];
export declare function toSkillListResponseList(rows: SkillListRow[]): SkillResponse[];
