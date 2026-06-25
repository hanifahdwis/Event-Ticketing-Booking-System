import { Injectable, Inject } from '@nestjs/common';
import { GetAllPurchasedTicketsQuery } from './get-all-purchased-tickets.query';
import { PurchasedTicketDto } from '../dtos/get-purchased-tickets.dto';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../../../domain/ticket/repositories/ticket.repository.interface';

export class GetAllPurchasedTicketsResponseDto {
  customerId: string;
  tickets: PurchasedTicketDto[];
}

@Injectable()
export class GetAllPurchasedTicketsQueryHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  async execute(
    query: GetAllPurchasedTicketsQuery,
  ): Promise<GetAllPurchasedTicketsResponseDto> {
    const paidBookings = await this.bookingRepository.findAllPaidByCustomerId(
      query.customerId,
    );

    const allTicketDtos: PurchasedTicketDto[] = [];

    for (const booking of paidBookings) {
      const tickets = await this.ticketRepository.findByBookingId(booking.id);
      for (const ticket of tickets) {
        const dto = new PurchasedTicketDto();
        dto.ticketId = ticket.id.value;
        dto.ticketCode = ticket.code.value;
        dto.eventId = ticket.eventId.value;
        dto.ticketCategoryId = ticket.ticketCategoryId.value;
        dto.status = ticket.status.value;
        allTicketDtos.push(dto);
      }
    }

    const responseDto = new GetAllPurchasedTicketsResponseDto();
    responseDto.customerId = query.customerId;
    responseDto.tickets = allTicketDtos;

    return responseDto;
  }
}