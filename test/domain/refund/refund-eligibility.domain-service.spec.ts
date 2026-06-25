import { RefundEligibilityDomainService, IBookingRef, ITicketRef, IEventRef } from '../../../src/domain/refund/services/refund-eligibility.domain-service';

describe('RefundEligibilityDomainService', () => {
  let service: RefundEligibilityDomainService;

  beforeEach(() => {
    service = new RefundEligibilityDomainService();
  });

  it('should reject refund if booking status is not Paid', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'PendingPayment' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('should reject refund if any ticket has been checked in', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }, { status: 'CheckedIn' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('should reject refund if past the deadline (event has already started)', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-10T11:00:00Z'); 

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('should automatically approve refund if event status is Cancelled', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Cancelled', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-12T10:00:00Z'); 

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(true);
  });

  it('should allow refund if all conditions are met', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(true);
  });
});