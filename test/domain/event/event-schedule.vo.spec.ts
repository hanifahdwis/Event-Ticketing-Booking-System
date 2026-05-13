import { EventSchedule } from '../../../src/domain/event/value-objects/event-schedule.vo';

const dayAfter = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

describe('EventSchedule', () => {
  const baseStart = new Date('2025-08-01T09:00:00');
  const baseEnd = new Date('2025-08-02T18:00:00');

  it('should create a valid schedule when end date is after start date', () => {
    const schedule = new EventSchedule(baseStart, baseEnd);
    expect(schedule.startDate).toEqual(baseStart);
    expect(schedule.endDate).toEqual(baseEnd);
  });

  it('should create a valid schedule when start date equals end date', () => {
    const schedule = new EventSchedule(baseStart, baseStart);
    expect(schedule.startDate).toEqual(schedule.endDate);
  });

  it('should throw when end date is earlier than start date', () => {
    expect(() => new EventSchedule(baseEnd, baseStart)).toThrow(
      'End date cannot be earlier than start date',
    );
  });

  it('should return true for isOnEventDay when date is within range', () => {
    const schedule = new EventSchedule(baseStart, baseEnd);
    expect(schedule.isOnEventDay(baseStart)).toBe(true);
    expect(schedule.isOnEventDay(baseEnd)).toBe(true);
  });

  it('should return false for isOnEventDay when date is outside range', () => {
    const schedule = new EventSchedule(baseStart, baseEnd);
    const before = dayAfter(baseStart, -1);
    const after = dayAfter(baseEnd, 1);
    expect(schedule.isOnEventDay(before)).toBe(false);
    expect(schedule.isOnEventDay(after)).toBe(false);
  });

  it('should return true for equals when schedules are identical', () => {
    const a = new EventSchedule(baseStart, baseEnd);
    const b = new EventSchedule(new Date(baseStart), new Date(baseEnd));
    expect(a.equals(b)).toBe(true);
  });

  it('should return false for equals when schedules differ', () => {
    const a = new EventSchedule(baseStart, baseEnd);
    const b = new EventSchedule(baseStart, dayAfter(baseEnd, 1));
    expect(a.equals(b)).toBe(false);
  });
});