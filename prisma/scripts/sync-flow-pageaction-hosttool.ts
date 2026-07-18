/**
 * 从本地库导出 HostPage / HostTool / Flow(+Revision/bindings) / PageAction，
 * 按稳定键 upsert 到目标库（默认 .env.test）。
 *
 * 用法：
 *   pnpm exec ts-node -r dotenv/config prisma/scripts/sync-flow-pageaction-hosttool.ts dotenv_config_path=.env.test
 *
 * 环境变量：
 *   LOCAL_DATABASE_URL   源库，默认 postgresql://user:pass@localhost:5432/agent
 *   DATABASE_URL         目标库（通常来自 dotenv_config_path=.env.test）
 *   SYNC_APP_DSN         可选，只同步匹配该 dsn 的 AppClient；默认同步所有能在目标库按 dsn 对齐的 App
 *   DRY_RUN=1            只打印计划，不写目标库
 */
import { Client } from 'pg';

type Row = Record<string, unknown>;

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.username}@${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(invalid url)';
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

async function withClient<T>(
  connectionString: string,
  label: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();
  console.log(`[sync] connected ${label}: ${maskUrl(connectionString)}`);
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function fetchAll(client: Client, sql: string, params: unknown[] = []): Promise<Row[]> {
  const result = await client.query(sql, params);
  return result.rows as Row[];
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value);
}

function asString(value: unknown): string {
  return String(value ?? '');
}

async function main(): Promise<void> {
  const localUrl =
    process.env.LOCAL_DATABASE_URL?.trim() ||
    'postgresql://user:pass@localhost:5432/agent';
  const remoteUrl = requireEnv('DATABASE_URL');
  const dryRun = process.env.DRY_RUN === '1';
  const onlyDsn = process.env.SYNC_APP_DSN?.trim() || null;

  if (localUrl === remoteUrl) {
    throw new Error('LOCAL_DATABASE_URL and DATABASE_URL must differ');
  }

  const exportBundle = await withClient(localUrl, 'local', async (local) => {
    const apps = await fetchAll(
      local,
      `SELECT id, name, dsn FROM "AppClient" ORDER BY id`,
    );
    const hostPages = await fetchAll(
      local,
      `SELECT * FROM "HostPage" ORDER BY id`,
    );
    const hostTools = await fetchAll(
      local,
      `SELECT * FROM "HostTool" ORDER BY id`,
    );
    const flows = await fetchAll(local, `SELECT * FROM "Flow" ORDER BY id`);
    const flowRevisions = await fetchAll(
      local,
      `SELECT * FROM "FlowRevision" ORDER BY id`,
    );
    const flowTools = await fetchAll(
      local,
      `SELECT ft.*, t.name AS "toolName", t."appClientId" AS "toolAppClientId"
       FROM "FlowTool" ft
       JOIN "Tool" t ON t.id = ft."toolId"
       ORDER BY ft.id`,
    );
    const flowHostTools = await fetchAll(
      local,
      `SELECT fht.*, ht."definitionKey" AS "hostToolDefinitionKey"
       FROM "FlowHostTool" fht
       JOIN "HostTool" ht ON ht.id = fht."hostToolId"
       ORDER BY fht.id`,
    );
    const pageActions = await fetchAll(
      local,
      `SELECT * FROM "PageAction" ORDER BY id`,
    );
    return {
      apps,
      hostPages,
      hostTools,
      flows,
      flowRevisions,
      flowTools,
      flowHostTools,
      pageActions,
    };
  });

  console.log('[sync] local export counts', {
    apps: exportBundle.apps.length,
    hostPages: exportBundle.hostPages.length,
    hostTools: exportBundle.hostTools.length,
    flows: exportBundle.flows.length,
    flowRevisions: exportBundle.flowRevisions.length,
    flowTools: exportBundle.flowTools.length,
    flowHostTools: exportBundle.flowHostTools.length,
    pageActions: exportBundle.pageActions.length,
  });

  await withClient(remoteUrl, 'remote', async (remote) => {
    await remote.query('BEGIN');
    try {
      const remoteApps = await fetchAll(
        remote,
        `SELECT id, name, dsn FROM "AppClient" ORDER BY id`,
      );
      const appIdMap = new Map<number, number>();
      for (const localApp of exportBundle.apps) {
        const dsn = asString(localApp.dsn);
        if (onlyDsn && dsn !== onlyDsn) {
          continue;
        }
        const remoteApp = remoteApps.find((row) => asString(row.dsn) === dsn);
        if (!remoteApp) {
          console.warn(
            `[sync] skip app id=${localApp.id} name=${localApp.name}: no remote AppClient with same dsn`,
          );
          continue;
        }
        appIdMap.set(asNumber(localApp.id), asNumber(remoteApp.id));
        console.log(
          `[sync] app map local=${localApp.id}(${localApp.name}) -> remote=${remoteApp.id}(${remoteApp.name})`,
        );
      }
      if (appIdMap.size === 0) {
        throw new Error('No AppClient mapped by dsn; abort');
      }

      // HostPage: unique(appClientId, scope)
      const hostPageIdMap = new Map<number, number>();
      for (const row of exportBundle.hostPages) {
        const remoteAppId = appIdMap.get(asNumber(row.appClientId));
        if (remoteAppId == null) continue;
        const scope = asString(row.scope);
        if (dryRun) {
          console.log(`[dry-run] upsert HostPage scope=${scope}`);
          continue;
        }
        const upserted = await remote.query(
          `INSERT INTO "HostPage"
            ("appClientId", scope, label, description, "routePattern", "sortOrder", "isActive", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
           ON CONFLICT ("appClientId", scope) DO UPDATE SET
             label = EXCLUDED.label,
             description = EXCLUDED.description,
             "routePattern" = EXCLUDED."routePattern",
             "sortOrder" = EXCLUDED."sortOrder",
             "isActive" = EXCLUDED."isActive",
             "updatedAt" = NOW()
           RETURNING id`,
          [
            remoteAppId,
            scope,
            row.label,
            row.description ?? null,
            row.routePattern ?? null,
            row.sortOrder ?? 0,
            row.isActive ?? true,
          ],
        );
        hostPageIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
      }

      // HostTool: unique(appClientId, definitionKey) and unique(appClientId, name)
      const hostToolIdMap = new Map<number, number>();
      for (const row of exportBundle.hostTools) {
        const remoteAppId = appIdMap.get(asNumber(row.appClientId));
        if (remoteAppId == null) continue;
        const definitionKey = asString(row.definitionKey);
        const remoteHostPageId =
          row.hostPageId == null
            ? null
            : hostPageIdMap.get(asNumber(row.hostPageId)) ?? null;
        if (row.hostPageId != null && remoteHostPageId == null && !dryRun) {
          throw new Error(
            `HostTool ${definitionKey}: hostPageId=${row.hostPageId} not mapped`,
          );
        }
        if (dryRun) {
          console.log(`[dry-run] upsert HostTool definitionKey=${definitionKey}`);
          continue;
        }
        const upserted = await remote.query(
          `INSERT INTO "HostTool"
            ("appClientId", "hostPageId", "definitionKey", name, description, "argsSchema",
             "argsTemplate", "sortOrder", "isActive", config, "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10::jsonb,NOW(),NOW())
           ON CONFLICT ("appClientId", "definitionKey") DO UPDATE SET
             "hostPageId" = EXCLUDED."hostPageId",
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             "argsSchema" = EXCLUDED."argsSchema",
             "argsTemplate" = EXCLUDED."argsTemplate",
             "sortOrder" = EXCLUDED."sortOrder",
             "isActive" = EXCLUDED."isActive",
             config = EXCLUDED.config,
             "updatedAt" = NOW()
           RETURNING id`,
          [
            remoteAppId,
            remoteHostPageId,
            definitionKey,
            row.name,
            row.description,
            JSON.stringify(row.argsSchema ?? {}),
            row.argsTemplate == null ? null : JSON.stringify(row.argsTemplate),
            row.sortOrder ?? 0,
            row.isActive ?? true,
            row.config == null ? null : JSON.stringify(row.config),
          ],
        );
        hostToolIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
      }

      // Flow: unique(appClientId, flowKey)
      const flowIdMap = new Map<number, number>();
      for (const row of exportBundle.flows) {
        const remoteAppId = appIdMap.get(asNumber(row.appClientId));
        if (remoteAppId == null) continue;
        const flowKey = asString(row.flowKey);
        if (dryRun) {
          console.log(`[dry-run] upsert Flow flowKey=${flowKey}`);
          continue;
        }
        const upserted = await remote.query(
          `INSERT INTO "Flow"
            ("appClientId", "flowKey", name, description, goal, profile, deliverable,
             intent, ir, version, constraints, "isActive", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6::"WorkflowProfile",$7::"WorkflowDeliverable",
                   $8::jsonb,$9::jsonb,$10,$11::jsonb,$12,$13,NOW(),NOW())
           ON CONFLICT ("appClientId", "flowKey") DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             goal = EXCLUDED.goal,
             profile = EXCLUDED.profile,
             deliverable = EXCLUDED.deliverable,
             intent = EXCLUDED.intent,
             ir = EXCLUDED.ir,
             version = EXCLUDED.version,
             constraints = EXCLUDED.constraints,
             "isActive" = EXCLUDED."isActive",
             "sortOrder" = EXCLUDED."sortOrder",
             "updatedAt" = NOW()
           RETURNING id`,
          [
            remoteAppId,
            flowKey,
            row.name,
            row.description ?? null,
            row.goal ?? null,
            row.profile,
            row.deliverable,
            JSON.stringify(row.intent ?? {}),
            JSON.stringify(row.ir ?? {}),
            row.version ?? 1,
            JSON.stringify(row.constraints ?? []),
            row.isActive ?? true,
            row.sortOrder ?? 0,
          ],
        );
        flowIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
      }

      // FlowRevision: unique(flowId, version)
      for (const row of exportBundle.flowRevisions) {
        const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
        if (remoteFlowId == null) continue;
        if (dryRun) {
          console.log(
            `[dry-run] upsert FlowRevision flowId=${row.flowId} version=${row.version}`,
          );
          continue;
        }
        await remote.query(
          `INSERT INTO "FlowRevision"
            ("flowId", version, intent, ir, deliverable, constraints, "changeNote", "createdAt")
           VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::"WorkflowDeliverable",$6::jsonb,$7,NOW())
           ON CONFLICT ("flowId", version) DO UPDATE SET
             intent = EXCLUDED.intent,
             ir = EXCLUDED.ir,
             deliverable = EXCLUDED.deliverable,
             constraints = EXCLUDED.constraints,
             "changeNote" = EXCLUDED."changeNote"`,
          [
            remoteFlowId,
            row.version,
            JSON.stringify(row.intent ?? {}),
            JSON.stringify(row.ir ?? {}),
            row.deliverable,
            JSON.stringify(row.constraints ?? []),
            row.changeNote ?? null,
          ],
        );
      }

      // FlowHostTool
      for (const row of exportBundle.flowHostTools) {
        const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
        const remoteHostToolId = hostToolIdMap.get(asNumber(row.hostToolId));
        if (remoteFlowId == null || remoteHostToolId == null) {
          console.warn(
            `[sync] skip FlowHostTool flowId=${row.flowId} hostToolId=${row.hostToolId} (unmapped)`,
          );
          continue;
        }
        if (dryRun) {
          console.log(
            `[dry-run] upsert FlowHostTool key=${row.hostToolDefinitionKey}`,
          );
          continue;
        }
        await remote.query(
          `INSERT INTO "FlowHostTool" ("flowId", "hostToolId", "isRequired")
           VALUES ($1,$2,$3)
           ON CONFLICT ("flowId", "hostToolId") DO UPDATE SET
             "isRequired" = EXCLUDED."isRequired"`,
          [remoteFlowId, remoteHostToolId, row.isRequired ?? false],
        );
      }

      // FlowTool: map Tool by (appClientId, name)
      for (const row of exportBundle.flowTools) {
        const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
        const remoteAppId = appIdMap.get(asNumber(row.toolAppClientId));
        if (remoteFlowId == null || remoteAppId == null) {
          console.warn(
            `[sync] skip FlowTool flowId=${row.flowId} tool=${row.toolName} (unmapped app/flow)`,
          );
          continue;
        }
        const toolRows = await fetchAll(
          remote,
          `SELECT id FROM "Tool" WHERE "appClientId" = $1 AND name = $2 LIMIT 1`,
          [remoteAppId, row.toolName],
        );
        if (toolRows.length === 0) {
          console.warn(
            `[sync] skip FlowTool: remote Tool name=${row.toolName} not found under appClientId=${remoteAppId}`,
          );
          continue;
        }
        if (dryRun) {
          console.log(`[dry-run] upsert FlowTool tool=${row.toolName}`);
          continue;
        }
        await remote.query(
          `INSERT INTO "FlowTool" ("flowId", "toolId", "isRequired")
           VALUES ($1,$2,$3)
           ON CONFLICT ("flowId", "toolId") DO UPDATE SET
             "isRequired" = EXCLUDED."isRequired"`,
          [remoteFlowId, asNumber(toolRows[0].id), row.isRequired ?? false],
        );
      }

      // PageAction: unique(appClientId, actionKey)
      for (const row of exportBundle.pageActions) {
        const remoteAppId = appIdMap.get(asNumber(row.appClientId));
        if (remoteAppId == null) continue;
        const actionKey = asString(row.actionKey);
        const remoteHostToolId =
          row.hostToolId == null
            ? null
            : hostToolIdMap.get(asNumber(row.hostToolId)) ?? null;
        const remoteFlowId =
          row.flowId == null ? null : flowIdMap.get(asNumber(row.flowId)) ?? null;
        if (row.hostToolId != null && remoteHostToolId == null && !dryRun) {
          throw new Error(
            `PageAction ${actionKey}: hostToolId=${row.hostToolId} not mapped`,
          );
        }
        if (row.flowId != null && remoteFlowId == null && !dryRun) {
          throw new Error(
            `PageAction ${actionKey}: flowId=${row.flowId} not mapped`,
          );
        }
        if (dryRun) {
          console.log(`[dry-run] upsert PageAction actionKey=${actionKey}`);
          continue;
        }
        await remote.query(
          `INSERT INTO "PageAction"
            ("appClientId", "actionKey", name, description, "hostToolId", "pageScope",
             "systemPrompt", "defaultDelivery", "allowCustomInstruction", "isActive",
             "sortOrder", config, "sourceSkillId", "workflowId", "workflowVersion",
             "workflowOverrides", "flowId", "flowVersion", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::"PageActionDelivery",$9,$10,$11,$12::jsonb,
                   NULL,NULL,NULL,$13::jsonb,$14,$15,NOW(),NOW())
           ON CONFLICT ("appClientId", "actionKey") DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             "hostToolId" = EXCLUDED."hostToolId",
             "pageScope" = EXCLUDED."pageScope",
             "systemPrompt" = EXCLUDED."systemPrompt",
             "defaultDelivery" = EXCLUDED."defaultDelivery",
             "allowCustomInstruction" = EXCLUDED."allowCustomInstruction",
             "isActive" = EXCLUDED."isActive",
             "sortOrder" = EXCLUDED."sortOrder",
             config = EXCLUDED.config,
             "workflowOverrides" = EXCLUDED."workflowOverrides",
             "flowId" = EXCLUDED."flowId",
             "flowVersion" = EXCLUDED."flowVersion",
             "updatedAt" = NOW()`,
          [
            remoteAppId,
            actionKey,
            row.name,
            row.description ?? null,
            remoteHostToolId,
            row.pageScope ?? null,
            row.systemPrompt,
            row.defaultDelivery,
            row.allowCustomInstruction ?? true,
            row.isActive ?? true,
            row.sortOrder ?? 0,
            row.config == null ? null : JSON.stringify(row.config),
            row.workflowOverrides == null
              ? null
              : JSON.stringify(row.workflowOverrides),
            remoteFlowId,
            row.flowVersion ?? null,
          ],
        );
      }

      if (dryRun) {
        await remote.query('ROLLBACK');
        console.log('[sync] DRY_RUN complete, rolled back');
        return;
      }

      await remote.query('COMMIT');
      console.log('[sync] committed to remote');

      const counts = await fetchAll(
        remote,
        `SELECT 'HostPage' t, count(*)::int n FROM "HostPage"
         UNION ALL SELECT 'HostTool', count(*)::int FROM "HostTool"
         UNION ALL SELECT 'Flow', count(*)::int FROM "Flow"
         UNION ALL SELECT 'FlowRevision', count(*)::int FROM "FlowRevision"
         UNION ALL SELECT 'PageAction', count(*)::int FROM "PageAction"`,
      );
      console.log('[sync] remote counts after sync', counts);
    } catch (error) {
      await remote.query('ROLLBACK');
      throw error;
    }
  });
}

main().catch((error) => {
  console.error('[sync] failed', error);
  process.exit(1);
});
