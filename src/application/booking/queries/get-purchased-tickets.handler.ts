import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GetPurchasedTicketsQuery } from './get-purchased-tickets.query';
import {
  GetPurchasedTicketsResponseDto,
  PurchasedTicketDto,
} from '../dtos/get-purchased-tickets.dto';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../../../domain/ticket/repositories/ticket.repository.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';

@Injectable()
export class GetPurchasedTicketsQueryHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async execute(
    query: GetPurchasedTicketsQuery,
  ): Promise<GetPurchasedTicketsResponseDto> {
    const booking = await this.bookingRepository.findById(
      new BookingId(query.bookingId),
    );
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${query.bookingId}`);
    }

    if (booking.customerId !== query.customerId) {
      throw new ForbiddenException('You are not the owner of this booking');
    }
    if (!booking.status.isPaid() && !booking.status.isRefunded()) {
      throw new ForbiddenException(
        'Tickets are only available for paid bookings',
      );
    }

    const tickets = await this.ticketRepository.findByBookingId(booking.id);

    const ticketDtos: PurchasedTicketDto[] = tickets.map((ticket) => {
      const dto = new PurchasedTicketDto();
      dto.ticketId = ticket.id.value;
      dto.ticketCode = ticket.code.value;
      dto.eventId = ticket.eventId.value;
      dto.ticketCategoryId = ticket.ticketCategoryId.value;
      dto.status = ticket.status.value;
      return dto;
    });

    const dto = new GetPurchasedTicketsResponseDto();
    dto.bookingId = query.bookingId;
    dto.tickets = ticketDtos;

    return dto;
  }
}

