import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RejectRefundCommand } from './reject-refund.command';
import { RejectRefundResponseDto } from '../dtos/reject-refund.dto';
import {
  IRefundRepository,
  REFUND_REPOSITORY,
} from '../../../domain/refund/repositories/refund.repository.interface';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';
import { RejectionReason } from '../../../domain/refund/value-objects/rejection-reason.vo';

@Injectable()
export class RejectRefundCommandHandler {
  constructor(
    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: IRefundRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  
  async execute(command: RejectRefundCommand): Promise<RejectRefundResponseDto> {
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
      throw new ForbiddenException('Only the organizer can reject refunds for this event');
    }

    let reason: RejectionReason;
    try {
      reason = RejectionReason.create(command.reason);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    try {
      refund.reject(reason);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.refundRepository.save(refund);

    await this.notificationService.sendRefundStatusNotification(
      refund.customerId,
      refund.id.getValue(),
      refund.status,
    );

    const dto = new RejectRefundResponseDto();
    dto.refundId = refund.id.getValue();
    dto.bookingId = refund.bookingId;
    dto.status = refund.status;
    dto.rejectionReason = reason.getValue();

    return dto;
  }
}

