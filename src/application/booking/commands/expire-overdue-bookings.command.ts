export class ExpireOverdueBookingsCommand {
  constructor(
    public readonly at: Date = new Date(),
  ) {}
}

