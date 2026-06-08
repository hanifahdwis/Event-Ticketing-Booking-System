import { Refund } from '../../../src/domain/refund/aggregates/refund.aggregate';
import { RefundId } from '../../../src/domain/refund/value-objects/refund-id.vo';
import { RefundStatus } from '../../../src/domain/refund/value-objects/refund-status.vo';
import { RejectionReason } from '../../../src/domain/refund/value-objects/rejection-reason.vo';
import { PaymentReference } from '../../../src/domain/refund/value-objects/payment-reference.vo';
import { RefundEligibilityDomainService } from '../../../src/domain/refund/services/refund-eligibility.domain-service';
import { Money } from '../../../src/domain/shared/value-objects/money.vo';

describe('Refund Aggregate', () => {
  let mockEligibilityService: RefundEligibilityDomainService;
  const dummyDate = new Date('2026-06-08T10:00:00Z');
  const dummyAmount = new Money(150000);
  
  beforeEach(() => {
    mockEligibilityService = new RefundEligibilityDomainService();
  });

  describe('US 15: Request Refund', () => {
    it('seharusnya berhasil membuat request refund jika diizinkan oleh service', () => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);

      const refundId = RefundId.create();
      const refund = Refund.request(
        refundId,
        { id: 'b-1', status: 'Paid' },
        [],
        { status: 'Published', startDate: new Date() },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate
      );

      expect(refund.status).toBe(RefundStatus.Requested);
      expect(refund.domainEvents.length).toBe(1);
      expect(refund.domainEvents[0].constructor.name).toBe('RefundRequestedDomainEvent');
    });

    it('seharusnya melempar error jika tidak diizinkan oleh service', () => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(false);

      const refundId = RefundId.create();
      
      expect(() => {
        Refund.request(
          refundId,
          { id: 'b-1', status: 'PendingPayment' },
          [],
          { status: 'Published', startDate: new Date() },
          'customer-123',
          dummyAmount,
          mockEligibilityService,
          dummyDate
        );
      }).toThrow('Booking tidak memenuhi syarat untuk direfund.');
    });
  });

  describe('US 16, 17, 18: Refund Lifecycle', () => {
    let refund: Refund;

    beforeEach(() => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);
      refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [],
        { status: 'Published', startDate: new Date() },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate
      );
    });

    it('US 16: seharusnya bisa menyetujui refund berstatus Requested', () => {
      refund.approve();
      expect(refund.status).toBe(RefundStatus.Approved);
      expect(refund.domainEvents[1].constructor.name).toBe('RefundApprovedDomainEvent');
    });

    it('US 17: seharusnya bisa menolak refund berstatus Requested dengan alasan', () => {
      const reason = RejectionReason.create('Bukti transfer tidak valid');
      refund.reject(reason);
      
      expect(refund.status).toBe(RefundStatus.Rejected);
      expect(refund.rejectionReason?.getValue()).toBe('Bukti transfer tidak valid');
    });

    it('US 18: seharusnya bisa menandai refund sebagai PaidOut jika statusnya Approved', () => {
      refund.approve();
      
      const reference = PaymentReference.create('REF-999-OK');
      refund.markAsPaidOut(reference);
      
      expect(refund.status).toBe(RefundStatus.PaidOut);
      expect(refund.paymentReference?.getValue()).toBe('REF-999-OK');
    });

    it('seharusnya gagal menandai PaidOut jika status belum Approved', () => {
      const reference = PaymentReference.create('REF-999-OK');
      expect(() => refund.markAsPaidOut(reference)).toThrow('Refund hanya dapat ditandai sebagai PaidOut jika statusnya Approved.');
    });
  });
});