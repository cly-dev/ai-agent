export class WriteGateDecisionRejectedError extends Error {
  readonly code: string;

  constructor(message: string, code = 'INVALID_DRAFT_REVIEW_DECISION') {
    super(message);
    this.name = 'WriteGateDecisionRejectedError';
    this.code = code;
  }
}
