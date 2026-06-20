import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GetEventParticipantsQuery } from './get-event-participants.query';
import {
  GetEventParticipantsResponseDto,
  ParticipantDto,
} from '../dtos/get-event-participants.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../../../domain/ticket/repositories/ticket.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';


@Injectable()
export class GetEventParticipantsQueryHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,
  ) {}

  
  async execute(
    query: GetEventParticipantsQuery,
  ): Promise<GetEventParticipantsResponseDto> {
    const eventId = new EventId(query.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${query.eventId}`);
    }

    if (event.organizerId !== query.organizerId) {
      throw new ForbiddenException(
        'Only the organizer can view participants for this event',
      );
    }
    const paidBookings = await this.bookingRepository.findAllPaidByEventId(
      query.eventId,
    );

    const participants: ParticipantDto[] = [];

    for (const booking of paidBookings) {
      const tickets = await this.ticketRepository.findByBookingId(booking.id);
      const categoryMap = new Map(
        event.ticketCategories.map((tc) => [tc.id.value, tc.name.value]),
      );

      for (const ticket of tickets) {
        const categoryName =
          categoryMap.get(ticket.ticketCategoryId.value) ?? 'Unknown';

        const participant = new ParticipantDto();
        participant.customerId = booking.customerId;
        participant.ticketCategoryId = ticket.ticketCategoryId.value;
        participant.ticketCategoryName = categoryName;
        participant.ticketCode = ticket.code.value;
        participant.checkInStatus = ticket.status.value;

        participants.push(participant);
      }
    }

    const dto = new GetEventParticipantsResponseDto();
    dto.eventId = event.id.value;
    dto.totalParticipants = participants.length;
    dto.participants = participants;

    return dto;
  }
}

