import { formatMoney, formatNumber, getInitials, toMinorUnits } from './format';

describe('formatMoney', () => {
  it('formats INR paise with Indian grouping', () => {
    expect(formatMoney(12345678)).toBe('₹1,23,456.78');
  });

  it('keeps the sign', () => {
    expect(formatMoney(-50)).toBe('-₹0.50');
  });

  it('formats a zero-decimal currency from whole units', () => {
    expect(formatMoney(1234, 'JPY')).toBe('JP¥1,234');
  });

  it('formats a three-decimal currency', () => {
    expect(formatMoney(1234, 'KWD')).toBe('KWD\u00a01.234');
  });

  it.each([null, undefined])('renders %o as a dash', (value) => {
    expect(formatMoney(value)).toBe('-');
  });
});

describe('toMinorUnits', () => {
  it('converts INR to paise', () => {
    expect(toMinorUnits(1234.56)).toBe(123456);
  });

  it('rounds without float drift', () => {
    expect(toMinorUnits(1.005)).toBe(101);
    expect(toMinorUnits(0.29)).toBe(29);
  });

  it('leaves a zero-decimal currency as is', () => {
    expect(toMinorUnits(1234, 'JPY')).toBe(1234);
  });

  it('rounds negative halves away from zero', () => {
    expect(toMinorUnits(-1.005)).toBe(-101);
  });

  it('never returns negative zero', () => {
    expect(toMinorUnits(-0.001)).toBe(0);
  });

  it('uses three places for KWD', () => {
    expect(toMinorUnits(1.2345, 'KWD')).toBe(1235);
    expect(toMinorUnits(-1.2345, 'KWD')).toBe(-1235);
  });

  it('handles values already in exponent form', () => {
    expect(toMinorUnits(1e-7)).toBe(0);
    expect(toMinorUnits(1e21)).toBe(1e23);
  });

  it('round-trips through formatMoney', () => {
    expect(formatMoney(toMinorUnits(99.99))).toBe('₹99.99');
    expect(formatMoney(toMinorUnits(500, 'JPY'), 'JPY')).toBe('JP¥500');
  });
});

describe('formatNumber', () => {
  it('uses Indian grouping', () => {
    expect(formatNumber(1234567)).toBe('12,34,567');
  });

  it('passes options through', () => {
    expect(formatNumber(0.256, { style: 'percent' })).toBe('26%');
  });

  it.each([null, undefined])('renders %o as a dash', (value) => {
    expect(formatNumber(value)).toBe('-');
  });
});

describe('getInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['Ada King Lovelace', 'AL'],
    ['ada', 'A'],
    ['  ada   lovelace  ', 'AL'],
    ['Élodie Ünal', 'ÉÜ'],
  ])('%s is %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it.each([null, undefined, '', '   '])('is empty for %o', (name) => {
    expect(getInitials(name)).toBe('');
  });
});
