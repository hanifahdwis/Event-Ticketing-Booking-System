import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CancelEventCommand } from './cancel-event.command';
import { CancelEventResponseDto } from '../dtos/cancel-event.dto';
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
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';

@Injectable()
export class CancelEventCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: CancelEventCommand): Promise<CancelEventResponseDto> {
    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }
    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException('Only the organizer can cancel this event');
    }
    
    event.cancel();
    await this.eventRepository.save(event);

    const paidBookings = await this.bookingRepository.findAllPaidByEventId(command.eventId);

    for (const booking of paidBookings) {
      booking.markAsRefunded();
      await this.bookingRepository.save(booking);

      const tickets = await this.ticketRepository.findByBookingId(booking.id);
      const ticketsToUpdate = tickets.filter((t) => t.status.isActive());
      for (const ticket of ticketsToUpdate) {
        ticket.markAsRefundRequired();
      }
      if (ticketsToUpdate.length > 0) {
        await this.ticketRepository.saveAll(ticketsToUpdate);
      }
    }

    await this.notificationService.sendEventCancelledNotification(
      event.organizerId,
      event.id.value,
      event.name.value,
    );

    const dto = new CancelEventResponseDto();
    dto.id = event.id.value;
    dto.status = event.status.value;
    dto.cancelledAt = new Date();

    return dto;
  }
}