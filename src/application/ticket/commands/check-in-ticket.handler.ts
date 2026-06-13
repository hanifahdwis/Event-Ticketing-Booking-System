import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CheckInTicketCommand } from './check-in-ticket.command';
import { CheckInTicketResponseDto } from '../dtos/check-in-ticket.dto';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../../../domain/ticket/repositories/ticket.repository.interface';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { TicketCode } from '../../../domain/ticket/value-objects/ticket-code.vo';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';

@Injectable()
export class CheckInTicketCommandHandler {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(command: CheckInTicketCommand): Promise<CheckInTicketResponseDto> {
    if (!command.ticketCode || command.ticketCode.trim().length === 0) {
      throw new NotFoundException('Ticket is invalid');
    }

    const ticket = await this.ticketRepository.findByCode(
      new TicketCode(command.ticketCode),
    );
    if (!ticket) {
      throw new NotFoundException('Ticket is invalid');
    }

    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }

    const now = new Date();

    try {
      ticket.checkIn({
        checkedInForEventId: eventId,
        eventIsCancelled: event.status.isCancelled(),
        isWithinCheckInWindow: event.schedule.isOnEventDay(now),
        checkedInAt: now,
      });
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    await this.ticketRepository.save(ticket);

    const dto = new CheckInTicketResponseDto();
    dto.ticketId = ticket.id.value;
    dto.ticketCode = ticket.code.value;
    dto.status = ticket.status.value;
    dto.checkedInAt = now;

    return dto;
  }
}
