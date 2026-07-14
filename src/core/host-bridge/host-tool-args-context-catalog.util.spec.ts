import {
  isHostToolCatalogEnumInjectEnabled,
  resolveHostToolArgsSchemaForToolCallBind,
} from './host-tool-args-context-catalog.util';

describe('host-tool-args-context-catalog', () => {
  const originalEnv = process.env.HOST_TOOL_CATALOG_ENUM_INJECT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.HOST_TOOL_CATALOG_ENUM_INJECT;
    } else {
      process.env.HOST_TOOL_CATALOG_ENUM_INJECT = originalEnv;
    }
  });

  it('does not inject enum by default', () => {
    delete process.env.HOST_TOOL_CATALOG_ENUM_INJECT;
    expect(isHostToolCatalogEnumInjectEnabled()).toBe(false);
    const schema = {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          'x-contextIdCatalog': 'categories',
        },
      },
    };
    const context = {
      categories: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }],
    };
    const resolved = resolveHostToolArgsSchemaForToolCallBind(schema, context);
    expect(resolved.catalogEnumInjected).toBe(false);
    expect(resolved.schema).toBe(schema);
  });

  it('injects enum when HOST_TOOL_CATALOG_ENUM_INJECT=1', () => {
    process.env.HOST_TOOL_CATALOG_ENUM_INJECT = '1';
    expect(isHostToolCatalogEnumInjectEnabled()).toBe(true);
    const schema = {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          'x-contextIdCatalog': 'categories',
        },
      },
    };
    const context = {
      categories: [{ id: 'a', title: 'A' }],
    };
    const resolved = resolveHostToolArgsSchemaForToolCallBind(schema, context);
    expect(resolved.catalogEnumInjected).toBe(true);
    const props = resolved.schema.properties as Record<string, unknown>;
    const ids = props.ids as Record<string, unknown>;
    const items = ids.items as Record<string, unknown>;
    expect(items.enum).toEqual(['a']);
  });
});
