import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExpireBookingCommand } from './expire-booking.command';
import { ExpireBookingResponseDto } from '../dtos/expire-booking.dto';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';

@Injectable()
export class ExpireBookingCommandHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(command: ExpireBookingCommand): Promise<ExpireBookingResponseDto> {
    const booking = await this.bookingRepository.findById(
      new BookingId(command.bookingId),
    );
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${command.bookingId}`);
    }

    const now = new Date();
    try {
      booking.expire(now);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.bookingRepository.save(booking);

    const event = await this.eventRepository.findById(booking.eventId);
    if (event) {
      event.releaseTicketCategoryQuota(booking.ticketCategoryId, booking.quantity.value);
      await this.eventRepository.save(event);
    }

    const dto = new ExpireBookingResponseDto();
    dto.bookingId = booking.id.value;
    dto.status = booking.status.value;
    dto.expiredAt = now;

    return dto;
  }
}