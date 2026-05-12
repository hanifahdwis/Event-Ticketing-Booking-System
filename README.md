# Week 8 : Project Structure

## Clean Architecture Folder Structure

```
event-ticketing/
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── event/
│   │   │   ├── booking/
│   │   │   └── refund/
│   │   ├── value-objects/
│   │   ├── events/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── exceptions/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
├── test/
│   └── domain/
├── nest-cli.json
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Initial Business Rules

### Event

- An event cannot be created if the end date is earlier than the start date.
- An event cannot be created if the maximum capacity is less than or equal to zero.
- A newly created event must have the status **Draft**.
- An event can only be published if it has at least one active ticket category.
- An event can only be published if the total ticket quota does not exceed the maximum event capacity.
- An event with status **Cancelled** cannot be published.
- An event with status **Completed** cannot be cancelled.
- When an event is cancelled, all paid bookings must be marked as requiring a refund.
- A ticket category price cannot be less than zero.
- A ticket category quota must be greater than zero.
- The ticket sales period must end before or at the event start date.
- The total quota of all ticket categories must not exceed the maximum event capacity.

### Booking

- A booking can only be created for an event with status **Published**.
- A booking can only be created for an active ticket category within its sales period.
- The ticket quantity must be greater than zero and must not exceed the remaining quota.
- A customer cannot have more than one active booking for the same event.
- A newly created booking must have the status **PendingPayment** with a payment deadline of 15 minutes after creation.
- A booking can only be paid if its status is **PendingPayment** and the payment deadline has not passed.
- The payment amount must equal the total booking price.
- A booking with status **PendingPayment** changes to **Expired** after its payment deadline has passed.
- A booking with status **Paid** cannot be marked as expired.
- When a booking expires, the previously reserved ticket quota is released.
- After payment, the system issues tickets with unique ticket codes.
- The total price is calculated from ticket unit price multiplied by quantity and is represented using the **Money** value object.

### Refund

- A refund can only be requested for a booking with status **Paid**.
- A refund cannot be requested if any ticket from the booking has already been checked in.
- A refund can only be requested before the refund deadline, unless the event is cancelled.
- A refund can only be approved or rejected if its status is **Requested**.
- A rejection reason must be provided when rejecting a refund.
- When a refund is approved, related tickets change to **Cancelled** and the booking changes to **Refunded**.
- A refund can only be marked as **PaidOut** if its status is **Approved**.
- A paid-out refund cannot be approved, rejected, or cancelled again.

---

## Initial Domain Model Draft

### Aggregates & Entities

```
Event (Aggregate Root)
└── TicketCategory (Entity)

Booking (Aggregate Root)
└── Ticket (Entity)

Refund (Aggregate Root)
```

### Value Objects

| Value Object | Description |
|---|---|
| `Money` | Represents a monetary amount. Amount must not be negative. |
| `EventSchedule` | Stores the start and end date of an event. End date must not be earlier than start date. |
| `SalesPeriod` | Stores the sales start and end date of a ticket category. Sales end date must not exceed the event start date. |
| `TicketCode` | A unique code generated after a booking is paid. |
| `PaymentDeadline` | The payment deadline of a booking. Must be later than the booking creation time. |

---

## Ubiquitous Language Glossary

| Term | Meaning |
|---|---|
| Event | An activity organized by an Event Organizer and attended by customers. |
| Event Organizer | A user who creates and manages events. |
| Customer | A user who books and purchases tickets. |
| Gate Officer | A user who validates tickets during event check-in. |
| System Admin | A user who manages refund payouts and monitors operations. |
| Ticket Category | A type of ticket offered for an event, such as Regular, VIP, or Early Bird. |
| Quota | The maximum number of tickets available in a ticket category. |
| Remaining Quota | The number of tickets still available for purchase in a ticket category. |
| Booking | A temporary reservation created before payment is completed. |
| PendingPayment | A booking status indicating that payment has not yet been completed. |
| Paid | A booking status indicating that payment has been successfully completed. |
| Expired | A booking status indicating that the payment deadline has passed without payment. |
| Refunded | A booking status indicating that a refund has been approved for the booking. |
| Ticket | Proof of attendance generated after a booking is paid. |
| Ticket Code | A unique code used to identify and validate a ticket during check-in. |
| Check-in | The process of validating a ticket when a participant enters the event venue. |
| Refund | The process of returning money to a customer. |
| Money | A value object representing a monetary amount. |
| Sales Period | The time window during which a ticket category can be purchased. |
| Payment Deadline | The deadline by which a booking must be paid before it expires. |
| Draft | An event status indicating the event has been created but not yet published. |
| Published | An event status indicating the event is visible and open for ticket purchases. |
| Cancelled | An event status indicating the event has been cancelled. |
| Completed | An event status indicating the event has concluded. |
| Active | A ticket status indicating the ticket is valid and has not yet been used. |
| CheckedIn | A ticket status indicating the ticket holder has successfully entered the event. |
| Requested | A refund status indicating a refund request has been submitted and is awaiting review. |
| Approved | A refund status indicating the refund request has been accepted. |
| Rejected | A refund status indicating the refund request has been denied. |
| PaidOut | A refund status indicating the refund amount has been disbursed to the customer. |
