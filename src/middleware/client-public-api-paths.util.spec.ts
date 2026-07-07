import { matchesClientPublicApiPath } from './client-public-api-paths';

describe('matchesClientPublicApiPath', () => {
  it('matches chat and nested chat routes', () => {
    expect(matchesClientPublicApiPath('/chat')).toBe(true);
    expect(matchesClientPublicApiPath('/chat/session-1/events')).toBe(true);
  });

  it('matches host-tool client routes including misrouted /admin prefix', () => {
    expect(matchesClientPublicApiPath('/host-tool/client/catalog')).toBe(true);
    expect(matchesClientPublicApiPath('/host-tool/client/register')).toBe(true);
    expect(matchesClientPublicApiPath('/admin/host-tool/client/catalog')).toBe(
      true,
    );
    expect(matchesClientPublicApiPath('/admin/host-tool/client/register')).toBe(
      true,
    );
  });

  it('matches agent client routes', () => {
    expect(matchesClientPublicApiPath('/agent/client/list')).toBe(true);
    expect(matchesClientPublicApiPath('/agent/client/available')).toBe(true);
    expect(matchesClientPublicApiPath('/agent/42/skills/client')).toBe(true);
    expect(matchesClientPublicApiPath('/admin/agent/client/list')).toBe(true);
  });

  it('matches page-action C-end routes', () => {
    expect(matchesClientPublicApiPath('/page-action/invoke')).toBe(true);
    expect(matchesClientPublicApiPath('/admin/page-action/invoke')).toBe(true);
    expect(matchesClientPublicApiPath('/page-action/runs')).toBe(true);
    expect(matchesClientPublicApiPath('/page-action/runs/42/stream')).toBe(true);
    expect(matchesClientPublicApiPath('/automation/tasks')).toBe(true);
    expect(matchesClientPublicApiPath('/automation/tasks/page_action_run/42')).toBe(
      true,
    );
    expect(matchesClientPublicApiPath('/page-action/run/42')).toBe(false);
    expect(matchesClientPublicApiPath('/page-action/client/catalog')).toBe(false);
  });

  it('does not match B-side admin-only routes', () => {
    expect(matchesClientPublicApiPath('/admin/page-action')).toBe(false);
    expect(matchesClientPublicApiPath('/admin/host-tool/by-app-client/1')).toBe(
      false,
    );
  });
});
