import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ExpireBookingCommand } from './expire-booking.command';
import { ExpireBookingResponseDto } from '../dtos/expire-booking.dto';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';


@Injectable()
export class ExpireBookingCommandHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(command: ExpireBookingCommand): Promise<ExpireBookingResponseDto> {
    const booking = await this.bookingRepository.findById(
      new BookingId(command.bookingId),
    );
    if (!booking) {
      throw new NotFoundException(`Booking not found: ${command.bookingId}`);
    }

    
    booking.expire();
    await this.bookingRepository.save(booking);

    const dto = new ExpireBookingResponseDto();
    dto.bookingId = booking.id.value;
    dto.status = booking.status.value;
    dto.expiredAt = new Date();

    return dto;
  }
}
