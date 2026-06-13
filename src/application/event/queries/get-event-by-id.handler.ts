import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GetEventByIdQuery } from './get-event-by-id.query';
import {
  GetEventByIdResponseDto,
  TicketCategoryDto,
} from '../dtos/get-event.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { TicketCategory } from '../../../domain/event/entities/ticket-category.entity';

@Injectable()
export class GetEventByIdQueryHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(query: GetEventByIdQuery): Promise<GetEventByIdResponseDto> {
    const eventId = new EventId(query.eventId);
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundException(`Event not found: ${query.eventId}`);
    }
    
    if (!event.status.isPublished()) {
      throw new NotFoundException(`Event not found: ${query.eventId}`);
    }

    const activeCategories = event.ticketCategories.filter((tc) => tc.isActive);
    const now = new Date();
    const ticketCategoryDtos: TicketCategoryDto[] = activeCategories.map(
      (tc: TicketCategory) => {
        const dto = new TicketCategoryDto();
        dto.id = tc.id.value;
        dto.name = tc.name.value;
        dto.price = tc.price.amount;
        dto.currency = tc.price.currency;
        dto.totalQuota = tc.quota.total;
        dto.remainingQuota = tc.quota.remaining;
        dto.salesStartDate = tc.salesPeriod.startDate;
        dto.salesEndDate = tc.salesPeriod.endDate;
        dto.isActive = tc.isActive;
        
        if (tc.salesPeriod.isComingSoon(now)) {
          dto.displayStatus = 'ComingSoon';
        } else if (tc.salesPeriod.isClosed(now)) {
          dto.displayStatus = 'SalesClosed';
        } else if (tc.isSoldOut()) {
          dto.displayStatus = 'SoldOut';
        } else {
          dto.displayStatus = 'Available';
        }

        return dto;
      },
    );

    const lowestPrice = event.getLowestTicketPrice();

    const dto = new GetEventByIdResponseDto();
    dto.id = event.id.value;
    dto.organizerId = event.organizerId;
    dto.name = event.name.value;
    dto.description = event.description;
    dto.startDate = event.schedule.startDate;
    dto.endDate = event.schedule.endDate;
    dto.address = event.location.address;
    dto.city = event.location.city;
    dto.maxCapacity = event.maxCapacity.value;
    dto.status = event.status.value;
    dto.lowestPrice = lowestPrice ? lowestPrice.amount : null;
    dto.lowestPriceCurrency = lowestPrice ? lowestPrice.currency : null;
    dto.ticketCategories = ticketCategoryDtos;

    return dto;
  }
}