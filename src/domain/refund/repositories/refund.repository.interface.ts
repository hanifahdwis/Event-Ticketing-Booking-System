import { Refund } from '../aggregates/refund.aggregate';

export interface IRefundRepository {
  save(refund: Refund): Promise<void>;
  findById(id: string): Promise<Refund | null>;
  findByBookingId(bookingId: string): Promise<Refund | null>;
}

export const REFUND_REPOSITORY = Symbol('IRefundRepository');