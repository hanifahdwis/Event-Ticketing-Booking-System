# Event Ticketing & Booking System

```
event-ticketing/
├── src/
│   ├── domain/                              
│   │   ├── event/                           
│   │   │   ├── aggregates/
│   │   │   │   └── event.aggregate.ts       
│   │   │   ├── entities/
│   │   │   │   └── ticket-category.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── capacity.vo.ts           ← Max event capacity (must be > 0)
│   │   │   │   ├── event-id.vo.ts           ← UUID-based event identifier
│   │   │   │   ├── event-name.vo.ts         ← Non-empty, max 255 chars
│   │   │   │   ├── event-schedule.vo.ts     ← startDate + endDate (end >= start)
│   │   │   │   ├── event-status.vo.ts       ← Draft | Published | Cancelled | Completed
│   │   │   │   ├── location.vo.ts           ← address + city (both non-empty)
│   │   │   │   ├── quota.vo.ts              ← total + remaining (immutable, replaceable)
│   │   │   │   ├── sales-period.vo.ts       ← salesStart + salesEnd <= eventStart
│   │   │   │   ├── ticket-category-id.vo.ts ← UUID-based ticket category identifier
│   │   │   │   └── ticket-category-name.vo.ts← Non-empty, max 100 chars
│   │   │   ├── domain-events/
│   │   │   │   ├── event-created.domain-event.ts
│   │   │   │   ├── event-published.domain-event.ts
│   │   │   │   ├── event-cancelled.domain-event.ts      
│   │   │   │   ├── ticket-category-created.domain-event.ts
│   │   │   │   └── ticket-category-disabled.domain-event.ts
│   │   │   └── repositories/
│   │   │       └── event.repository.interface.ts        
│   │   │
│   │   ├── booking/                        
│   │   │   ├── aggregates/
│   │   │   │   └── booking.aggregate.ts     
│   │   │   ├── value-objects/
│   │   │   │   ├── booking-id.vo.ts         ← (scaffolded)
│   │   │   │   ├── booking-status.vo.ts     ← PendingPayment | Paid | Expired | Refunded
│   │   │   │   ├── payment-deadline.vo.ts   ← 15 min after booking creation
│   │   │   │   └── quantity.vo.ts           ← must be > 0
│   │   │   ├── services/
│   │   │   │   └── booking-pricing.domain-service.ts
│   │   │   └── repositories/
│   │   │       └── booking.repository.interface.ts  
│   │   │
│   │   ├── ticket/                         
│   │   │   ├── aggregates/
│   │   │   │   └── ticket.aggregate.ts      
│   │   │   ├── value-objects/
│   │   │   │   ├── ticket-id.vo.ts          ← (scaffolded)
│   │   │   │   ├── ticket-code.vo.ts        ← unique code per ticket
│   │   │   │   └── ticket-status.vo.ts      ← Active | CheckedIn | Cancelled
│   │   │   ├── services/
│   │   │   │   └── ticket-code-generator.domain-service.ts  
│   │   │   ├── domain-events/
│   │   │   │   └── ticket-checked-in.domain-event.ts  
│   │   │   └── repositories/
│   │   │       └── ticket.repository.interface.ts    
│   │   │
│   │   ├── refund/                          
│   │   │   ├── aggregates/
│   │   │   │   └── refund.aggregate.ts      
│   │   │   ├── value-objects/
│   │   │   │   ├── refund-id.vo.ts          ← (scaffolded)
│   │   │   │   ├── refund-status.vo.ts      ← Requested | Approved | Rejected | PaidOut
│   │   │   │   ├── rejection-reason.vo.ts   ← (scaffolded)
│   │   │   │   └── payment-reference.vo.ts  ← (scaffolded)
│   │   │   ├── services/
│   │   │   │   └── refund-eligibility.domain-service.ts  
│   │   │   ├── domain-events/
│   │   │   │   ├── refund-requested.domain-event.ts   
│   │   │   │   ├── refund-approved.domain-event.ts   
│   │   │   │   ├── refund-rejected.domain-event.ts   
│   │   │   │   └── refund-paid-out.domain-event.ts    
│   │   │   └── repositories/
│   │   │       └── refund.repository.interface.ts     
│   │   │
│   │   └── shared/                          ← Cross-cutting domain concepts
│   │       └── value-objects/
│   │           ├── money.vo.ts              ← amount + currency (amount >= 0)
│   │           ├── customer-id.vo.ts        ← (scaffolded)
│   │           └── organizer-id.vo.ts       ← (scaffolded)
│   │
│   ├── application/                         
│   ├── infrastructure/                     
│   └── presentation/                        
│
├── test/
│   └── domain/
│       ├── event/
│       │   ├── event.aggregate.spec.ts       
│       │   ├── event-schedule.vo.spec.ts    
│       │   └── ticket-category.entity.spec.ts  
│       ├── booking/
│       │   ├── booking.aggregate.spec.ts     
│       │   └── quantity.vo.spec.ts          
│       ├── refund/
│       │   ├── refund.aggregate.spec.ts      
│       │   └── refund-eligibility.domain-service.spec.ts  
│       └── ticket/
│           └── ticket.aggregate.spec.ts     
│
├── jest.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Domain Model

### Aggregates & Entities

| Aggregate Root | Child Entities |  
|---|---| 
| `Event` | `TicketCategory` | 
| `Booking` | `Ticket` (via reference) |  
| `Refund` | — |  
| `Ticket` | — |  

### Aggregate Relationships

```
Event (Aggregate Root)
└── TicketCategory (Entity, owned by Event)

Booking (Aggregate Root)
└── references → Event, TicketCategory, Customer
└── produces  → Ticket (after payment)

Refund (Aggregate Root)
└── references → Booking, Ticket
```

---

## Value Objects

### Shared Value Objects

| Value Object | Attributes | Invariants |
|---|---|---|
| `Money` | `amount`, `currency` | `amount >= 0`; currency mismatch throws on arithmetic |

### Event Value Objects

| Value Object | Attributes | Invariants |
|---|---|---|
| `EventId` | `value: UUID` | Auto-generated if not provided |
| `EventName` | `value: string` | Non-empty, max 255 characters |
| `EventSchedule` | `startDate`, `endDate` | `endDate >= startDate` |
| `EventStatus` | `value: enum` | Draft → Published → Completed; Draft → Cancelled |
| `Location` | `address`, `city` | Both fields non-empty |
| `Capacity` | `value: number` | Positive integer > 0 |
| `Quota` | `total`, `remaining` | `total > 0`, `0 <= remaining <= total` |
| `SalesPeriod` | `startDate`, `endDate` | `endDate >= startDate` AND `endDate <= eventStartDate` |
| `TicketCategoryId` | `value: UUID` | Auto-generated if not provided |
| `TicketCategoryName` | `value: string` | Non-empty, max 100 characters |

### Booking Value Objects  

| Value Object | Attributes | Invariants |
|---|---|---|
| `BookingId` | `value: UUID` | Auto-generated |
| `BookingStatus` | `value: enum` | PendingPayment → Paid → Refunded; PendingPayment → Expired |
| `PaymentDeadline` | `value: Date` | Must be 15 min after booking creation |
| `Quantity` | `value: number` | Must be > 0 |

### Ticket Value Objects 

| Value Object | Attributes | Invariants |
|---|---|---|
| `TicketId` | `value: UUID` | Auto-generated |
| `TicketCode` | `value: string` | Unique, generated after payment |
| `TicketStatus` | `value: enum` | Active → CheckedIn; Active → Cancelled |

### Refund Value Objects  

| Value Object | Attributes | Invariants |
|---|---|---|
| `RefundId` | `value: UUID` | Auto-generated |
| `RefundStatus` | `value: enum` | Requested → Approved → PaidOut; Requested → Rejected |
| `RejectionReason` | `value: string` | Non-empty when rejecting |
| `PaymentReference` | `value: string` | Recorded when paid out |

---

## Implemented User Stories

| # | User Story |  
|---|---| 
| US 1 | Create Event |  
| US 2 | Publish Event |  
| US 3 | Cancel Event |  
| US 4 | Create Ticket Category |  
| US 5 | Disable Ticket Category |  
| US 6 | View Available Events |  
| US 7 | View Event Details |  
| US 8 | Create Ticket Booking | 
| US 9 | Calculate Booking Total Price | 
| US 10 | Pay Booking |  
| US 11 | Expire Booking |  
| US 12 | View Purchased Tickets |  
| US 13 | Check In Ticket |  
| US 14 | Reject Invalid Ticket Check-in |  
| US 15 | Request Refund |  
| US 16 | Approve Refund |  
| US 17 | Reject Refund |  
| US 18 | Mark Refund as Paid Out |  
| US 19 | View Event Sales Report |  
| US 20 | View Event Participants |  

---

## Implemented Domain Events

| Domain Event | Raised When |  
|---|---|
| `EventCreated` | A new event is successfully created |  
| `EventPublished` | An event transitions from Draft to Published | 
| `EventCancelled` | A Published event is cancelled |  
| `TicketCategoryCreated` | A ticket category is added to an event |  
| `TicketCategoryDisabled` | A ticket category is deactivated |  
| `TicketReserved` | A booking is created (quota reserved) | 
| `BookingPaid` | A booking payment is confirmed |  
| `BookingExpired` | A booking passes its payment deadline unpaid |  
| `TicketCheckedIn` | A ticket is scanned and validated at entry |  
| `RefundRequested` | A customer submits a refund request | 
| `RefundApproved` | An organizer approves a refund request |  
| `RefundRejected` | An organizer rejects a refund request |  
| `RefundPaidOut` | Admin marks a refund as disbursed |  

---

## Implemented Application Service Interfaces

> To be implemented in Week 11. Interfaces will be declared in `src/application/` and their concrete implementations will live in `src/infrastructure/`.

| Interface | Purpose |
|---|---|
| `IPaymentGateway` | Process booking payments via external payment gateway |
| `IRefundPaymentService` | Disburse refunds via bank/external refund service |
| `INotificationService` | Send email or WhatsApp notifications to customers |

---

## Business Rules

### Event

- An event cannot be created if `endDate` is earlier than `startDate`.
- An event cannot be created if `maxCapacity` is zero or negative.
- A newly created event always has status **Draft**.
- An event can only be published if it has **at least one active** ticket category.
- An event can only be published if the total quota of active categories does **not exceed** `maxCapacity`.
- An event with status **Cancelled** cannot be published.
- An event with status **Completed** cannot be cancelled.
- When an event is cancelled, all paid bookings must be marked as requiring a refund.

### Ticket Category

- Ticket price cannot be negative (enforced by `Money` value object).
- Ticket quota must be greater than zero (enforced by `Quota` value object).
- The `salesEndDate` of a ticket category must be **≤ event startDate**.
- The cumulative quota of all active categories must not exceed the event's `maxCapacity`.
- A disabled ticket category is preserved for historical purposes but cannot accept new bookings.

### Booking

- A booking can only be created for an event with status **Published**.
- A booking can only be created for an **active** ticket category within its sales period.
- Ticket quantity must be greater than zero and must not exceed the remaining quota.
- A customer cannot have more than **one active booking** for the same event.
- A newly created booking has status **PendingPayment** with a deadline of 15 minutes.
- A booking can only be paid if it is **PendingPayment** and the deadline has not passed.
- Payment amount must exactly equal the total booking price.
- A **Paid** booking cannot be expired.
- When a booking expires, its reserved quota is released.

### Refund

- A refund can only be requested for a **Paid** booking.
- A refund cannot be requested if any ticket has already been **CheckedIn**.
- A refund can only be approved or rejected when in **Requested** status.
- A rejection must include a reason.
- When approved: related tickets → **Cancelled**, booking → **Refunded**.
- A refund can only be marked **PaidOut** if it is **Approved**.
- A PaidOut refund is terminal — no further state transitions allowed.

---

## Ubiquitous Language Glossary

| Term | Meaning |
|---|---|
| **Event** | An activity organized by an Event Organizer and attended by Customers. |
| **Event Organizer** | A user who creates, manages, and publishes events. |
| **Customer** | A user who browses events, creates bookings, and purchases tickets. |
| **Gate Officer** | A user who validates tickets during event check-in. |
| **System Admin** | A user who manages refund payouts and monitors system operations. |
| **Ticket Category** | A type of ticket for an event, such as Regular, VIP, or Early Bird. |
| **Quota** | The maximum number of tickets available in a ticket category. |
| **Remaining Quota** | The number of tickets still available for purchase. |
| **Booking** | A temporary reservation created before payment is completed. |
| **PendingPayment** | Booking status: payment has not yet been completed. |
| **Paid** | Booking status: payment has been successfully processed. |
| **Expired** | Booking status: payment deadline passed without payment. |
| **Refunded** | Booking status: a refund has been approved for this booking. |
| **Ticket** | Proof of attendance generated after a booking is paid. |
| **Ticket Code** | A unique code used to identify and validate a ticket at check-in. |
| **Check-in** | The process of validating a ticket when a participant enters the event venue. |
| **Refund** | The process of returning money to a customer. |
| **Money** | A value object representing a monetary amount with amount and currency. |
| **Sales Period** | The time window during which a ticket category can be purchased. |
| **Payment Deadline** | The deadline by which a booking must be paid before it expires (15 minutes). |
| **Draft** | Event status: created but not yet published. |
| **Published** | Event status: visible to customers and open for ticket purchase. |
| **Cancelled** | Event status: event will not take place; all sales are stopped. |
| **Completed** | Event status: event has concluded. |
| **Active** | Ticket status: valid and not yet used for check-in. |
| **CheckedIn** | Ticket status: ticket holder has entered the event. |
| **Requested** | Refund status: submitted and awaiting review. |
| **Approved** | Refund status: accepted by the organizer. |
| **Rejected** | Refund status: denied by the organizer. |
| **PaidOut** | Refund status: money has been disbursed to the customer. |
| **Domain Event** | A record of something significant that happened in the domain. |
| **Aggregate** | A cluster of domain objects treated as a single unit for data changes. |
| **Value Object** | An immutable object identified by its attributes, not by an ID. |
| **Repository** | An abstraction for storing and retrieving aggregates. |
