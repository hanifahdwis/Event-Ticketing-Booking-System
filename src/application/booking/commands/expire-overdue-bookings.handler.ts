import { Injectable, Inject } from '@nestjs/common';
import { ExpireOverdueBookingsCommand } from './expire-overdue-bookings.command';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';

export interface ExpireOverdueBookingsResultDto {
  expiredCount: number;
  expiredBookingIds: string[];
  at: Date;
}


@Injectable()
export class ExpireOverdueBookingsCommandHandler {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,

    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(
    command: ExpireOverdueBookingsCommand,
  ): Promise<ExpireOverdueBookingsResultDto> {
    const overdueBookings = await this.bookingRepository.findExpiredPendingBookings(
      command.at,
    );

    const expiredBookingIds: string[] = [];

    for (const booking of overdueBookings) {
      try {
        booking.expire(command.at);
      } catch {
        continue;
      }

      await this.bookingRepository.save(booking);
      expiredBookingIds.push(booking.id.value);
      const event = await this.eventRepository.findById(booking.eventId);
      if (event) {
        try {
          event.releaseTicketCategoryQuota(
            booking.ticketCategoryId,
            booking.quantity.value,
          );
          await this.eventRepository.save(event);
        } catch {
        }
      }
    }

    return {
      expiredCount: expiredBookingIds.length,
      expiredBookingIds,
      at: command.at,
    };
  }
}