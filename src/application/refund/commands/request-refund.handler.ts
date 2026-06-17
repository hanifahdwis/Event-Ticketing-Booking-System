import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RequestRefundCommand } from './request-refund.command';
import { RequestRefundResponseDto } from '../dtos/request-refund.dto';
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
  IRefundRepository,
  REFUND_REPOSITORY,
} from '../../../domain/refund/repositories/refund.repository.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';
import { RefundId } from '../../../domain/refund/value-objects/refund-id.vo';
import {
  RefundEligibilityDomainService,
  IBookingRef,
  ITicketRef,
  IEventRef,
} from '../../../domain/refund/services/refund-eligibility.domain-service';
import { Refund } from '../../../domain/refund/aggregates/refund.aggregate';

@Injectable()
export class RequestRefundCommandHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: IRefundRepository,
  ) {}


  async execute(command: RequestRefundCommand): Promise<RequestRefundResponseDto> {
    const booking = await this.bookingRepository.findById(
      new BookingId(command.bookingId),
    );
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${command.bookingId}`);
    }
    if (booking.customerId !== command.customerId) {
      throw new ForbiddenException('You are not the owner of this booking');
    }

    const existingRefund = await this.refundRepository.findByBookingId(booking.id.value);
    if (existingRefund) {
      throw new BadRequestException('A refund has already been requested for this booking');
    }

    const event = await this.eventRepository.findById(booking.eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${booking.eventId.value}`);
    }

    const tickets = await this.ticketRepository.findByBookingId(booking.id);

    const bookingRef: IBookingRef = { id: booking.id.value, status: booking.status.value };
    const ticketRefs: ITicketRef[] = tickets.map((t) => ({ status: t.status.value }));
    const eventRef: IEventRef = { status: event.status.value, startDate: event.schedule.startDate };

    const eligibilityService = new RefundEligibilityDomainService();

    let refund: Refund;
    try {
      refund = Refund.request(
        RefundId.create(),
        bookingRef,
        ticketRefs,
        eventRef,
        command.customerId,
        booking.totalPrice,
        eligibilityService,
        new Date(),
      );
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    await this.refundRepository.save(refund);

    const dto = new RequestRefundResponseDto();
    dto.refundId = refund.id.getValue();
    dto.bookingId = refund.bookingId;
    dto.status = refund.status;
    dto.amount = refund.amount.amount;
    dto.currency = refund.amount.currency;

    return dto;
  }
}

