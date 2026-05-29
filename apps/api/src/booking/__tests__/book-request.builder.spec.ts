import { contactFromSession, MuadiPassenger } from '../book-request.builder';

describe('contactFromSession', () => {
  it('normalizes E.164 Vietnam phone to local Muadi format', () => {
    expect(
      contactFromSession(
        {
          phone: '+84903271845',
          email: 'guest@example.com',
        },
        passenger(),
      ).phoneNumber,
    ).toBe('0903271845');
  });

  it('keeps local Vietnam phone unchanged', () => {
    expect(
      contactFromSession(
        {
          phone: '0903271845',
          email: 'guest@example.com',
        },
        passenger(),
      ).phoneNumber,
    ).toBe('0903271845');
  });
});

function passenger(): MuadiPassenger {
  return {
    id: 'ADT-1',
    type: 'ADT',
    title: 'MR',
    firstName: 'ANH',
    lastName: 'VU',
    loyalty: [],
    goldCard: '',
    listLuggage: [],
    ancillaryServices: [],
  };
}
