import { z } from 'zod';

const textBlockSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
  format: z.enum(['markdown', 'plain', 'html']).optional(),
});

const listBlockSchema = z.object({
  type: z.literal('list'),
  title: z.string().optional(),
  listType: z.enum(['bullet', 'ordered', 'checklist']).optional(),
  items: z.array(
    z.object({
      text: z.string(),
      checked: z.boolean().optional(),
    }),
  ),
});

const quoteBlockSchema = z.object({
  type: z.literal('quote'),
  content: z.string(),
  source: z.string().optional(),
  url: z.string().optional(),
});

const codeBlockSchema = z.object({
  type: z.literal('code'),
  language: z.string().optional(),
  filename: z.string().optional(),
  content: z.string(),
});

const chartBlockSchema = z.object({
  type: z.literal('chart'),
  chartType: z.enum(['bar', 'line', 'pie']),
  title: z.string().optional(),
  xAxis: z.array(z.string()),
  series: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.number()),
    }),
  ),
});

const tableBlockSchema = z.object({
  type: z.literal('table'),
  title: z.string().optional(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      align: z.enum(['left', 'center', 'right']).optional(),
    }),
  ),
  data: z.array(z.record(z.string(), z.unknown())),
});

const metricBlockSchema = z.object({
  type: z.literal('metric'),
  items: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      delta: z.string().optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
    }),
  ),
});

const alertBlockSchema = z.object({
  type: z.literal('alert'),
  severity: z.enum(['info', 'warning', 'error', 'success']),
  title: z.string().optional(),
  message: z.string(),
});

const imageBlockSchema = z.object({
  type: z.literal('image'),
  url: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  width: z.string().optional(),
});

const loadingBlockSchema = z.object({
  type: z.literal('loading'),
  id: z.string(),
  hint: z.string().optional(),
});

export const messageBlockSchema = z.discriminatedUnion('type', [
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

export const messageBlocksPayloadSchema = z.object({
  blocks: z.array(messageBlockSchema).min(1),
});

export type MessageBlocksPayloadParsed = z.infer<typeof messageBlocksPayloadSchema>;
