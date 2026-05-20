import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AddTicketCategoryCommand } from './add-ticket-category.command';
import { AddTicketCategoryResponseDto } from '../dtos/add-ticket-category.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo'

@Injectable()
export class AddTicketCategoryCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(
    command: AddTicketCategoryCommand,
  ): Promise<AddTicketCategoryResponseDto> {
    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }

    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException(
        'Only the organizer can add ticket categories to this event',
      );
    }

    const ticketCategory = event.addTicketCategory({
      name: command.name,
      price: command.price,
      currency: command.currency,
      quota: command.quota,
      salesPeriod: {
        startDate: command.salesStartDate,
        endDate: command.salesEndDate,
      },
    });

    await this.eventRepository.save(event);

    const dto = new AddTicketCategoryResponseDto();
    dto.ticketCategoryId = ticketCategory.id.value;
    dto.eventId = event.id.value;
    dto.name = ticketCategory.name.value;
    dto.price = ticketCategory.price.amount;
    dto.currency = ticketCategory.price.currency;
    dto.quota = ticketCategory.quota.total;
    dto.salesStartDate = ticketCategory.salesPeriod.startDate;
    dto.salesEndDate = ticketCategory.salesPeriod.endDate;
    dto.isActive = ticketCategory.isActive;

    return dto;
  }
}