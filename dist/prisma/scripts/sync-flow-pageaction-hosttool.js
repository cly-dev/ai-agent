"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
function maskUrl(url) {
    try {
        const u = new URL(url);
        return `${u.username}@${u.hostname}:${u.port || '5432'}${u.pathname}`;
    }
    catch (_a) {
        return '(invalid url)';
    }
}
function requireEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        throw new Error(`Missing env ${name}`);
    }
    return value;
}
async function withClient(connectionString, label, fn) {
    const client = new pg_1.Client({
        connectionString,
        connectionTimeoutMillis: 20000,
    });
    await client.connect();
    console.log(`[sync] connected ${label}: ${maskUrl(connectionString)}`);
    try {
        return await fn(client);
    }
    finally {
        await client.end().catch(() => undefined);
    }
}
async function fetchAll(client, sql, params = []) {
    const result = await client.query(sql, params);
    return result.rows;
}
function asNumber(value) {
    return typeof value === 'number' ? value : Number(value);
}
function asString(value) {
    return String(value !== null && value !== void 0 ? value : '');
}
async function main() {
    var _a, _b;
    const localUrl = ((_a = process.env.LOCAL_DATABASE_URL) === null || _a === void 0 ? void 0 : _a.trim()) ||
        'postgresql://user:pass@localhost:5432/agent';
    const remoteUrl = requireEnv('DATABASE_URL');
    const dryRun = process.env.DRY_RUN === '1';
    const onlyDsn = ((_b = process.env.SYNC_APP_DSN) === null || _b === void 0 ? void 0 : _b.trim()) || null;
    if (localUrl === remoteUrl) {
        throw new Error('LOCAL_DATABASE_URL and DATABASE_URL must differ');
    }
    const exportBundle = await withClient(localUrl, 'local', async (local) => {
        const apps = await fetchAll(local, `SELECT id, name, dsn FROM "AppClient" ORDER BY id`);
        const hostPages = await fetchAll(local, `SELECT * FROM "HostPage" ORDER BY id`);
        const hostTools = await fetchAll(local, `SELECT * FROM "HostTool" ORDER BY id`);
        const flows = await fetchAll(local, `SELECT * FROM "Flow" ORDER BY id`);
        const flowRevisions = await fetchAll(local, `SELECT * FROM "FlowRevision" ORDER BY id`);
        const flowTools = await fetchAll(local, `SELECT ft.*, t.name AS "toolName", t."appClientId" AS "toolAppClientId"
       FROM "FlowTool" ft
       JOIN "Tool" t ON t.id = ft."toolId"
       ORDER BY ft.id`);
        const flowHostTools = await fetchAll(local, `SELECT fht.*, ht."definitionKey" AS "hostToolDefinitionKey"
       FROM "FlowHostTool" fht
       JOIN "HostTool" ht ON ht.id = fht."hostToolId"
       ORDER BY fht.id`);
        const pageActions = await fetchAll(local, `SELECT * FROM "PageAction" ORDER BY id`);
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
        await remote.query('BEGIN');
        try {
            const remoteApps = await fetchAll(remote, `SELECT id, name, dsn FROM "AppClient" ORDER BY id`);
            const appIdMap = new Map();
            for (const localApp of exportBundle.apps) {
                const dsn = asString(localApp.dsn);
                if (onlyDsn && dsn !== onlyDsn) {
                    continue;
                }
                const remoteApp = remoteApps.find((row) => asString(row.dsn) === dsn);
                if (!remoteApp) {
                    console.warn(`[sync] skip app id=${localApp.id} name=${localApp.name}: no remote AppClient with same dsn`);
                    continue;
                }
                appIdMap.set(asNumber(localApp.id), asNumber(remoteApp.id));
                console.log(`[sync] app map local=${localApp.id}(${localApp.name}) -> remote=${remoteApp.id}(${remoteApp.name})`);
            }
            if (appIdMap.size === 0) {
                throw new Error('No AppClient mapped by dsn; abort');
            }
            const hostPageIdMap = new Map();
            for (const row of exportBundle.hostPages) {
                const remoteAppId = appIdMap.get(asNumber(row.appClientId));
                if (remoteAppId == null)
                    continue;
                const scope = asString(row.scope);
                if (dryRun) {
                    console.log(`[dry-run] upsert HostPage scope=${scope}`);
                    continue;
                }
                const upserted = await remote.query(`INSERT INTO "HostPage"
            ("appClientId", scope, label, description, "routePattern", "sortOrder", "isActive", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
           ON CONFLICT ("appClientId", scope) DO UPDATE SET
             label = EXCLUDED.label,
             description = EXCLUDED.description,
             "routePattern" = EXCLUDED."routePattern",
             "sortOrder" = EXCLUDED."sortOrder",
             "isActive" = EXCLUDED."isActive",
             "updatedAt" = NOW()
           RETURNING id`, [
                    remoteAppId,
                    scope,
                    row.label,
                    (_a = row.description) !== null && _a !== void 0 ? _a : null,
                    (_b = row.routePattern) !== null && _b !== void 0 ? _b : null,
                    (_c = row.sortOrder) !== null && _c !== void 0 ? _c : 0,
                    (_d = row.isActive) !== null && _d !== void 0 ? _d : true,
                ]);
                hostPageIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
            }
            const hostToolIdMap = new Map();
            for (const row of exportBundle.hostTools) {
                const remoteAppId = appIdMap.get(asNumber(row.appClientId));
                if (remoteAppId == null)
                    continue;
                const definitionKey = asString(row.definitionKey);
                const remoteHostPageId = row.hostPageId == null
                    ? null
                    : (_e = hostPageIdMap.get(asNumber(row.hostPageId))) !== null && _e !== void 0 ? _e : null;
                if (row.hostPageId != null && remoteHostPageId == null && !dryRun) {
                    throw new Error(`HostTool ${definitionKey}: hostPageId=${row.hostPageId} not mapped`);
                }
                if (dryRun) {
                    console.log(`[dry-run] upsert HostTool definitionKey=${definitionKey}`);
                    continue;
                }
                const upserted = await remote.query(`INSERT INTO "HostTool"
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
           RETURNING id`, [
                    remoteAppId,
                    remoteHostPageId,
                    definitionKey,
                    row.name,
                    row.description,
                    JSON.stringify((_f = row.argsSchema) !== null && _f !== void 0 ? _f : {}),
                    row.argsTemplate == null ? null : JSON.stringify(row.argsTemplate),
                    (_g = row.sortOrder) !== null && _g !== void 0 ? _g : 0,
                    (_h = row.isActive) !== null && _h !== void 0 ? _h : true,
                    row.config == null ? null : JSON.stringify(row.config),
                ]);
                hostToolIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
            }
            const flowIdMap = new Map();
            for (const row of exportBundle.flows) {
                const remoteAppId = appIdMap.get(asNumber(row.appClientId));
                if (remoteAppId == null)
                    continue;
                const flowKey = asString(row.flowKey);
                if (dryRun) {
                    console.log(`[dry-run] upsert Flow flowKey=${flowKey}`);
                    continue;
                }
                const upserted = await remote.query(`INSERT INTO "Flow"
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
           RETURNING id`, [
                    remoteAppId,
                    flowKey,
                    row.name,
                    (_j = row.description) !== null && _j !== void 0 ? _j : null,
                    (_k = row.goal) !== null && _k !== void 0 ? _k : null,
                    row.profile,
                    row.deliverable,
                    JSON.stringify((_l = row.intent) !== null && _l !== void 0 ? _l : {}),
                    JSON.stringify((_m = row.ir) !== null && _m !== void 0 ? _m : {}),
                    (_o = row.version) !== null && _o !== void 0 ? _o : 1,
                    JSON.stringify((_p = row.constraints) !== null && _p !== void 0 ? _p : []),
                    (_q = row.isActive) !== null && _q !== void 0 ? _q : true,
                    (_r = row.sortOrder) !== null && _r !== void 0 ? _r : 0,
                ]);
                flowIdMap.set(asNumber(row.id), asNumber(upserted.rows[0].id));
            }
            for (const row of exportBundle.flowRevisions) {
                const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
                if (remoteFlowId == null)
                    continue;
                if (dryRun) {
                    console.log(`[dry-run] upsert FlowRevision flowId=${row.flowId} version=${row.version}`);
                    continue;
                }
                await remote.query(`INSERT INTO "FlowRevision"
            ("flowId", version, intent, ir, deliverable, constraints, "changeNote", "createdAt")
           VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::"WorkflowDeliverable",$6::jsonb,$7,NOW())
           ON CONFLICT ("flowId", version) DO UPDATE SET
             intent = EXCLUDED.intent,
             ir = EXCLUDED.ir,
             deliverable = EXCLUDED.deliverable,
             constraints = EXCLUDED.constraints,
             "changeNote" = EXCLUDED."changeNote"`, [
                    remoteFlowId,
                    row.version,
                    JSON.stringify((_s = row.intent) !== null && _s !== void 0 ? _s : {}),
                    JSON.stringify((_t = row.ir) !== null && _t !== void 0 ? _t : {}),
                    row.deliverable,
                    JSON.stringify((_u = row.constraints) !== null && _u !== void 0 ? _u : []),
                    (_v = row.changeNote) !== null && _v !== void 0 ? _v : null,
                ]);
            }
            for (const row of exportBundle.flowHostTools) {
                const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
                const remoteHostToolId = hostToolIdMap.get(asNumber(row.hostToolId));
                if (remoteFlowId == null || remoteHostToolId == null) {
                    console.warn(`[sync] skip FlowHostTool flowId=${row.flowId} hostToolId=${row.hostToolId} (unmapped)`);
                    continue;
                }
                if (dryRun) {
                    console.log(`[dry-run] upsert FlowHostTool key=${row.hostToolDefinitionKey}`);
                    continue;
                }
                await remote.query(`INSERT INTO "FlowHostTool" ("flowId", "hostToolId", "isRequired")
           VALUES ($1,$2,$3)
           ON CONFLICT ("flowId", "hostToolId") DO UPDATE SET
             "isRequired" = EXCLUDED."isRequired"`, [remoteFlowId, remoteHostToolId, (_w = row.isRequired) !== null && _w !== void 0 ? _w : false]);
            }
            for (const row of exportBundle.flowTools) {
                const remoteFlowId = flowIdMap.get(asNumber(row.flowId));
                const remoteAppId = appIdMap.get(asNumber(row.toolAppClientId));
                if (remoteFlowId == null || remoteAppId == null) {
                    console.warn(`[sync] skip FlowTool flowId=${row.flowId} tool=${row.toolName} (unmapped app/flow)`);
                    continue;
                }
                const toolRows = await fetchAll(remote, `SELECT id FROM "Tool" WHERE "appClientId" = $1 AND name = $2 LIMIT 1`, [remoteAppId, row.toolName]);
                if (toolRows.length === 0) {
                    console.warn(`[sync] skip FlowTool: remote Tool name=${row.toolName} not found under appClientId=${remoteAppId}`);
                    continue;
                }
                if (dryRun) {
                    console.log(`[dry-run] upsert FlowTool tool=${row.toolName}`);
                    continue;
                }
                await remote.query(`INSERT INTO "FlowTool" ("flowId", "toolId", "isRequired")
           VALUES ($1,$2,$3)
           ON CONFLICT ("flowId", "toolId") DO UPDATE SET
             "isRequired" = EXCLUDED."isRequired"`, [remoteFlowId, asNumber(toolRows[0].id), (_x = row.isRequired) !== null && _x !== void 0 ? _x : false]);
            }
            for (const row of exportBundle.pageActions) {
                const remoteAppId = appIdMap.get(asNumber(row.appClientId));
                if (remoteAppId == null)
                    continue;
                const actionKey = asString(row.actionKey);
                const remoteHostToolId = row.hostToolId == null
                    ? null
                    : (_y = hostToolIdMap.get(asNumber(row.hostToolId))) !== null && _y !== void 0 ? _y : null;
                const remoteFlowId = row.flowId == null ? null : (_z = flowIdMap.get(asNumber(row.flowId))) !== null && _z !== void 0 ? _z : null;
                if (row.hostToolId != null && remoteHostToolId == null && !dryRun) {
                    throw new Error(`PageAction ${actionKey}: hostToolId=${row.hostToolId} not mapped`);
                }
                if (row.flowId != null && remoteFlowId == null && !dryRun) {
                    throw new Error(`PageAction ${actionKey}: flowId=${row.flowId} not mapped`);
                }
                if (dryRun) {
                    console.log(`[dry-run] upsert PageAction actionKey=${actionKey}`);
                    continue;
                }
                await remote.query(`INSERT INTO "PageAction"
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
             "updatedAt" = NOW()`, [
                    remoteAppId,
                    actionKey,
                    row.name,
                    (_0 = row.description) !== null && _0 !== void 0 ? _0 : null,
                    remoteHostToolId,
                    (_1 = row.pageScope) !== null && _1 !== void 0 ? _1 : null,
                    row.systemPrompt,
                    row.defaultDelivery,
                    (_2 = row.allowCustomInstruction) !== null && _2 !== void 0 ? _2 : true,
                    (_3 = row.isActive) !== null && _3 !== void 0 ? _3 : true,
                    (_4 = row.sortOrder) !== null && _4 !== void 0 ? _4 : 0,
                    row.config == null ? null : JSON.stringify(row.config),
                    row.workflowOverrides == null
                        ? null
                        : JSON.stringify(row.workflowOverrides),
                    remoteFlowId,
                    (_5 = row.flowVersion) !== null && _5 !== void 0 ? _5 : null,
                ]);
            }
            if (dryRun) {
                await remote.query('ROLLBACK');
                console.log('[sync] DRY_RUN complete, rolled back');
                return;
            }
            await remote.query('COMMIT');
            console.log('[sync] committed to remote');
            const counts = await fetchAll(remote, `SELECT 'HostPage' t, count(*)::int n FROM "HostPage"
         UNION ALL SELECT 'HostTool', count(*)::int FROM "HostTool"
         UNION ALL SELECT 'Flow', count(*)::int FROM "Flow"
         UNION ALL SELECT 'FlowRevision', count(*)::int FROM "FlowRevision"
         UNION ALL SELECT 'PageAction', count(*)::int FROM "PageAction"`);
            console.log('[sync] remote counts after sync', counts);
        }
        catch (error) {
            await remote.query('ROLLBACK');
            throw error;
        }
    });
}
main().catch((error) => {
    console.error('[sync] failed', error);
    process.exit(1);
});
//# sourceMappingURL=sync-flow-pageaction-hosttool.js.map