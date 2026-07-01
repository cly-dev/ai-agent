import { executePageWorkflowFetchData } from './page-workflow-fetch-data.util';

describe('page-workflow-fetch-data.util', () => {
  it('executes tool by toolId with pageContext entity id in args', async () => {
    const prisma = {
      tool: {
        findFirst: jest.fn().mockResolvedValue({
          id: 42,
          name: 'get_review',
          description: 'Get review',
          inputSchema: {},
          schema: {},
          method: 'GET',
          path: '/reviews/{id}',
          timeout: 5000,
          agentMetadata: { mode: 'read' },
          responseProfile: null,
          integration: {
            id: 1,
            name: 'api',
            baseUrl: 'https://api.example.com',
            authMode: 'SYSTEM_ONLY',
            apiKey: 'k',
          },
        }),
      },
    };
    const toolEngine = {
      executeFromDefinition: jest.fn().mockResolvedValue({
        output: { data: { title: 'ok' } },
      }),
    };

    const observation = await executePageWorkflowFetchData({
      prisma: prisma as never,
      toolEngine: toolEngine as never,
      userId: 7,
      appClientId: 3,
      nodeInput: { toolId: 42 },
      pageContext: {
        page: 'review-detail',
        entity: { id: 'rev-1', type: 'review' },
      },
    });

    expect(prisma.tool.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 42, appClientId: 3 }),
      }),
    );
    expect(toolEngine.executeFromDefinition).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, name: 'get_review' }),
      expect.objectContaining({ id: 'rev-1' }),
      7,
    );
    expect(observation).toMatchObject({
      name: 'get_review',
      toolId: 42,
      output: { data: { title: 'ok' } },
    });
  });

  it('resolves tool by definitionKey when toolId is absent', async () => {
    const prisma = {
      tool: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5,
          name: 'list_items',
          description: 'List',
          inputSchema: {},
          schema: {},
          method: 'GET',
          path: '/items',
          timeout: null,
          agentMetadata: null,
          responseProfile: null,
          integration: {
            id: 1,
            name: 'api',
            baseUrl: 'https://api.example.com',
            authMode: 'SYSTEM_ONLY',
            apiKey: 'k',
          },
        }),
      },
    };
    const toolEngine = {
      executeFromDefinition: jest.fn().mockResolvedValue({ output: [] }),
    };

    await executePageWorkflowFetchData({
      prisma: prisma as never,
      toolEngine: toolEngine as never,
      userId: 1,
      appClientId: 2,
      nodeInput: { definitionKey: 'list_items' },
      pageContext: null,
    });

    expect(prisma.tool.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          definitionKey: 'list_items',
          appClientId: 2,
        }),
      }),
    );
  });
});
