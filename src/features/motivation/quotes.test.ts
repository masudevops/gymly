import { quoteOfTheDay, quotes, type QuoteContext } from './quotes';

const contexts = Object.keys(quotes) as QuoteContext[];

describe('quoteOfTheDay', () => {
  it('stays the same all day', () => {
    const morning = new Date(2026, 10, 26, 0, 5);
    const night = new Date(2026, 10, 26, 23, 55);
    for (const c of contexts) expect(quoteOfTheDay(c, morning)).toBe(quoteOfTheDay(c, night));
  });

  it('rotates to the next quote at local midnight', () => {
    const today = new Date(2026, 10, 26, 12);
    const tomorrow = new Date(2026, 10, 27, 12);
    for (const c of contexts) {
      const list = quotes[c];
      const i = list.indexOf(quoteOfTheDay(c, today));
      expect(quoteOfTheDay(c, tomorrow)).toBe(list[(i + 1) % list.length]);
    }
  });

  it('cycles through every quote', () => {
    for (const c of contexts) {
      const seen = new Set(Array.from({ length: quotes[c].length }, (_, n) => quoteOfTheDay(c, new Date(2026, 0, 1 + n))));
      expect(seen.size).toBe(quotes[c].length);
    }
  });

  it('keeps every quote short', () => {
    for (const c of contexts) for (const q of quotes[c]) expect(q.length).toBeLessThanOrEqual(60);
  });
});
