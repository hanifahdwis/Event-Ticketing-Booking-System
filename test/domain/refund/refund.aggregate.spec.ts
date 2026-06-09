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
  const dummyAmount = new Money(150000, 'IDR');

  beforeEach(() => {
    mockEligibilityService = new RefundEligibilityDomainService();
  });

  describe('US 15 – Request Refund', () => {
    it('should create a refund with status Requested when eligible', () => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);

      const refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );

      expect(refund.status).toBe(RefundStatus.Requested);
    });

    it('should raise exactly one RefundRequested domain event', () => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);

      const refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );

      expect(refund.domainEvents).toHaveLength(1);
      expect(refund.domainEvents[0].constructor.name).toBe('RefundRequestedDomainEvent');
    });

    it('should throw when booking is not Paid', () => {
      const service = new RefundEligibilityDomainService();
      expect(() =>
        Refund.request(
          RefundId.create(),
          { id: 'b-1', status: 'PendingPayment' },
          [{ status: 'Active' }],
          { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
          'customer-123',
          dummyAmount,
          service,
          dummyDate,
        ),
      ).toThrow('Booking does not meet the requirements for a refund');
    });

    it('should throw when a ticket from the booking has already been checked in', () => {
      const service = new RefundEligibilityDomainService();
      expect(() =>
        Refund.request(
          RefundId.create(),
          { id: 'b-1', status: 'Paid' },
          [{ status: 'Active' }, { status: 'CheckedIn' }],
          { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
          'customer-123',
          dummyAmount,
          service,
          dummyDate,
        ),
      ).toThrow('Booking does not meet the requirements for a refund');
    });

    it('should allow refund when event is cancelled regardless of current date', () => {
      const service = new RefundEligibilityDomainService();
      const afterEventDate = new Date('2026-06-12T10:00:00Z');

      const refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Cancelled', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        service,
        afterEventDate,
      );

      expect(refund.status).toBe(RefundStatus.Requested);
    });

    it('should throw when current date is on or after event start date (refund deadline passed)', () => {
      const service = new RefundEligibilityDomainService();
      const onEventDay = new Date('2026-06-10T10:00:00Z');

      expect(() =>
        Refund.request(
          RefundId.create(),
          { id: 'b-1', status: 'Paid' },
          [{ status: 'Active' }],
          { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
          'customer-123',
          dummyAmount,
          service,
          onEventDay,
        ),
      ).toThrow('Booking does not meet the requirements for a refund');
    });
  });

  describe('US 16 – Approve Refund', () => {
    let refund: Refund;

    beforeEach(() => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);
      refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );
      refund.clearDomainEvents();
    });

    it('should change status to Approved when status is Requested', () => {
      refund.approve();
      expect(refund.status).toBe(RefundStatus.Approved);
    });

    it('should raise exactly one RefundApproved domain event', () => {
      refund.approve();
      expect(refund.domainEvents).toHaveLength(1);
      expect(refund.domainEvents[0].constructor.name).toBe('RefundApprovedDomainEvent');
    });

    it('should throw when refund is not in Requested status', () => {
      refund.approve();
      expect(() => refund.approve()).toThrow(
        'A refund can only be approved if its status is Requested',
      );
    });

    it('should throw when trying to approve a Rejected refund', () => {
      refund.reject(RejectionReason.create('Invalid request'));
      expect(() => refund.approve()).toThrow(
        'A refund can only be approved if its status is Requested',
      );
    });
  });

  describe('US 17 – Reject Refund', () => {
    let refund: Refund;

    beforeEach(() => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);
      refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );
      refund.clearDomainEvents();
    });

    it('should change status to Rejected with a rejection reason', () => {
      const reason = RejectionReason.create('Proof of payment is invalid');
      refund.reject(reason);
      expect(refund.status).toBe(RefundStatus.Rejected);
      expect(refund.rejectionReason?.getValue()).toBe('Proof of payment is invalid');
    });

    it('should raise exactly one RefundRejected domain event', () => {
      refund.reject(RejectionReason.create('Invalid request'));
      expect(refund.domainEvents).toHaveLength(1);
      expect(refund.domainEvents[0].constructor.name).toBe('RefundRejectedDomainEvent');
    });

    it('should throw when refund is not in Requested status', () => {
      refund.approve();
      expect(() => refund.reject(RejectionReason.create('reason'))).toThrow(
        'A refund can only be rejected if its status is Requested',
      );
    });

    it('should throw when rejection reason is empty', () => {
      expect(() => RejectionReason.create('')).toThrow();
    });

    it('should throw when rejection reason is whitespace only', () => {
      expect(() => RejectionReason.create('   ')).toThrow();
    });
  });

  describe('US 18 – Mark Refund as Paid Out', () => {
    let refund: Refund;

    beforeEach(() => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);
      refund = Refund.request(
        RefundId.create(),
        { id: 'b-1', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-123',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );
      refund.approve();
      refund.clearDomainEvents();
    });

    it('should change status to PaidOut when status is Approved', () => {
      refund.markAsPaidOut(PaymentReference.create('REF-001'));
      expect(refund.status).toBe(RefundStatus.PaidOut);
    });

    it('should record the payment reference', () => {
      refund.markAsPaidOut(PaymentReference.create('REF-001'));
      expect(refund.paymentReference?.getValue()).toBe('REF-001');
    });

    it('should raise exactly one RefundPaidOut domain event', () => {
      refund.markAsPaidOut(PaymentReference.create('REF-001'));
      expect(refund.domainEvents).toHaveLength(1);
      expect(refund.domainEvents[0].constructor.name).toBe('RefundPaidOutDomainEvent');
    });

    it('should throw when trying to mark PaidOut on a Requested refund', () => {
      jest.spyOn(mockEligibilityService, 'isEligible').mockReturnValue(true);
      const requestedRefund = Refund.request(
        RefundId.create(),
        { id: 'b-2', status: 'Paid' },
        [{ status: 'Active' }],
        { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') },
        'customer-456',
        dummyAmount,
        mockEligibilityService,
        dummyDate,
      );
      expect(() =>
        requestedRefund.markAsPaidOut(PaymentReference.create('REF-002')),
      ).toThrow('A refund can only be marked as paid out if its status is Approved');
    });

    it('should throw when trying to mark PaidOut on a PaidOut refund (terminal state)', () => {
      refund.markAsPaidOut(PaymentReference.create('REF-001'));
      expect(() =>
        refund.markAsPaidOut(PaymentReference.create('REF-002')),
      ).toThrow('A refund can only be marked as paid out if its status is Approved');
    });

    it('should throw when payment reference is empty', () => {
      expect(() => PaymentReference.create('')).toThrow();
    });
  });
});