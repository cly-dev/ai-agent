"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageBlocksPayloadSchema = exports.messageBlockSchema = void 0;
const zod_1 = require("zod");
const textBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('text'),
    content: zod_1.z.string(),
    format: zod_1.z.enum(['markdown', 'plain', 'html']).optional(),
});
const listBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('list'),
    title: zod_1.z.string().optional(),
    listType: zod_1.z.enum(['bullet', 'ordered', 'checklist']).optional(),
    items: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string(),
        checked: zod_1.z.boolean().optional(),
    })),
});
const quoteBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('quote'),
    content: zod_1.z.string(),
    source: zod_1.z.string().optional(),
    url: zod_1.z.string().optional(),
});
const codeBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('code'),
    language: zod_1.z.string().optional(),
    filename: zod_1.z.string().optional(),
    content: zod_1.z.string(),
});
const chartBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('chart'),
    chartType: zod_1.z.enum(['bar', 'line', 'pie']),
    title: zod_1.z.string().optional(),
    xAxis: zod_1.z.array(zod_1.z.string()),
    series: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        values: zod_1.z.array(zod_1.z.number()),
    })),
});
const tableBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('table'),
    title: zod_1.z.string().optional(),
    columns: zod_1.z.array(zod_1.z.object({
        key: zod_1.z.string(),
        label: zod_1.z.string(),
        align: zod_1.z.enum(['left', 'center', 'right']).optional(),
    })),
    data: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())),
});
const metricBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('metric'),
    items: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string(),
        value: zod_1.z.string(),
        delta: zod_1.z.string().optional(),
        trend: zod_1.z.enum(['up', 'down', 'flat']).optional(),
    })),
});
const alertBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('alert'),
    severity: zod_1.z.enum(['info', 'warning', 'error', 'success']),
    title: zod_1.z.string().optional(),
    message: zod_1.z.string(),
});
const imageBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('image'),
    url: zod_1.z.string(),
    alt: zod_1.z.string().optional(),
    caption: zod_1.z.string().optional(),
    width: zod_1.z.string().optional(),
});
const loadingBlockSchema = zod_1.z.object({
    type: zod_1.z.literal('loading'),
    id: zod_1.z.string(),
    hint: zod_1.z.string().optional(),
});
exports.messageBlockSchema = zod_1.z.discriminatedUnion('type', [
    textBlockSchema,
    listBlockSchema,
    quoteBlockSchema,
    codeBlockSchema,
    chartBlockSchema,
    tableBlockSchema,
    metricBlockSchema,
    alertBlockSchema,
    imageBlockSchema,
    loadingBlockSchema,
]);
exports.messageBlocksPayloadSchema = zod_1.z.object({
    blocks: zod_1.z.array(exports.messageBlockSchema).min(1),
});
//# sourceMappingURL=message-blocks.schema.js.map