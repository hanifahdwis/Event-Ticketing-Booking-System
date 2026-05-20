import { Injectable, Inject } from '@nestjs/common';
import { GetAvailableEventsQuery } from './get-available-events.query';
import {
  GetAvailableEventsResponseDto,
  AvailableEventDto,
} from '../dtos/get-available-events.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { Event } from '../../../domain/event/aggregates/event.aggregate';

@Injectable()
export class GetAvailableEventsQueryHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(
    query: GetAvailableEventsQuery,
  ): Promise<GetAvailableEventsResponseDto> {
    let events: Event[] = await this.eventRepository.findAllPublished();
    if (query.filterByCity) {
      const city = query.filterByCity.toLowerCase();
      events = events.filter((e) =>
        e.location.city.toLowerCase().includes(city),
      );
    }

    if (query.filterByDate) {
      events = events.filter((e) =>
        e.schedule.isOnEventDay(query.filterByDate!),
      );
    }

    const eventDtos: AvailableEventDto[] = events.map((e: Event) => {
      const lowestPrice = e.getLowestTicketPrice();

      const dto = new AvailableEventDto();
      dto.id = e.id.value;
      dto.name = e.name.value;
      dto.startDate = e.schedule.startDate;
      dto.endDate = e.schedule.endDate;
      dto.address = e.location.address;
      dto.city = e.location.city;
      dto.status = e.status.value;
      dto.lowestPrice = lowestPrice ? lowestPrice.amount : null;
      dto.lowestPriceCurrency = lowestPrice ? lowestPrice.currency : null;

      return dto;
    });

    const responseDto = new GetAvailableEventsResponseDto();
    responseDto.events = eventDtos;

    return responseDto;
  }
}