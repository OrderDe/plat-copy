import {
  locationLabel,
  locationDisabled,
  locationRemainForRow,
  locationReservedNum,
} from '@/views/warehouse/components/locationCapacity';

const location = { id: 7, code: 'A-01-01', remainNum: 100, capacity: 100 };

describe('warehouse location capacity', () => {
  it('subtracts other inbound rows but excludes the current row', () => {
    const first = { locationId: 7, actualInboundNum: 60 };
    const second = { locationId: 7, actualInboundNum: 30 };
    const items = [first, second];

    expect(locationReservedNum(items, 7, second)).toBe(60);
    expect(locationRemainForRow(location, items, second)).toBe(40);
    expect(locationRemainForRow(location, items, first)).toBe(70);
  });

  it('falls back to planned quantity when actual quantity is absent', () => {
    const items = [{ locationId: 7, actualInboundNum: null, inboundTotalNum: 25 }];

    expect(locationReservedNum(items, 7)).toBe(25);
    expect(locationLabel(location, locationRemainForRow(location, items))).toContain('剩余 75/100');
  });

  it('disables a location when other rows consume all capacity', () => {
    const current = { locationId: null, actualInboundNum: 10 };
    const items = [{ locationId: 7, actualInboundNum: 100 }, current];
    const remain = locationRemainForRow(location, items, current);

    expect(remain).toBe(0);
    expect(locationDisabled(location, current.locationId, remain)).toBe(true);
  });

  it('keeps the current location selectable while editing', () => {
    expect(locationDisabled(location, location.id, 0)).toBe(false);
  });

  it('matches location ids when the API and form use different primitive types', () => {
    const first = { locationId: '7', actualInboundNum: 19 };
    const second = { locationId: 7, actualInboundNum: 1 };
    const items = [first, second];

    expect(locationReservedNum(items, location.id, second)).toBe(19);
    expect(locationRemainForRow(location, items, second)).toBe(81);
    expect(locationDisabled(location, '7', 0)).toBe(false);
  });
});
