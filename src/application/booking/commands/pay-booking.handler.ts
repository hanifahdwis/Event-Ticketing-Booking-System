import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PayBookingCommand } from './pay-booking.command';
import { PayBookingResponseDto } from '../dtos/pay-booking.dto';
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
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from '../../common/interfaces/payment-gateway.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';
import { Money } from '../../../domain/shared/value-objects/money.vo';
import { Ticket } from '../../../domain/ticket/aggregates/ticket.aggregate';


@Injectable()
export class PayBookingCommandHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: ITicketRepository,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}


  async execute(command: PayBookingCommand): Promise<PayBookingResponseDto> {
    const booking = await this.bookingRepository.findById(
      new BookingId(command.bookingId),
    );
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${command.bookingId}`);
    }

    if (booking.customerId !== command.customerId) {
      throw new ForbiddenException('You are not the owner of this booking');
    }

    const paymentAmount = new Money(command.paymentAmount, command.currency);

    const paymentResult = await this.paymentGateway.charge(
      booking.id.value,
      command.customerId,
      paymentAmount.amount,
      paymentAmount.currency,
    );

    if (!paymentResult.success) {
      throw new BadRequestException('Payment failed, booking was not confirmed');
    }

    try {
      booking.pay(paymentAmount);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.bookingRepository.save(booking);

    const tickets = Array.from({ length: booking.quantity.value }, () =>
      Ticket.issue({
        bookingId: booking.id,
        customerId: booking.customerId,
        eventId: booking.eventId,
        ticketCategoryId: booking.ticketCategoryId,
      }),
    );
    await this.ticketRepository.saveAll(tickets);

    await this.notificationService.sendBookingConfirmationNotification(
      booking.customerId,
      booking.id.value,
      booking.eventId.value,
    );

    const dto = new PayBookingResponseDto();
    dto.bookingId = booking.id.value;
    dto.status = booking.status.value;
    dto.paidAt = new Date();

    return dto;
  }
}