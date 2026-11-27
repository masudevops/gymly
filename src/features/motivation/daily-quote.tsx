import { useState } from 'react';

import { AppText } from '@/components/ui';
import { cn } from '@/lib/cn';

import { quoteOfTheDay, type QuoteContext } from './quotes';

/** One quiet line of encouragement. The date is read once so the quote can't change mid-visit. */
export function DailyQuote({ context, className }: { context: QuoteContext; className?: string }) {
  const [today] = useState(() => new Date());
  return <AppText variant="label" className={cn('font-sans italic', className)}>{quoteOfTheDay(context, today)}</AppText>;
}
