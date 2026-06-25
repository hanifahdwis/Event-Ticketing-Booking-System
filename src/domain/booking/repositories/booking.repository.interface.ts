import { Booking } from '../aggregates/booking.aggregate';
import { BookingId } from '../value-objects/booking-id.vo';

export interface IBookingRepository {
  findById(id: BookingId): Promise<Booking | null>;

  findActiveByCustomerAndEvent(
    customerId: string,
    eventId: string,
  ): Promise<Booking | null>;

  findExpiredPendingBookings(at: Date): Promise<Booking[]>;

  findAllPaidByEventId(eventId: string): Promise<Booking[]>;
 
  findAllByEventId(eventId: string): Promise<Booking[]>;

  findAllPaidByCustomerId(customerId: string): Promise<Booking[]>;
  
  save(booking: Booking): Promise<void>;
}

export const BOOKING_REPOSITORY = Symbol('IBookingRepository');