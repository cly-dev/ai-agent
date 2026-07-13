import type { StoredTaskPlan } from '../../../../memory/goa/session-goa.types';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export declare function toStoredTaskPlan(plan: TaskPlanSnapshot): StoredTaskPlan;
export declare function fromStoredTaskPlan(stored: StoredTaskPlan): TaskPlanSnapshot;
