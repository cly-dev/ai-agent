import {
  parseApprovalTriggerBinding,
  resolveApprovalParties,
} from './resolve-approval-parties.util';

describe('resolve-approval-parties.util', () => {
  describe('parseApprovalTriggerBinding', () => {
    it('returns null for empty or invalid config', () => {
      expect(parseApprovalTriggerBinding(null)).toBeNull();
      expect(parseApprovalTriggerBinding([])).toBeNull();
      expect(parseApprovalTriggerBinding({ approverUserId: 0 })).toBeNull();
      expect(parseApprovalTriggerBinding({ approverUserId: 'x' })).toBeNull();
    });

    it('parses positive approverUserId', () => {
      expect(parseApprovalTriggerBinding({ approverUserId: 42 })).toEqual({
        approverUserId: 42,
      });
    });
  });

  describe('resolveApprovalParties', () => {
    it('chat/page_action default approver equals initiator', () => {
      const result = resolveApprovalParties({
        source: 'chat',
        initiatorUserId: 7,
      });
      expect(result).toEqual({
        ok: true,
        parties: { initiatorUserId: 7, approverUserId: 7 },
      });
    });

    it('page_action allows trigger binding override', () => {
      const result = resolveApprovalParties({
        source: 'page_action',
        initiatorUserId: 7,
        triggerBinding: { approverUserId: 99 },
      });
      expect(result).toEqual({
        ok: true,
        parties: { initiatorUserId: 7, approverUserId: 99 },
      });
    });

    it('webhook requires configured approver and null initiator', () => {
      expect(
        resolveApprovalParties({
          source: 'webhook',
          initiatorUserId: null,
          webhookApproverUserId: null,
        }),
      ).toEqual({ ok: false, code: 'missing_webhook_approver' });

      expect(
        resolveApprovalParties({
          source: 'webhook',
          initiatorUserId: null,
          webhookApproverUserId: 5,
        }),
      ).toEqual({
        ok: true,
        parties: { initiatorUserId: null, approverUserId: 5 },
      });
    });

    it('rejects missing initiator for human channels', () => {
      expect(
        resolveApprovalParties({
          source: 'chat',
          initiatorUserId: null,
        }),
      ).toEqual({ ok: false, code: 'missing_initiator' });
    });

    it('rejects invalid approver override', () => {
      expect(
        resolveApprovalParties({
          source: 'page_action',
          initiatorUserId: 1,
          triggerBinding: { approverUserId: -1 },
        }),
      ).toEqual({ ok: false, code: 'invalid_approver_override' });
    });
  });
});
