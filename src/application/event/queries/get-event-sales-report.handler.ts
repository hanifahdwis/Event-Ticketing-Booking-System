import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GetEventSalesReportQuery } from './get-event-sales-report.query';
import {
  GetEventSalesReportResponseDto,
  TicketCategorySalesDto,
  BookingStatusCountDto,
} from '../dtos/get-event-sales-report.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import {
  IBookingRepository,
  BOOKING_REPOSITORY,
} from '../../../domain/booking/repositories/booking.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { BookingStatusEnum } from '../../../domain/booking/value-objects/booking-status.vo';

@Injectable()
export class GetEventSalesReportQueryHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(
    query: GetEventSalesReportQuery,
  ): Promise<GetEventSalesReportResponseDto> {
    const eventId = new EventId(query.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${query.eventId}`);
    }

    if (event.organizerId !== query.organizerId) {
      throw new ForbiddenException(
        'Only the organizer can view the sales report for this event',
      );
    }

    const salesPerCategory: TicketCategorySalesDto[] = event.ticketCategories.map(
      (tc) => {
        const sold = tc.quota.total - tc.quota.remaining;
        return {
          ticketCategoryId: tc.id.value,
          ticketCategoryName: tc.name.value,
          ticketsSold: sold,
        };
      },
    );

    const allBookings = await this.bookingRepository.findAllByEventId(
      query.eventId,
    );

    const statusCounts: BookingStatusCountDto = {
      pendingPayment: 0,
      paid: 0,
      expired: 0,
      refunded: 0,
    };

    let totalRevenue = 0;
    let currency = 'IDR';

    for (const booking of allBookings) {
      switch (booking.status.value) {
        case BookingStatusEnum.PENDING_PAYMENT:
          statusCounts.pendingPayment++;
          break;
        case BookingStatusEnum.PAID:
          statusCounts.paid++;
          totalRevenue += booking.totalPrice.amount;
          currency = booking.totalPrice.currency;
          break;
        case BookingStatusEnum.EXPIRED:
          statusCounts.expired++;
          break;
        case BookingStatusEnum.REFUNDED:
          statusCounts.refunded++;
          break;
      }
    }

    const dto = new GetEventSalesReportResponseDto();
    dto.eventId = event.id.value;
    dto.eventName = event.name.value;
    dto.salesPerCategory = salesPerCategory;
    dto.bookingStatusCounts = statusCounts;
    dto.totalRevenue = totalRevenue;
    dto.currency = currency;

    return dto;
  }
}
