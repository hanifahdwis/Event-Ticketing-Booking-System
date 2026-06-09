import { Ticket } from '../aggregates/ticket.aggregate';
import { TicketId } from '../value-objects/ticket-id.vo';
import { TicketCode } from '../value-objects/ticket-code.vo';
import { BookingId } from '../../booking/value-objects/booking-id.vo';

export interface ITicketRepository {
  findById(id: TicketId): Promise<Ticket | null>;

  findByCode(code: TicketCode): Promise<Ticket | null>;

  findByBookingId(bookingId: BookingId): Promise<Ticket[]>;

  save(ticket: Ticket): Promise<void>;

  saveAll(tickets: Ticket[]): Promise<void>;
}

export const TICKET_REPOSITORY = Symbol('ITicketRepository');