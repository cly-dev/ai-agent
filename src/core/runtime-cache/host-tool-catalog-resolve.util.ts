import {
  HostToolExposure,
  HostToolSkillTrigger,
} from '../../../generated/prisma/client';
import type { HostToolDecisionDefinition } from '../host-bridge';
import type { AgentHostToolCatalogSnapshot } from './runtime-cache.types';

const LLM_EXPOSURES: HostToolExposure[] = [
  HostToolExposure.LLM,
  HostToolExposure.BOTH,
];

export function resolvePreferredHostToolIdsFromCatalog(
  catalog: AgentHostToolCatalogSnapshot,
  input: {
    skillId: number | null | undefined;
    skillTriggers: HostToolSkillTrigger[];
  },
): {
  preferredIds: number[];
  requiredByToolId: Map<number, boolean>;
} {
  const agentBoundIds = catalog.agentBoundHostToolIds;
  if (agentBoundIds.length === 0) {
    return { preferredIds: [], requiredByToolId: new Map() };
  }

  const allSkillBindings =
    input.skillId != null
      ? catalog.skillBindings.filter((row) => row.skillId === input.skillId)
      : [];

  const skillBindings = allSkillBindings
    .filter((row) => input.skillTriggers.includes(row.trigger))
    .map((row) => ({
      hostToolId: row.hostToolId,
      isRequired: row.isRequired,
    }));

  let preferredIds: number[];
  if (input.skillId != null) {
    if (skillBindings.length > 0) {
      preferredIds = skillBindings.map((row) => row.hostToolId);
    } else if (allSkillBindings.length === 0) {
      preferredIds = agentBoundIds;
    } else {
      preferredIds = [];
    }
  } else {
    preferredIds = agentBoundIds;
  }

  const requiredByToolId = new Map(
    skillBindings.map((row) => [row.hostToolId, row.isRequired]),
  );
  return { preferredIds, requiredByToolId };
}

export function filterHostToolCatalogRowsForPage(input: {
  catalog: AgentHostToolCatalogSnapshot;
  pageScope: string;
  preferredIds: number[];
  exposures: HostToolExposure[];
}): AgentHostToolCatalogSnapshot['agentBoundTools'] {
  if (input.preferredIds.length === 0) {
    return [];
  }
  const preferredSet = new Set(input.preferredIds);
  const exposureSet = new Set(input.exposures);
  return input.catalog.agentBoundTools.filter((tool) => {
    if (!preferredSet.has(tool.hostToolId)) {
      return false;
    }
    if (!tool.isActive) {
      return false;
    }
    if (!exposureSet.has(tool.exposure)) {
      return false;
    }
    if (tool.hostPageScope != null && tool.hostPageScope !== input.pageScope) {
      return false;
    }
    return true;
  });
}

export function toHostToolDecisionDefinitions(
  tools: AgentHostToolCatalogSnapshot['agentBoundTools'],
  requiredByToolId: Map<number, boolean>,
  preferredIds: number[],
): HostToolDecisionDefinition[] {
  const toolById = new Map(tools.map((tool) => [tool.hostToolId, tool]));
  return preferredIds
    .map((id) => toolById.get(id))
    .filter((tool): tool is NonNullable<typeof tool> => tool != null)
    .map((tool) => ({
      id: tool.hostToolId,
      name: tool.name,
      description: tool.description,
      argsSchema: tool.argsSchema,
      isRequired: requiredByToolId.get(tool.hostToolId) ?? false,
    }));
}

export type HostToolCatalogFilterDiagnostic = {
  hostToolId: number;
  name: string;
  included: boolean;
  reasons: string[];
  hostPageScope: string | null;
  exposure: HostToolExposure;
  isActive: boolean;
};

export function buildHostToolCatalogFilterDiagnostics(
  catalog: AgentHostToolCatalogSnapshot,
  input: {
    pageScope: string;
    preferredIds: number[];
    exposures: HostToolExposure[];
  },
): HostToolCatalogFilterDiagnostic[] {
  const toolById = new Map(
    catalog.agentBoundTools.map((tool) => [tool.hostToolId, tool]),
  );
  const exposureSet = new Set(input.exposures);
  return input.preferredIds.map((hostToolId) => {
    const tool = toolById.get(hostToolId);
    if (!tool) {
      return {
        hostToolId,
        name: '(missing from catalog)',
        included: false,
        reasons: ['not_in_agent_bound_catalog'],
        hostPageScope: null,
        exposure: HostToolExposure.LLM,
        isActive: false,
      };
    }
    const reasons: string[] = [];
    if (!tool.isActive) {
      reasons.push('inactive');
    }
    if (!exposureSet.has(tool.exposure)) {
      reasons.push(`exposure_not_llm:${tool.exposure}`);
    }
    if (tool.hostPageScope != null && tool.hostPageScope !== input.pageScope) {
      reasons.push(
        `page_mismatch:expected=${input.pageScope},actual=${tool.hostPageScope}`,
      );
    }
    return {
      hostToolId,
      name: tool.name,
      included: reasons.length === 0,
      reasons,
      hostPageScope: tool.hostPageScope,
      exposure: tool.exposure,
      isActive: tool.isActive,
    };
  });
}

export function resolveLlmHostToolsFromCatalog(
  catalog: AgentHostToolCatalogSnapshot,
  input: {
    pageScope: string;
    skillId: number | null | undefined;
    skillTriggers: HostToolSkillTrigger[];
  },
): HostToolDecisionDefinition[] {
  const pageScope = input.pageScope.trim();
  if (!pageScope) {
    return [];
  }
  const { preferredIds, requiredByToolId } = resolvePreferredHostToolIdsFromCatalog(
    catalog,
    {
      skillId: input.skillId,
      skillTriggers: input.skillTriggers,
    },
  );
  const scoped = filterHostToolCatalogRowsForPage({
    catalog,
    pageScope,
    preferredIds,
    exposures: LLM_EXPOSURES,
  });
  return toHostToolDecisionDefinitions(scoped, requiredByToolId, preferredIds);
}
