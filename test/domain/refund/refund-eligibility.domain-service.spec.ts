import { RefundEligibilityDomainService, IBookingRef, ITicketRef, IEventRef } from '../../../src/domain/refund/services/refund-eligibility.domain-service';

describe('RefundEligibilityDomainService', () => {
  let service: RefundEligibilityDomainService;

  beforeEach(() => {
    service = new RefundEligibilityDomainService();
  });

  it('seharusnya menolak refund jika status booking bukan Paid', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'PendingPayment' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('seharusnya menolak refund jika ada tiket yang sudah di-check-in', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }, { status: 'CheckedIn' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('seharusnya menolak refund jika melewati tenggat waktu (event sudah dimulai)', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-10T11:00:00Z'); // Waktu saat ini melebih start date

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(false);
  });

  it('seharusnya menyetujui refund secara otomatis jika event berstatus Cancelled', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Cancelled', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-12T10:00:00Z'); // Meski sudah lewat, event batal

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(true);
  });

  it('seharusnya mengizinkan refund jika semua syarat terpenuhi', () => {
    const booking: IBookingRef = { id: 'b-1', status: 'Paid' };
    const tickets: ITicketRef[] = [{ status: 'Active' }];
    const event: IEventRef = { status: 'Published', startDate: new Date('2026-06-10T10:00:00Z') };
    const currentDate = new Date('2026-06-08T10:00:00Z');

    const result = service.isEligible(booking, tickets, event, currentDate);
    expect(result).toBe(true);
  });
});