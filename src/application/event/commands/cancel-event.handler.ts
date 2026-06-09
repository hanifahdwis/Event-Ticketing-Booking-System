import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CancelEventCommand } from './cancel-event.command';
import { CancelEventResponseDto } from '../dtos/cancel-event.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';

@Injectable()
export class CancelEventCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(command: CancelEventCommand): Promise<CancelEventResponseDto> {
    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }
    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException('Only the organizer can cancel this event');
    }
    event.cancel();
    
    await this.eventRepository.save(event);

    const dto = new CancelEventResponseDto();
    dto.id = event.id.value;
    dto.status = event.status.value;
    dto.cancelledAt = new Date();

    return dto;
  }
}