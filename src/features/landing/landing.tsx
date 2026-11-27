import { Link, router } from 'expo-router';
import { CalendarRange, ChartLine, Dumbbell, Flame, Timer, type LucideIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { AppText, Button } from '@/components/ui';
import { DailyQuote } from '@/features/motivation/daily-quote';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

import { LoggerPreview, PhoneFrame, ProgramPreview, ProgressPreview } from './previews';

/** Same breakpoint as the app's sidebar layout. */
const DESKTOP_MIN_WIDTH = 1024;
const FEEDBACK_URL = 'https://github.com/masudevops/gymly/issues';
const YEAR = new Date().getFullYear();

const SUBHEAD = 'Your workouts. Your progress. Your journey. All in one place.';

// Only features that exist in the app today.
const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Dumbbell, title: 'Track your workouts', body: 'Log exercises, sets, reps and weights effortlessly.' },
  { icon: CalendarRange, title: 'Follow training programs', body: 'Stay organized with structured multi-week plans.' },
  { icon: ChartLine, title: 'Visualize your progress', body: 'Personal records, volume and body weight over time.' },
  { icon: Flame, title: 'Stay consistent', body: 'Weekly goals and streaks build the habit, one workout at a time.' },
  { icon: Timer, title: 'Train with focus', body: 'Built-in rest timer keeps every session on track.' },
];

const SLIDES = [
  { title: 'Log every set', body: 'Weights, reps and a rest timer, built for one hand mid-set.', preview: <LoggerPreview /> },
  { title: 'Track your progress', body: 'See your volume, records and streaks grow over time.', preview: <ProgressPreview /> },
  { title: 'Follow a program', body: 'Stay structured with multi-week plans that fit your schedule.', preview: <ProgramPreview /> },
];

const getStarted = () => router.push('/sign-up');
const signIn = () => router.push('/sign-in');

// Reanimated's Animated.View isn't styled by NativeWind out of the box.
cssInterop(Animated.View, { className: 'style' });

/** Fade-up on first paint; skipped when the OS asks for reduced motion. */
function Reveal({ delay = 0, children, className }: { delay?: number; children: ReactNode; className?: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).reduceMotion(ReduceMotion.System)} className={className}>
      {children}
    </Animated.View>
  );
}

export function Landing() {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_MIN_WIDTH ? <DesktopLanding /> : <MobileLanding />;
}

// ---------- Mobile: a native-feeling welcome screen, then the rest of the story below the fold ----------

function useAboutScroll() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const aboutY = useRef(0);
  return {
    scrollRef,
    onAboutLayout: (y: number) => { aboutY.current = y; },
    showAbout: () => scrollRef.current?.scrollTo({ y: aboutY.current, animated: true }),
  };
}

function MobileLanding() {
  const { height } = useWindowDimensions();
  const { scrollRef, onAboutLayout, showAbout } = useAboutScroll();
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-ink">
      <ScrollView ref={scrollRef} contentContainerClassName="grow">
        <View className="w-full max-w-xl self-center px-5" style={{ minHeight: height - 24 }}>
          <Reveal className="mt-6 flex-row items-center gap-2.5">
            <BrandMark size={36} />
            <AppText variant="title">Gymly</AppText>
          </Reveal>

          <Reveal delay={80} className="mt-8 gap-3">
            <Headline className="text-[40px] leading-[44px]" />
            <AppText variant="body" className="text-muted">{SUBHEAD}</AppText>
          </Reveal>

          <Reveal delay={160} className="my-8 flex-1 justify-center">
            <Carousel />
          </Reveal>

          <Reveal delay={240} className="gap-4 pb-6">
            <Button title="Get Started" onPress={getStarted} />
            <View className="flex-row justify-center gap-1">
              <AppText variant="label">Already have an account?</AppText>
              <Link href="/sign-in">
                <AppText variant="label" className="font-semibold text-volt">Sign in</AppText>
              </Link>
            </View>
          </Reveal>
        </View>

        <View className="w-full max-w-xl self-center px-5 pb-6" onLayout={(e) => onAboutLayout(e.nativeEvent.layout.y)}>
          <AppText variant="title" className="mb-4 mt-6">Everything you need to train</AppText>
          <View className="gap-3">
            {FEATURES.map((f) => <FeatureRow key={f.title} {...f} />)}
          </View>
          <Closing showQuote />
          <Footer onAbout={showAbout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Carousel() {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollViewInstance>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        accessibilityLabel="Gymly features"
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={{ width }} className="gap-4">
            {s.preview}
            <View className="items-center gap-1 px-2">
              <AppText variant="title" className="text-xl">{s.title}</AppText>
              <AppText variant="label" className="text-center">{s.body}</AppText>
            </View>
          </View>
        ))}
      </ScrollView>
      <View accessibilityRole="tablist" className="mt-4 flex-row justify-center">
        {SLIDES.map((s, i) => (
          <Pressable
            key={s.title}
            accessibilityRole="tab"
            aria-selected={i === index}
            accessibilityLabel={`Show ${s.title}`}
            onPress={() => ref.current?.scrollTo({ x: i * width, animated: true })}
            className="h-6 w-6 items-center justify-center"
          >
            <View className={cn('h-2 rounded-full', i === index ? 'w-5 bg-volt' : 'w-2 bg-line')} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FeatureRow({ icon: Icon, title, body }: (typeof FEATURES)[number]) {
  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-line bg-surface p-4">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-volt/10">
        <Icon color={colors.volt} size={22} />
      </View>
      <View className="flex-1">
        <AppText variant="heading" className="text-base">{title}</AppText>
        <AppText variant="label">{body}</AppText>
      </View>
    </View>
  );
}

// ---------- Desktop: header, two-column hero, feature grid ----------

function DesktopLanding() {
  const { scrollRef, onAboutLayout, showAbout } = useAboutScroll();
  return (
    <ScrollView ref={scrollRef} className="flex-1 bg-ink" contentContainerClassName="grow">
      <View className="w-full max-w-6xl self-center px-10">
        <View className="h-20 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <BrandMark size={32} />
            <AppText variant="title" className="text-xl">Gymly</AppText>
          </View>
          <View className="flex-row items-center gap-2">
            <Button title="Sign in" variant="ghost" onPress={signIn} />
            <Button title="Get Started" onPress={getStarted} />
          </View>
        </View>

        <View className="min-h-[640px] flex-row items-center gap-16 py-12">
          <Reveal className="flex-1 gap-6">
            <Headline className="text-[64px] leading-[68px]" />
            <AppText variant="body" className="max-w-md text-lg leading-7 text-muted">{SUBHEAD}</AppText>
            <View className="mt-2 flex-row gap-3">
              <Button title="Get Started" onPress={getStarted} className="px-8" />
              <Button title="Sign in" variant="secondary" onPress={signIn} className="px-8" />
            </View>
            <DailyQuote context="landing" className="mt-2" />
          </Reveal>

          <Reveal delay={120} className="items-center">
            <PhoneFrame>
              <AppText variant="title" className="px-1">Progress</AppText>
              <ProgressPreview />
              <LoggerPreview />
            </PhoneFrame>
          </Reveal>
        </View>

        <View className="py-16" onLayout={(e) => onAboutLayout(e.nativeEvent.layout.y)}>
          <AppText variant="title" className="text-3xl">Everything you need to train</AppText>
          <AppText variant="body" className="mt-2 text-muted">Simple tools, done well. No clutter between you and the next set.</AppText>
          <View className="mt-8 flex-row items-center gap-12">
            <View className="flex-1 gap-3">
              {FEATURES.map((f) => <FeatureRow key={f.title} {...f} />)}
            </View>
            <View className="w-[400px]">
              <ProgramPreview />
            </View>
          </View>
        </View>

        <Closing wide />
        <Footer onAbout={showAbout} />
      </View>
    </ScrollView>
  );
}

// ---------- Shared ----------

function Headline({ className }: { className: string }) {
  return (
    <AppText variant="display" accessibilityRole="header" className={className}>
      Train smarter.{'\n'}
      <AppText variant="display" className={cn(className, 'text-volt')}>Get stronger.</AppText>
    </AppText>
  );
}

function Closing({ wide = false, showQuote = false }: { wide?: boolean; showQuote?: boolean }) {
  return (
    <View className="mt-12 items-center gap-5 rounded-3xl border border-line bg-surface px-6 py-12">
      <BrandMark size={48} />
      <AppText variant="title" className={cn('text-center', wide ? 'text-4xl' : 'text-3xl')}>Your next personal best starts here.</AppText>
      <Button title="Get Started" onPress={getStarted} className={wide ? 'px-10' : 'self-stretch'} />
      {showQuote && <DailyQuote context="landing" className="text-center" />}
    </View>
  );
}

function Footer({ onAbout }: { onAbout: () => void }) {
  return (
    <View className="mt-10 flex-row flex-wrap items-center justify-between gap-4 border-t border-line py-6">
      <AppText variant="caption">© {YEAR} Gymly</AppText>
      <View className="flex-row gap-6">
        <Pressable accessibilityRole="link" onPress={onAbout}>
          <AppText variant="label">About</AppText>
        </Pressable>
        <Link href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
          <AppText variant="label">Feedback</AppText>
        </Link>
      </View>
    </View>
  );
}
