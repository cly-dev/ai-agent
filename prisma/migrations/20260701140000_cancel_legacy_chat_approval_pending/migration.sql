-- Chat write confirm no longer uses ApprovalRequest; cancel stale pending rows.
UPDATE "ApprovalRequest"
SET
  "status" = 'cancelled',
  "decidedAt" = NOW(),
  "decisionNote" = 'legacy chat approval inbox removed'
WHERE "source" = 'chat'
  AND "status" = 'pending';
