import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DisableTicketCategoryCommand } from './disable-ticket-category.command';
import { DisableTicketCategoryResponseDto } from '../dtos/disable-ticket-category.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../domain/event/value-objects/ticket-category-id.vo';

@Injectable()
export class DisableTicketCategoryCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(
    command: DisableTicketCategoryCommand,
  ): Promise<DisableTicketCategoryResponseDto> {
    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }
    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException(
        'Only the organizer can disable ticket categories for this event',
      );
    }
    const ticketCategoryId = new TicketCategoryId(command.ticketCategoryId);
    event.disableTicketCategory(ticketCategoryId);

    await this.eventRepository.save(event);

    const disabledCategory = event.ticketCategories.find(
      (tc) => tc.id.equals(ticketCategoryId),
    );

    const dto = new DisableTicketCategoryResponseDto();
    dto.ticketCategoryId = command.ticketCategoryId;
    dto.eventId = command.eventId;
    dto.isActive = disabledCategory?.isActive ?? false;
    dto.disabledAt = new Date();

    return dto;
  }
}