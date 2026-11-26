import { displayToKg, estimateOneRepMax, kgToDisplay, roundToIncrement, totalVolume } from './fitness';

describe('unit conversion', () => {
  it('round-trips kg and lb', () => {
    expect(kgToDisplay(100, 'lb')).toBeCloseTo(220.46, 2);
    expect(displayToKg(220.46226218, 'lb')).toBeCloseTo(100, 6);
    expect(kgToDisplay(80, 'kg')).toBe(80);
  });

  it('rounds to plate increments', () => {
    expect(roundToIncrement(101.3, 'kg')).toBe(102.5);
    expect(roundToIncrement(223, 'lb')).toBe(225);
  });
});

describe('estimateOneRepMax', () => {
  it('uses Epley for 2-12 reps', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2);
    expect(estimateOneRepMax(60, 10)).toBeCloseTo(80, 6);
  });

  it('returns the weight for a single', () => {
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });

  it('rejects unreliable or invalid input', () => {
    expect(estimateOneRepMax(50, 15)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(100, 2.5)).toBeNull();
  });
});

describe('totalVolume', () => {
  it('sums working sets and skips warm-ups', () => {
    expect(
      totalVolume([
        { weight: 60, reps: 10, isWarmup: true },
        { weight: 100, reps: 5 },
        { weight: 100, reps: 5 },
      ]),
    ).toBe(1000);
  });
});
