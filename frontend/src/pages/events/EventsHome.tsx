import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  GraduationCap,
  Trophy,
  Users,
  ArrowRight,
  Music,
  MapPin,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
type EventStatus = 'Flagship Event' | 'Completed' | 'Coming Soon' | 'Ongoing';

interface EventTile {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  link: string;
  icon: React.ElementType;
  /** Event start date — undefined means TBD */
  startDate?: Date;
  /** Event end date — past this the event is auto-marked Completed */
  endDate?: Date;
  location: string;
  gradient: string;
  featured?: boolean;
}

// ── Helpers ──────────────────────────────────

function resolveStatus(event: EventTile): EventStatus {
  if (event.featured) return 'Flagship Event';
  if (!event.endDate) return 'Coming Soon'; // no date set yet
  const now = new Date();
  if (now > event.endDate) return 'Completed';
  if (event.startDate && now >= event.startDate) return 'Ongoing';
  return 'Coming Soon';
}

const STATUS_STYLES: Record<EventStatus, string> = {
  'Flagship Event': 'bg-nsut-yellow text-nsut-maroon',
  Completed: 'bg-green-100 text-green-800',
  'Coming Soon': 'bg-amber-100 text-amber-800',
  Ongoing: 'bg-blue-100 text-blue-800',
};

function formatDateRange(start?: Date, end?: Date): string {
  if (!start && !end) return 'TBD';
  const fmtFull = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDay = (d: Date) => d.getDate();
  if (start && end) {
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      if (start.getDate() === end.getDate()) return fmtFull(start);
      return `${fmtDay(start)}–${fmtDay(end)} ${
        start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      }`;
    }
    return `${fmtFull(start)} – ${fmtFull(end)}`;
  }
  return fmtFull((start ?? end)!);
}

// ── Event data ───────────────────────────────
// To change an event's status just update startDate / endDate.
// If today > endDate  → Completed
// If startDate ≤ today ≤ endDate → Ongoing
// If today < startDate (or no date) → Coming Soon

const eventTiles: EventTile[] = [
  {
    id: 1,
    title: 'Convocation 2025',
    subtitle: 'Third Convocation Ceremony',
    description:
      'A landmark moment in NSUT history — over 2,450 graduates were honoured at Yashobhoomi Convention Centre. Relive the ceremony, browse highlights, and connect with the Class of 2025.',
    link: '/communities/recent-grads',
    icon: GraduationCap,
    startDate: new Date(2025, 1, 19), // 19 Feb 2025
    endDate: new Date(2025, 1, 19),
    location: 'Yashobhoomi, Dwarka',
    gradient: 'from-[#800000] via-[#A00000] to-[#C00404]',
    featured: true,
  },
  {
    id: 2,
    title: 'Annual NSUT Sports Meet',
    subtitle: 'Annual Sports Tournament',
    description:
      'Cricket, football, badminton and more — compete and cheer at the annual NSUT sports day.',
    link: '#',
    icon: Trophy,
    startDate: new Date(2026, 2, 13), // 13 Mar 2026
    endDate: new Date(2026, 2, 14),   // 14 Mar 2026
    location: 'NSUT Campus',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
  },
  {
    id: 4,
    title: 'Alumni Meet 2025',
    subtitle: 'Batch Homecoming',
    description:
      'Relive old memories, celebrate milestones, and strengthen the bonds of your batch with fellow NSUTians from around the world.',
    link: '#',
    icon: Users,
    startDate: new Date(2025, 11, 14), // 14 Dec 2025
    endDate: new Date(2025, 11, 15),   // 15 Dec 2025
    location: 'NSUT Campus',
    gradient: 'from-green-600 via-green-700 to-green-800',
  },
];

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// ─────────────────────────────────────────────
// Featured Event Card
// ─────────────────────────────────────────────
const FeaturedCard = ({ event }: { event: EventTile }) => {
  const Icon = event.icon;
  const isPlaceholder = event.link === '#';
  const status = resolveStatus(event);
  const tagColor = STATUS_STYLES[status];
  const displayDate = formatDateRange(event.startDate, event.endDate);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={isPlaceholder ? {} : { y: -6 }}
      className="col-span-1 md:col-span-2 lg:col-span-3"
    >
      <Link
        to={event.link}
        className={`group relative flex flex-col md:flex-row overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-500 min-h-[340px] ${isPlaceholder ? 'pointer-events-none cursor-default' : ''}`}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        {/* Gold pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Large icon accent */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center justify-center w-56 h-56 rounded-full bg-white/5 border border-white/10">
          <Icon className="w-28 h-28 text-white/20" strokeWidth={1} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 md:p-12 flex-1">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${tagColor} shadow-sm`}>
              {status}
            </span>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {displayDate}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            </div>
          </div>

          {/* Center text */}
          <div className="mt-6 md:mt-10 max-w-xl">
            <div className="flex items-center gap-3 mb-1">
              <Icon className="w-6 h-6 text-nsut-yellow md:hidden" />
              <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                {event.subtitle}
              </p>
            </div>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              {event.title}
            </h3>
            <p className="text-white/85 text-base md:text-lg leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* CTA */}
          {!isPlaceholder && (
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 bg-white text-nsut-maroon font-semibold px-6 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:bg-nsut-yellow transition-all duration-300 text-sm">
                Explore Event
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Regular Event Card
// ─────────────────────────────────────────────
const EventCard = ({ event }: { event: EventTile }) => {
  const Icon = event.icon;
  const isPlaceholder = event.link === '#';
  const status = resolveStatus(event);
  const tagColor = STATUS_STYLES[status];
  const displayDate = formatDateRange(event.startDate, event.endDate);

  return (
    <motion.div variants={cardVariants} whileHover={isPlaceholder ? {} : { y: -6 }} className="h-full">
      <Link
        to={event.link}
        className={`group relative flex flex-col overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 h-[300px] ${isPlaceholder ? 'pointer-events-none cursor-default opacity-80' : ''}`}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-black/10 rounded-full" />

        {/* Content — three fixed zones: top / middle / bottom */}
        <div className="relative z-10 flex flex-col h-full p-7">

          {/* ── TOP: tag + icon, then subtitle + title ── */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tagColor}`}>
                {status}
              </span>
              <Icon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
            </div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
              {event.subtitle}
            </p>
            <h3 className="text-2xl font-serif font-bold text-white leading-snug line-clamp-2">
              {event.title}
            </h3>
          </div>

          {/* ── MIDDLE: description fills remaining space ── */}
          <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mt-3 flex-1">
            {event.description}
          </p>

          {/* ── BOTTOM: date + location ── */}
          <div className="flex items-center justify-between pt-4 border-t border-white/15 mt-auto">
            <div className="flex items-center gap-3 text-white/60 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                {displayDate}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {event.location}
              </span>
            </div>
            {!isPlaceholder && (
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Section Heading
// ─────────────────────────────────────────────
interface SectionHeadingProps {
  label: string;
  title: string;
  accent: 'green' | 'maroon';
}

const SectionHeading = ({ label, title, accent }: SectionHeadingProps) => {
  const lineColor =
    accent === 'green'
      ? 'via-green-200'
      : 'via-nsut-maroon/20';
  const labelColor =
    accent === 'green'
      ? 'text-green-700 bg-green-50 border-green-200'
      : 'text-nsut-maroon bg-red-50 border-nsut-maroon/20';
  const dotColor =
    accent === 'green' ? 'bg-green-500' : 'bg-nsut-maroon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${lineColor} to-transparent`} />
        <span className={`text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${labelColor}`}>
          {label}
        </span>
        <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${lineColor} to-transparent`} />
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 text-center">
          {title}
        </h2>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
    </motion.div>
  );
};

const EventsHome = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const featured = eventTiles.find((e) => e.featured)!;
  const completed = eventTiles.filter(
    (e) => !e.featured && (resolveStatus(e) === 'Completed'),
  );
  const comingSoon = eventTiles.filter(
    (e) => !e.featured && (resolveStatus(e) === 'Coming Soon' || resolveStatus(e) === 'Ongoing'),
  );

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#5A0000] via-nsut-maroon to-[#8A0000]"
      >
        {/* Parallax background pattern */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M50 50v-6h-2v6h-6v2h6v6h2v-6h6v-2h-6zm0-40V4h-2v6h-6v2h6v6h2v-6h6V4h-6zM10 50v-6H8v6H2v2h6v6h2v-6h6v-2h-6zM10 10V4H8v6H2v2h6v6h2v-6h6V4h-6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nsut-yellow/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span className="inline-block bg-nsut-yellow/20 border border-nsut-yellow/40 text-nsut-yellow text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
              NSUT Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-4 drop-shadow-lg"
          >
            Events & Milestones
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
          >
            Celebrate achievements, engage with the community, and be part of moments that define the NSUT legacy.
          </motion.p>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Event Grid ── */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">All Events</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 text-center mb-3">
              Explore What's Happening
            </h2>
            <p className="text-gray-500 text-center max-w-xl mx-auto">
              From landmark ceremonies to alumni meetups — every event is a chance to reconnect with the NSUT community.
            </p>
          </motion.div>

          {/* ── Featured ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            <FeaturedCard event={featured} />
          </motion.div>

          {/* ── Completed Events ── */}
          {completed.length > 0 && (
            <div className="mb-16">
              <SectionHeading
                label="Past"
                title="Completed Events"
                accent="green"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {completed.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            </div>
          )}

          {/* ── Coming Soon ── */}
          {comingSoon.length > 0 && (
            <div className="mb-4">
              <SectionHeading
                label="Upcoming"
                title="Coming Soon"
                accent="maroon"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {comingSoon.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Coming soon note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-gray-400 text-sm mt-12"
          >
            More events are being planned — stay tuned for updates.
          </motion.p>
        </div>
      </section>
    </main>
  );
};

export default EventsHome;
