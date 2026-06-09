export interface IBookingRef {
  id: string;
  status: string;
}

export interface ITicketRef {
  status: string;
}

export interface IEventRef {
  status: string;
  startDate: Date;
}

export class RefundEligibilityDomainService {
  public isEligible(
    booking: IBookingRef,
    tickets: ITicketRef[],
    event: IEventRef,
    currentDate: Date,
  ): boolean {
    if (booking.status !== 'Paid') {
      return false;
    }

    const hasCheckedInTicket = tickets.some(
      (ticket) => ticket.status === 'CheckedIn',
    );
    if (hasCheckedInTicket) {
      return false;
    }

    if (event.status === 'Cancelled') {
      return true;
    }

    if (currentDate >= event.startDate) {
      return false;
    }

    return true;
  }
}