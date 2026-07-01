import {
  buildAgentSkillVisibilityWhere,
  isCapabilityAppDefaultEnabled,
  resolveAgentHostToolCandidateIds,
  resolveAgentToolCandidateIds,
  resolveEffectiveRestrictTools,
} from './capability-candidate.util';

describe('capability-candidate.util', () => {
  const appActive = [1, 2, 3, 4, 5];

  describe('resolveAgentToolCandidateIds', () => {
    it('app default: empty whitelist returns all app active tools', () => {
      expect(
        resolveAgentToolCandidateIds({
          appDefaultEnabled: true,
          restrictTools: false,
          whitelistIds: [],
          appActiveIds: appActive,
        }),
      ).toEqual(appActive);
    });

    it('app default: restrict with whitelist intersects app active', () => {
      expect(
        resolveAgentToolCandidateIds({
          appDefaultEnabled: true,
          restrictTools: true,
          whitelistIds: [2, 3, 99],
          appActiveIds: appActive,
        }),
      ).toEqual([2, 3]);
    });

    it('app default: restrict with empty whitelist returns none', () => {
      expect(
        resolveAgentToolCandidateIds({
          appDefaultEnabled: true,
          restrictTools: true,
          whitelistIds: [],
          appActiveIds: appActive,
        }),
      ).toEqual([]);
    });

    it('legacy mode: uses whitelist only', () => {
      expect(
        resolveAgentToolCandidateIds({
          appDefaultEnabled: false,
          restrictTools: false,
          whitelistIds: [2, 7],
          appActiveIds: appActive,
        }),
      ).toEqual([2, 7]);
    });
  });

  describe('resolveAgentHostToolCandidateIds', () => {
    it('mirrors tool policy for host tools', () => {
      expect(
        resolveAgentHostToolCandidateIds({
          appDefaultEnabled: true,
          restrictHostTools: false,
          whitelistIds: [],
          appActiveIds: [10, 11],
        }),
      ).toEqual([10, 11]);
    });
  });

  describe('resolveEffectiveRestrictTools', () => {
    it('binding count implies restrict in app default mode', () => {
      expect(
        resolveEffectiveRestrictTools(
          { restrictTools: false },
          { toolBindings: 2 },
          true,
        ),
      ).toBe(true);
    });

    it('legacy mode always restricts', () => {
      expect(
        resolveEffectiveRestrictTools(
          { restrictTools: false },
          { toolBindings: 0 },
          false,
        ),
      ).toBe(true);
    });
  });

  describe('buildAgentSkillVisibilityWhere', () => {
    it('default mode without restrict uses app scope only', () => {
      expect(
        buildAgentSkillVisibilityWhere({
          appClientId: 1,
          agentId: 2,
          restrictSkills: false,
          skillWhitelistIds: [],
          appDefaultEnabled: true,
        }),
      ).toEqual({ appClientId: 1, isActive: true });
    });

    it('restrict with bindings filters by agentSkills', () => {
      expect(
        buildAgentSkillVisibilityWhere({
          appClientId: 1,
          agentId: 2,
          restrictSkills: true,
          skillWhitelistIds: [5],
          appDefaultEnabled: true,
        }),
      ).toEqual({
        appClientId: 1,
        isActive: true,
        agentSkills: { some: { agentId: 2 } },
      });
    });
  });

  describe('isCapabilityAppDefaultEnabled', () => {
    const prev = process.env.CAPABILITY_APP_DEFAULT;

    afterEach(() => {
      if (prev === undefined) {
        delete process.env.CAPABILITY_APP_DEFAULT;
      } else {
        process.env.CAPABILITY_APP_DEFAULT = prev;
      }
    });

    it('defaults to enabled', () => {
      delete process.env.CAPABILITY_APP_DEFAULT;
      expect(isCapabilityAppDefaultEnabled()).toBe(true);
    });

    it('false disables', () => {
      process.env.CAPABILITY_APP_DEFAULT = 'false';
      expect(isCapabilityAppDefaultEnabled()).toBe(false);
    });
  });
});
