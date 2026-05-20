export interface INotificationService {
  sendEventCreatedNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void>;

  sendEventPublishedNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void>;

  sendEventCancelledNotification(
    organizerId: string,
    eventId: string,
    eventName: string,
  ): Promise<void>;

  sendBookingConfirmationNotification(
    customerId: string,
    bookingId: string,
    eventName: string,
  ): Promise<void>;

  sendRefundStatusNotification(
    customerId: string,
    refundId: string,
    status: string,
  ): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('INotificationService');