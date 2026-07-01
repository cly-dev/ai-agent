import {
  degradeObservations,
  parseObservationsJson,
  resolveObservationBlockPayload,
} from './observation-degrade.util';

function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}

describe('parseObservationsJson', () => {
  it('parses valid observation arrays', () => {
    const raw = JSON.stringify([
      {
        tool: 'query',
        success: true,
        records: [{ id: 1 }],
        summary: { matchedCount: 1 },
      },
    ]);
    expect(parseObservationsJson(raw)).toHaveLength(1);
    expect(parseObservationsJson(raw)[0]?.tool).toBe('query');
  });

  it('returns empty array for empty or invalid JSON', () => {
    expect(parseObservationsJson('')).toEqual([]);
    expect(parseObservationsJson('[]')).toEqual([]);
    expect(parseObservationsJson('not-json')).toEqual([]);
    expect(parseObservationsJson('{"tool":"x"}')).toEqual([]);
  });

  it('filters rows without tool field', () => {
    expect(parseObservationsJson('[{"success":true}]')).toEqual([]);
  });
});

describe('resolveObservationBlockPayload', () => {
  it('returns observations payload for valid JSON', () => {
    const raw = JSON.stringify([
      {
        tool: 'search',
        success: true,
        records: [],
        summary: { matchedCount: 0 },
      },
    ]);
    expect(resolveObservationBlockPayload(raw)).toEqual({
      type: 'observations',
      observations: expect.arrayContaining([
        expect.objectContaining({ tool: 'search' }),
      ]),
    });
  });

  it('falls back to raw text when JSON is invalid', () => {
    const raw = 'partial tool output { broken';
    expect(resolveObservationBlockPayload(raw)).toEqual({
      type: 'text',
      text: raw,
    });
  });

  it('falls back to raw text when JSON array has no observation shape', () => {
    const raw = '[{"foo":"bar"}]';
    expect(resolveObservationBlockPayload(raw)).toEqual({
      type: 'text',
      text: raw,
    });
  });

  it('returns empty observations for empty tagged body', () => {
    expect(resolveObservationBlockPayload('  ')).toEqual({
      type: 'observations',
      observations: [],
    });
  });
});

describe('degradeObservations', () => {
  it('L1 truncates records beyond configured max', () => {
    const observations = [
      {
        tool: 'query',
        success: true,
        records: Array.from({ length: 25 }, (_, index) => ({ id: index })),
        summary: { matchedCount: 25 },
      },
    ];
    const degraded = degradeObservations(observations, 1);
    expect(degraded[0]?.records).toHaveLength(20);
    expect(degraded[0]?.summary).toMatchObject({
      truncated: true,
      totalRecords: 25,
    });
  });

  it('L1 is a no-op when records are already under the limit', () => {
    const observations = [
      {
        tool: 'query',
        success: true,
        records: [{ id: 1 }],
        summary: { matchedCount: 1 },
      },
    ];
    const degraded = degradeObservations(observations, 1);
    expect(degraded).toEqual(observations);
  });

  it('L2 previews long string fields', () => {
    const longComment = repeatChar('c', 1000);
    const observations = [
      {
        tool: 'query',
        success: true,
        records: [{ id: 1, comment: longComment }],
        summary: { matchedCount: 1 },
      },
    ];
    const degraded = degradeObservations(observations, 2);
    const record = degraded[0]?.records?.[0] as Record<string, unknown>;
    expect(record.comment).toBeUndefined();
    expect(record.commentPreview).toContain('c');
    expect(record.commentLength).toBe(1000);
  });

  it('L3 collapses to inventory summary', () => {
    const observations = [
      {
        tool: 'query',
        success: true,
        records: [{ id: 1 }, { id: 2 }],
        summary: { matchedCount: 2 },
      },
    ];
    const degraded = degradeObservations(observations, 3);
    expect(degraded[0]?.records).toBeUndefined();
    expect(degraded[0]?.summary).toMatchObject({
      inventory: true,
      degradeLevel: 3,
      matchedCount: 2,
    });
  });
});
