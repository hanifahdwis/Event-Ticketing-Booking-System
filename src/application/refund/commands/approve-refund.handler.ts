import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApproveRefundCommand } from './approve-refund.command';
import { ApproveRefundResponseDto } from '../dtos/approve-refund.dto';
import {
  IRefundRepository,
  REFUND_REPOSITORY,
} from '../../../domain/refund/repositories/refund.repository.interface';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  ITicketRepository,
  TICKET_REPOSITORY,
} from '../../../domain/ticket/repositories/ticket.repository.interface';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';


@Injectable()
export class ApproveRefundCommandHandler {
  constructor(
    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: IRefundRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}


  async execute(command: ApproveRefundCommand): Promise<ApproveRefundResponseDto> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundException(`Refund not found: ${command.refundId}`);
    }

    const booking = await this.bookingRepository.findById(new BookingId(refund.bookingId));
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${refund.bookingId}`);
    }

    const event = await this.eventRepository.findById(booking.eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${booking.eventId.value}`);
    }
    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException('Only the organizer can approve refunds for this event');
    }
    
    try {
      refund.approve();
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.refundRepository.save(refund);

    booking.markAsRefunded();
    await this.bookingRepository.save(booking);
    const tickets = await this.ticketRepository.findByBookingId(booking.id);
    const ticketsToCancel = tickets.filter((t) => !t.status.isCancelled());
    for (const ticket of ticketsToCancel) {
      ticket.cancel();
    }
    if (ticketsToCancel.length > 0) {
      await this.ticketRepository.saveAll(ticketsToCancel);
    }

    try {
      event.releaseTicketCategoryQuota(
        booking.ticketCategoryId,
        booking.quantity.value,
      );
      await this.eventRepository.save(event);
    } catch (err) {
      console.warn(
        `Could not release quota for ticket category ${booking.ticketCategoryId.value}: ${(err as Error).message}`,
      );
    }

    await this.notificationService.sendRefundStatusNotification(
      refund.customerId,
      refund.id.getValue(),
      refund.status,
    );

    const dto = new ApproveRefundResponseDto();
    dto.refundId = refund.id.getValue();
    dto.bookingId = refund.bookingId;
    dto.status = refund.status;
    dto.approvedAt = new Date();

    return dto;
  }
}
