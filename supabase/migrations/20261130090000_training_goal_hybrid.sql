-- Strength & hypertrophy hybrid goal for programs that mix heavy and higher-rep work.
-- Separate migration: a new enum value can't be used in the transaction that adds it.
alter type public.training_goal add value if not exists 'hybrid';
