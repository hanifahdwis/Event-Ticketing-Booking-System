import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBookingCommand } from './create-booking.command';
import { CreateBookingResponseDto } from '../dtos/create-booking.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../domain/event/value-objects/ticket-category-id.vo';
import { Booking } from '../../../domain/booking/aggregates/booking.aggregate';

@Injectable()
export class CreateBookingCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}


  async execute(command: CreateBookingCommand): Promise<CreateBookingResponseDto> {
    const event = await this.eventRepository.findById(
      new EventId(command.eventId),
    );
    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }

    const ticketCategory = event.ticketCategories.find(
      (tc) => tc.id.value === command.ticketCategoryId,
    );
    if (!ticketCategory) {
      throw new NotFoundException(
        `Ticket category not found: ${command.ticketCategoryId}`,
      );
    }

    const existingBooking =
      await this.bookingRepository.findActiveByCustomerAndEvent(
        command.customerId,
        command.eventId,
      );

    let booking: Booking;
    try {
      booking = Booking.create({
        customerId: command.customerId,
        eventId: command.eventId,
        ticketCategoryId: command.ticketCategoryId,
        quantity: command.quantity,
        unitPrice: ticketCategory.price,
        eventIsPublished: event.status.isPublished(),
        ticketCategoryIsActive: ticketCategory.isActive,
        salesPeriodIsActive: ticketCategory.isAvailableAt(new Date()),
        remainingQuota: ticketCategory.quota.remaining,
        customerHasActiveBookingForEvent: !!existingBooking,
      });

      const tcId = new TicketCategoryId(command.ticketCategoryId);
      event.reserveTicketCategoryQuota(tcId, command.quantity);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    await this.bookingRepository.save(booking);
    await this.eventRepository.save(event);

    const dto = new CreateBookingResponseDto();
    dto.bookingId = booking.id.value;
    dto.customerId = booking.customerId;
    dto.eventId = booking.eventId.value;
    dto.ticketCategoryId = booking.ticketCategoryId.value;
    dto.quantity = booking.quantity.value;
    dto.totalPrice = booking.totalPrice.amount;
    dto.currency = booking.totalPrice.currency;
    dto.status = booking.status.value;
    dto.paymentDeadline = booking.paymentDeadline.value;

    return dto;
  }
}

