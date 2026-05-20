import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PublishEventCommand } from './publish-event.command';
import { PublishEventResponseDto } from '../dtos/publish-event.dto';
import {
  IEventRepository,
  EVENT_REPOSITORY,
} from '../../../domain/event/repositories/event.repository.interface';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../common/interfaces/notification-service.interface';

@Injectable()
export class PublishEventCommandHandler {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: PublishEventCommand): Promise<PublishEventResponseDto> {
    const eventId = new EventId(command.eventId);
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundException(`Event not found: ${command.eventId}`);
    }

    if (event.organizerId !== command.organizerId) {
      throw new ForbiddenException('Only the organizer can publish this event');
    }

    event.publish();

    await this.eventRepository.save(event);
    await this.notificationService.sendEventPublishedNotification(
      event.organizerId,
      event.id.value,
      event.name.value,
    );

    const dto = new PublishEventResponseDto();
    dto.id = event.id.value;
    dto.status = event.status.value;
    dto.publishedAt = new Date();

    return dto;
  }
}