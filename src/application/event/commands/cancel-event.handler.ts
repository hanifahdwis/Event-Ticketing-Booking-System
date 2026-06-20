import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
  IRefundRepository,
  REFUND_REPOSITORY,
} from '../../../domain/refund/repositories/refund.repository.interface';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { RefundId } from '../../../domain/refund/value-objects/refund-id.vo';
import { Refund } from '../../../domain/refund/aggregates/refund.aggregate';
import { RefundEligibilityDomainService } from '../../../domain/refund/services/refund-eligibility.domain-service';

@Injectable()
export class CancelEventCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: IRefundRepository,

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

    try {
      event.cancel();
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.eventRepository.save(event);

    const paidBookings = await this.bookingRepository.findAllPaidByEventId(
      command.eventId,
    );
    const eligibilityService = new RefundEligibilityDomainService();

    for (const booking of paidBookings) {
      const existingRefund = await this.refundRepository.findByBookingId(
        booking.id.value,
      );
      if (existingRefund) {
        continue;
      }

      const tickets = await this.ticketRepository.findByBookingId(booking.id);

      const bookingRef = { id: booking.id.value, status: booking.status.value };
      const ticketRefs = tickets.map((t) => ({ status: t.status.value }));
      const eventRef = {
        status: event.status.value, 
        startDate: event.schedule.startDate,
      };
      const ticketsToUpdate = tickets.filter((t) => t.status.isActive());
      for (const ticket of ticketsToUpdate) {
        ticket.markAsRefundRequired();
      }
      if (ticketsToUpdate.length > 0) {
        await this.ticketRepository.saveAll(ticketsToUpdate);
      }

      const refund = Refund.request(
        RefundId.create(),
        bookingRef,
        ticketRefs,
        eventRef,
        booking.customerId,
        booking.totalPrice,
        eligibilityService,
        new Date(),
      );
      await this.refundRepository.save(refund);
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