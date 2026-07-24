import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Users,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { BASE_URL } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type EventType = 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar' | 'other';
type StatusFilter = 'all' | 'upcoming' | 'completed';

interface AlumniEvent {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: EventType;
  image_url?: string;
  gallery?: string[];
  recap?: string;
  registration_link?: string;
  max_participants?: number;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  likes: number;
  creator_name: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Category styling — maps the real backend event_type
// values to a color that matches the feeling of that event
// ─────────────────────────────────────────────
interface CategoryStyle {
  label: string;
  badge: string;
  gradient: string;
  dot: string;
}

const CATEGORY_STYLES: Record<EventType, CategoryStyle> = {
  workshop: {
    label: 'Workshop',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
    dot: 'bg-emerald-500',
  },
  seminar: {
    label: 'Seminar',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    gradient: 'from-blue-600 via-blue-700 to-blue-800',
    dot: 'bg-blue-500',
  },
  conference: {
    label: 'Conference',
    badge: 'bg-red-100 text-nsut-maroon border-red-200',
    gradient: 'from-[#800000] via-[#A00000] to-[#C00404]',
    dot: 'bg-nsut-maroon',
  },
  meetup: {
    label: 'Meet',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
    dot: 'bg-amber-500',
  },
  webinar: {
    label: 'Webinar',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    gradient: 'from-purple-600 via-purple-700 to-purple-800',
    dot: 'bg-purple-500',
  },
  other: {
    label: 'Other',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    gradient: 'from-slate-500 via-slate-600 to-slate-700',
    dot: 'bg-slate-500',
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_STYLES) as EventType[];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysLeft(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} days left`;
  return 'In progress';
}

function ensureUrlProtocol(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ─────────────────────────────────────────────
// Event Card
// ─────────────────────────────────────────────
const EventCard = ({
  event,
  isCompleted,
  onOpen,
}: {
  event: AlumniEvent;
  isCompleted: boolean;
  onOpen: () => void;
}) => {
  const cat = CATEGORY_STYLES[event.event_type] || CATEGORY_STYLES.other;

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -6 }} className="h-full">
      <button
        onClick={onOpen}
        className="group text-left w-full flex flex-col overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 bg-white border border-gray-100 h-full"
      >
        {/* Image / gradient fallback */}
        <div className={`relative h-44 shrink-0 overflow-hidden bg-gradient-to-br ${cat.gradient}`}>
          {event.image_url ? (
            <img
              src={`${BASE_URL}${event.image_url}`}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white/30" strokeWidth={1.2} />
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow ${
                isCompleted ? 'bg-white/90 text-gray-700' : 'bg-emerald-500 text-white'
              }`}
            >
              {isCompleted ? 'Completed' : daysLeft(event.event_date)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${cat.badge} bg-white/90`}>
              {cat.label}
            </span>
          </div>

          {isCompleted && (event.gallery?.length ?? 0) > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
              <ImageIcon className="w-3 h-3" />
              {event.gallery!.length} photos
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          <p className="text-xs text-gray-400 mb-1">{formatDate(event.event_date)} · Hosted by {event.creator_name}</p>
          <h3 className="font-serif font-bold text-lg text-gray-900 leading-snug line-clamp-2 mb-2">
            {event.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
            {isCompleted && event.recap ? event.recap : event.description}
          </p>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-2">
              <Heart className="w-3.5 h-3.5" />
              {event.likes}
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Card skeleton (loading state)
// ─────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Event Detail Modal
// ─────────────────────────────────────────────
const EventDetailModal = ({
  event,
  isCompleted,
  onClose,
}: {
  event: AlumniEvent;
  isCompleted: boolean;
  onClose: () => void;
}) => {
  const cat = CATEGORY_STYLES[event.event_type] || CATEGORY_STYLES.other;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const gallery = event.gallery || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
      >
        {/* Header image */}
        <div className={`relative h-64 overflow-hidden bg-gradient-to-br ${cat.gradient}`}>
          {event.image_url ? (
            <img src={`${BASE_URL}${event.image_url}`} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-white/30" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${cat.badge} bg-white/95`}>
                {cat.label}
              </span>
              <span className="text-xs font-medium text-white/90 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">{event.title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Recap (completed events) */}
          {isCompleted && event.recap && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Recap & Highlights</p>
              <p className="text-gray-700 leading-relaxed">{event.recap}</p>
            </div>
          )}

          {/* Description (always shown) */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              {isCompleted ? 'About the Event' : 'Description'}
            </p>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-nsut-maroon">{event.likes}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Likes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-nsut-maroon">{gallery.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Photos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-nsut-maroon">
                {event.max_participants ? event.max_participants : '∞'}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {event.max_participants ? 'Max Seats' : 'Open Entry'}
              </p>
            </div>
          </div>

          {/* Date / time / host */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2 text-gray-700">
              <Calendar className="w-4 h-4 mt-0.5 text-nsut-maroon shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="font-medium">{formatDate(event.event_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <Clock className="w-4 h-4 mt-0.5 text-nsut-maroon shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="font-medium">{event.event_time}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-gray-700 col-span-2">
              <Users className="w-4 h-4 mt-0.5 text-nsut-maroon shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Hosted by</p>
                <p className="font-medium">{event.creator_name}</p>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Captures from the day (click to view)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setLightboxIndex(idx)}
                    className="rounded-lg overflow-hidden h-20 hover:opacity-80 transition-opacity"
                  >
                    <img src={`${BASE_URL}${url}`} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming-only: contact + registration */}
          {!isCompleted && (
            <>
              {(event.contact_info?.email || event.contact_info?.phone || event.contact_info?.website) && (
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Contact</p>
                  {event.contact_info?.email && (
                    <a href={`mailto:${event.contact_info.email}`} className="flex items-center gap-2 text-gray-700 hover:text-nsut-maroon">
                      <Mail className="w-4 h-4" /> {event.contact_info.email}
                    </a>
                  )}
                  {event.contact_info?.phone && (
                    <a href={`tel:${event.contact_info.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-nsut-maroon">
                      <Phone className="w-4 h-4" /> {event.contact_info.phone}
                    </a>
                  )}
                  {event.contact_info?.website && (
                    <a
                      href={ensureUrlProtocol(event.contact_info.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-700 hover:text-nsut-maroon"
                    >
                      <Globe className="w-4 h-4" /> {event.contact_info.website}
                    </a>
                  )}
                </div>
              )}

              {event.registration_link && (
                <a href={ensureUrlProtocol(event.registration_link)} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="w-full flex items-center justify-center gap-2 bg-nsut-maroon hover:bg-[#a00303] text-white font-semibold py-3 rounded-xl transition-colors">
                    Register for this Event
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              )}
            </>
          )}

          {isCompleted && !event.registration_link && (
            <div className="border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
              This event has concluded — stay tuned for the next one.
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white"
            >
              <X className="w-7 h-7" />
            </button>
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? i - 1 : i));
                }}
                className="absolute left-4 md:left-8 text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {lightboxIndex < gallery.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i !== null ? i + 1 : i));
                }}
                className="absolute right-4 md:right-8 text-white/80 hover:text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <img
              src={`${BASE_URL}${gallery[lightboxIndex]}`}
              alt={`Gallery ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const EventsHome = () => {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [upcoming, setUpcoming] = useState<AlumniEvent[]>([]);
  const [completed, setCompleted] = useState<AlumniEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<EventType | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<AlumniEvent | null>(null);
  const [selectedIsCompleted, setSelectedIsCompleted] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [upcomingRes, completedRes] = await Promise.all([
          api.get('/events/approved?limit=50&time_frame=upcoming'),
          api.get('/events/approved?limit=50&time_frame=past'),
        ]);
        if (upcomingRes.data.success) setUpcoming(upcomingRes.data.data);
        if (completedRes.data.success) setCompleted(completedRes.data.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalLikes = useMemo(
    () => [...upcoming, ...completed].reduce((sum, e) => sum + (e.likes || 0), 0),
    [upcoming, completed]
  );

  const matchesSearch = (event: AlumniEvent) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q) ||
      event.creator_name.toLowerCase().includes(q)
    );
  };

  const matchesCategory = (event: AlumniEvent) => categoryFilter === 'all' || event.event_type === categoryFilter;

  const filteredUpcoming = useMemo(
    () => upcoming.filter((e) => matchesSearch(e) && matchesCategory(e)),
    [upcoming, searchTerm, categoryFilter]
  );
  const filteredCompleted = useMemo(
    () => completed.filter((e) => matchesSearch(e) && matchesCategory(e)),
    [completed, searchTerm, categoryFilter]
  );

  const showUpcoming = statusFilter === 'all' || statusFilter === 'upcoming';
  const showCompleted = statusFilter === 'all' || statusFilter === 'completed';

  const hostEventLink = user?.role === 'alumni' ? '/dashboard/host-event' : '/login';

  const categoryCounts = useMemo(() => {
    const pool = [...upcoming, ...completed];
    const counts: Record<string, number> = { all: pool.length };
    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = pool.filter((e) => e.event_type === cat).length;
    });
    return counts;
  }, [upcoming, completed]);

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative h-[55vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#5A0000] via-nsut-maroon to-[#8A0000]"
      >
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M50 50v-6h-2v6h-6v2h6v6h2v-6h6v-2h-6zm0-40V4h-2v6h-6v2h6v6h2v-6h6V4h-6zM10 50v-6H8v6H2v2h6v6h2v-6h6v-2h-6zM10 10V4H8v6H2v2h6v6h2v-6h6V4h-6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nsut-yellow/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block bg-nsut-yellow/20 border border-nsut-yellow/40 text-nsut-yellow text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
              NSUT Events
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight mb-4 drop-shadow-lg"
          >
            Events & Milestones
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Browse upcoming reunions, seminars, and meetups — or look back at recaps and photos from past gatherings.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center justify-center gap-8 md:gap-16"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{loading ? '—' : upcoming.length}</p>
              <p className="text-xs uppercase tracking-widest text-white/60">Upcoming Events</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{loading ? '—' : completed.length}</p>
              <p className="text-xs uppercase tracking-widest text-white/60">Finished Recaps</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{loading ? '—' : totalLikes}</p>
              <p className="text-xs uppercase tracking-widest text-white/60">Community Likes</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Filters + Grid ── */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Filter card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-10">
            <div className="flex flex-col md:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, or host name."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-nsut-maroon/30 focus:border-nsut-maroon"
                />
              </div>
              <Link
                to={hostEventLink}
                className="inline-flex items-center justify-center gap-2 bg-nsut-maroon hover:bg-[#a00303] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Host an Event
              </Link>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-1">Status:</span>
              {(
                [
                  ['all', `All Events (${upcoming.length + completed.length})`],
                  ['upcoming', `Upcoming (${upcoming.length})`],
                  ['completed', `Completed / Archives (${completed.length})`],
                ] as [StatusFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                    statusFilter === key
                      ? 'bg-nsut-maroon text-white border-nsut-maroon'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-nsut-maroon/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-1">Category:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                All ({categoryCounts.all})
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                    categoryFilter === cat
                      ? `${CATEGORY_STYLES[cat].badge} border-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_STYLES[cat].dot}`} />
                  {CATEGORY_STYLES[cat].label} ({categoryCounts[cat]})
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Upcoming grid */}
          {!loading && showUpcoming && (
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-nsut-maroon" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">Upcoming Schedule</h2>
                <span className="text-gray-400 text-sm">({filteredUpcoming.length} shown)</span>
              </div>
              {filteredUpcoming.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredUpcoming.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      isCompleted={false}
                      onOpen={() => {
                        setSelectedEvent(event);
                        setSelectedIsCompleted(false);
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <p className="text-gray-400 text-sm bg-gray-50 rounded-xl p-6 text-center">
                  No upcoming events match your filters right now.
                </p>
              )}
            </div>
          )}

          {/* Completed grid */}
          {!loading && showCompleted && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="w-5 h-5 text-nsut-maroon" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">Past Archives & Recaps</h2>
                <span className="text-gray-400 text-sm">({filteredCompleted.length} shown)</span>
              </div>
              {filteredCompleted.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredCompleted.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      isCompleted={true}
                      onOpen={() => {
                        setSelectedEvent(event);
                        setSelectedIsCompleted(true);
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <p className="text-gray-400 text-sm bg-gray-50 rounded-xl p-6 text-center">
                  No completed events match your filters yet.
                </p>
              )}
            </div>
          )}

          {!loading && upcoming.length === 0 && completed.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">
              No events have been hosted yet — be the first to bring the community together.
            </p>
          )}
        </div>
      </section>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            isCompleted={selectedIsCompleted}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default EventsHome;
