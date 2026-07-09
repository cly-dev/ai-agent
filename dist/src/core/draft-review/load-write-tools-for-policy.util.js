"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWriteToolsForPolicy = void 0;
async function loadWriteToolsForPolicy(prisma, toolIds) {
    const uniqueIds = [...new Set(toolIds.filter((id) => id > 0))];
    if (uniqueIds.length === 0) {
        return new Map();
    }
    const rows = await prisma.tool.findMany({
        where: { id: { in: uniqueIds } },
        select: {
            id: true,
            name: true,
            inputSchema: true,
            schema: true,
            agentMetadata: true,
        },
    });
    return new Map(rows.map((row) => [row.id, row]));
}
exports.loadWriteToolsForPolicy = loadWriteToolsForPolicy;
//# sourceMappingURL=load-write-tools-for-policy.util.js.map