import { Injectable } from '@nestjs/common';
import { INotificationService } from '../../application/common/interfaces/notification-service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  async sendEventCreatedNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void> {
    console.log(
      `[Notification] EventCreated → organizer=${organizerId}, event=${eventId}, name="${eventName}"`,
    );
  }

  async sendEventPublishedNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void> {
    console.log(
      `[Notification] EventPublished → organizer=${organizerId}, event=${eventId}, name="${eventName}"`,
    );
  }

  async sendEventCancelledNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void> {
    console.log(
      `[Notification] EventCancelled → organizer=${organizerId}, event=${eventId}, name="${eventName}"`,
    );
  }

  async sendBookingConfirmationNotification(
    customerId: string,
    bookingId: string,
    eventName: string,
  ): Promise<void> {
    console.log(
      `[Notification] BookingConfirmation → customer=${customerId}, booking=${bookingId}, event="${eventName}"`,
    );
  }

  async sendRefundStatusNotification(
    customerId: string,
    refundId: string,
    status: string,
  ): Promise<void> {
    console.log(
      `[Notification] RefundStatus → customer=${customerId}, refund=${refundId}, status=${status}`,
    );
  }
}