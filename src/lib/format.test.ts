import { formatClock, formatDuration, formatVolume, formatWeight, parseNumber } from './format';

describe('parseNumber', () => {
  it('accepts decimals with a dot or comma', () => {
    expect(parseNumber('102.5')).toBe(102.5);
    expect(parseNumber('102,5')).toBe(102.5);
    expect(parseNumber('100.')).toBe(100);
  });
  it('returns null for empty, invalid or negative input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('.')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('-5')).toBeNull();
  });
});

describe('formatWeight', () => {
  it('trims trailing zeros and converts units', () => {
    expect(formatWeight(100, 'kg')).toBe('100');
    expect(formatWeight(102.5, 'kg')).toBe('102.5');
    expect(formatWeight(61.2349, 'lb')).toBe('135');
    expect(formatWeight(null, 'kg')).toBe('');
  });
});

describe('clock and duration', () => {
  it('formats seconds as m:ss or h:mm:ss', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-3)).toBe('0:00');
  });
  it('formats workout length', () => {
    expect(formatDuration('2026-11-26T10:00:00Z', '2026-11-26T10:42:00Z')).toBe('42m');
    expect(formatDuration('2026-11-26T10:00:00Z', '2026-11-26T11:05:00Z')).toBe('1h 05m');
  });
});

describe('formatVolume', () => {
  it('rounds and adds separators', () => {
    expect(formatVolume(1031.9, 'kg')).toBe('1,032 kg');
  });
});
