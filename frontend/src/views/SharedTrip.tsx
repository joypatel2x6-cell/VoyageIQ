import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Trip } from '../data/mockData';
import {
  MapPin, Calendar, Users, Wallet, Clock, Copy,
  Share2, Mail, MessageCircle, Check, ChevronDown,
  ChevronUp, Compass, ExternalLink, Heart, Star,
  ArrowRight, Globe, Camera, Utensils, Landmark,
  ShoppingBag, Navigation, Bed, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Mock "European Summer Adventure" shared trip data
// ─────────────────────────────────────────────────────────────────────────────
export const SHARED_TRIP: Trip = {
  id: 'shared-europe',
  name: 'European Summer Adventure',
  description:
    'A sun-soaked journey through three of Europe\'s most iconic cities — the romance of Paris, the canals of Amsterdam, and the eternal grandeur of Rome. Carefully crafted for two travellers seeking the perfect balance of culture, food, and unforgettable moments.',
  startDate: '2026-06-12',
  endDate: '2026-06-22',
  budgetLimit: 80000,
  isShared: true,
  likesCount: 847,
  commentsCount: 112,
  travelStyle: 'Balanced',
  currency: 'INR',
  travelersCount: 2,
  collaborators: [],
  coverImage:
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1400&auto=format&fit=crop',
  destinations: [
    {
      id: 'city-s1',
      name: 'Paris',
      image:
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=900&auto=format&fit=crop',
      arrivalDate: '2026-06-12',
      departureDate: '2026-06-15',
      activities: [
        {
          id: 'act-s1',
          title: 'Check-in — Hôtel Plaza Athénée',
          date: '2026-06-12',
          time: '14:00',
          cost: 22000,
          category: 'accommodation',
          location: 'Avenue Montaigne, Paris 8e',
          notes: '3-night stay. Iconic hotel overlooking Avenue Montaigne.',
        },
        {
          id: 'act-s2',
          title: 'Evening Seine River Cruise',
          date: '2026-06-12',
          time: '20:00',
          cost: 2800,
          category: 'activity',
          location: 'Port de la Bourdonnais, Paris',
          notes: 'Dinner cruise with live accordion. Stunning Eiffel Tower views.',
        },
        {
          id: 'act-s3',
          title: 'Eiffel Tower Summit — Sunrise Visit',
          date: '2026-06-13',
          time: '07:30',
          cost: 1200,
          category: 'sightseeing',
          location: 'Champ de Mars, 5 Avenue Anatole France',
          notes: 'Book skip-the-line tickets 3 weeks in advance.',
        },
        {
          id: 'act-s4',
          title: 'Lunch at Café de Flore',
          date: '2026-06-13',
          time: '13:00',
          cost: 1800,
          category: 'food',
          location: '172 Bd Saint-Germain, Paris 6e',
          notes: 'A Parisian institution since 1887. Try the croque-monsieur.',
        },
        {
          id: 'act-s5',
          title: 'Louvre Museum — Half-Day Tour',
          date: '2026-06-13',
          time: '15:00',
          cost: 800,
          category: 'culture',
          location: 'Rue de Rivoli, Paris 1er',
          notes: 'Focus on Denon Wing: Mona Lisa, Winged Victory, Venus de Milo.',
        },
        {
          id: 'act-s6',
          title: 'Versailles Palace Day Trip',
          date: '2026-06-14',
          time: '09:00',
          cost: 2400,
          category: 'activity',
          location: 'Place d\'Armes, Versailles',
          notes: 'Train from Gare Montparnasse (35 min). Book gardens pass too.',
        },
        {
          id: 'act-s7',
          title: 'Le Marais District & Dinner',
          date: '2026-06-14',
          time: '19:30',
          cost: 3200,
          category: 'food',
          location: 'Rue des Rosiers, Paris 4e',
          notes: 'Pre-dinner shop at boutiques, then dinner at Breizh Café.',
        },
      ],
    },
    {
      id: 'city-s2',
      name: 'Amsterdam',
      image:
        'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=900&auto=format&fit=crop',
      arrivalDate: '2026-06-15',
      departureDate: '2026-06-18',
      activities: [
        {
          id: 'act-s8',
          title: 'Thalys Train — Paris to Amsterdam',
          date: '2026-06-15',
          time: '08:15',
          cost: 5600,
          category: 'transport',
          location: 'Paris Gare du Nord → Amsterdam Centraal',
          notes: 'Book 2 months in advance for best price. Journey: 3h20m.',
        },
        {
          id: 'act-s9',
          title: 'Check-in — Pulitzer Amsterdam',
          date: '2026-06-15',
          time: '14:00',
          cost: 18000,
          category: 'accommodation',
          location: 'Prinsengracht 315, Amsterdam',
          notes: '3-night canal-view suite. Iconic historic hotel.',
        },
        {
          id: 'act-s10',
          title: 'Rijksmuseum — Dutch Masters Tour',
          date: '2026-06-16',
          time: '10:00',
          cost: 1000,
          category: 'culture',
          location: 'Museumstraat 1, Amsterdam',
          notes: 'Rembrandt\'s Night Watch and Vermeer\'s The Milkmaid.',
        },
        {
          id: 'act-s11',
          title: 'Canal Boat Rental — Jordaan District',
          date: '2026-06-16',
          time: '15:00',
          cost: 2200,
          category: 'activity',
          location: 'Jordaan, Amsterdam',
          notes: '2-hour electric boat rental. Explore historic canal rings.',
        },
        {
          id: 'act-s12',
          title: 'Anne Frank House',
          date: '2026-06-17',
          time: '09:00',
          cost: 600,
          category: 'culture',
          location: 'Westermarkt 20, Amsterdam',
          notes: 'Pre-book online — often sold out months ahead.',
        },
        {
          id: 'act-s13',
          title: 'Keukenhof Day Trip & Flower Market',
          date: '2026-06-17',
          time: '13:00',
          cost: 1800,
          category: 'activity',
          location: 'Lisse, Netherlands',
          notes: 'World\'s largest flower garden. Bus from Leiden Station.',
        },
      ],
    },
    {
      id: 'city-s3',
      name: 'Rome',
      image:
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=900&auto=format&fit=crop',
      arrivalDate: '2026-06-18',
      departureDate: '2026-06-22',
      activities: [
        {
          id: 'act-s14',
          title: 'Flight — Amsterdam to Rome',
          date: '2026-06-18',
          time: '07:00',
          cost: 7200,
          category: 'transport',
          location: 'AMS → FCO (2h 35m)',
          notes: 'KLM direct. Arrive Fiumicino by 09:00.',
        },
        {
          id: 'act-s15',
          title: 'Check-in — Hotel de Russie',
          date: '2026-06-18',
          time: '14:00',
          cost: 28000,
          category: 'accommodation',
          location: 'Via del Babuino 9, Rome',
          notes: '4-night stay. Steps from Piazza del Popolo and the Spanish Steps.',
        },
        {
          id: 'act-s16',
          title: 'Colosseum & Roman Forum Skip-the-Line',
          date: '2026-06-19',
          time: '09:00',
          cost: 1600,
          category: 'sightseeing',
          location: 'Piazza del Colosseo, Rome',
          notes: 'Guided tour with arena floor access. Book via official site.',
        },
        {
          id: 'act-s17',
          title: 'Lunch at Tonnarello — Trastevere',
          date: '2026-06-19',
          time: '13:30',
          cost: 1400,
          category: 'food',
          location: 'Trastevere, Rome',
          notes: 'Cacio e pepe and supplì — Roman classics at legendary prices.',
        },
        {
          id: 'act-s18',
          title: 'Vatican Museums + Sistine Chapel',
          date: '2026-06-20',
          time: '08:00',
          cost: 2600,
          category: 'culture',
          location: 'Via della Conciliazione, Vatican City',
          notes: 'Early-morning VIP access before general opening. 3-hour tour.',
        },
        {
          id: 'act-s19',
          title: 'Trevi Fountain & Gelato Walk',
          date: '2026-06-20',
          time: '17:00',
          cost: 600,
          category: 'activity',
          location: 'Piazza di Trevi, Rome',
          notes: 'Visit at dusk — beautifully lit, fewer crowds.',
        },
        {
          id: 'act-s20',
          title: 'Farewell Dinner — La Pergola',
          date: '2026-06-21',
          time: '20:00',
          cost: 8000,
          category: 'food',
          location: 'Via Alberto Cadlolo 101, Rome',
          notes: 'Rome\'s only 3-Michelin-star restaurant. Reserve 6 weeks ahead.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  accommodation: <Bed size={14} />,
  food: <Utensils size={14} />,
  culture: <Landmark size={14} />,
  activity: <Camera size={14} />,
  sightseeing: <Star size={14} />,
  transport: <Navigation size={14} />,
  shopping: <ShoppingBag size={14} />,
};

const CAT_COLORS: Record<string, string> = {
  accommodation: '#8b5cf6',
  food: '#f43f5e',
  culture: '#6d28d9',
  activity: '#10b981',
  sightseeing: '#06b6d4',
  transport: '#f97316',
  shopping: '#ec4899',
  other: '#64748b',
};

const CITY_PALETTE = [
  { accent: '#6366f1', light: 'rgba(99,102,241,0.12)', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { accent: '#06b6d4', light: 'rgba(6,182,212,0.12)', gradient: 'linear-gradient(135deg,#06b6d4,#0ea5e9)' },
  { accent: '#f43f5e', light: 'rgba(244,63,94,0.12)', gradient: 'linear-gradient(135deg,#f43f5e,#f97316)' },
];

function shortDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function getDays(s: string, e: string) {
  return Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000);
}

function totalCitySpend(dest: Trip['destinations'][0]) {
  return dest.activities.reduce((s, a) => s + a.cost, 0);
}

// Budget breakdown by category
function getBudgetBreakdown(trip: Trip) {
  const map: Record<string, number> = {};
  trip.destinations.forEach(d =>
    d.activities.forEach(a => {
      map[a.category] = (map[a.category] || 0) + a.cost;
    })
  );
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Share Drawer
// ─────────────────────────────────────────────────────────────────────────────
const ShareDrawer: React.FC<{ trip: Trip; onClose: () => void }> = ({ trip, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://voyageiq.app/trip/${trip.id}`;
  const shareText = `Check out my trip: ${trip.name} — planned with VoyageIQ 🌍`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,19,41,0.75)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', animation: 'modal-scale 0.22s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Share this Trip</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.name}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Link copy box */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Trip Link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={shareUrl}
                style={{ flex: 1, padding: '0.55rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', outline: 'none' }} />
              <button onClick={handleCopyLink}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: copied ? 'var(--color-success)' : 'var(--color-primary)', color: '#fff', cursor: 'pointer', transition: 'background-color 0.25s', flexShrink: 0 }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Platform buttons */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Share via</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <MessageCircle size={18} fill="#22c55e" color="#22c55e" /> WhatsApp
              </a>
              {/* Email */}
              <a href={`mailto:?subject=${encodeURIComponent(trip.name + ' — VoyageIQ')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <Mail size={18} /> Email
              </a>
              {/* Twitter/X */}
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', color: '#38bdf8', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                <Globe size={18} /> Twitter / X
              </a>
              {/* Copy for Instagram */}
              <button onClick={handleCopyLink}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                <ExternalLink size={18} /> Copy for Bio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  City Itinerary Block
// ─────────────────────────────────────────────────────────────────────────────
const CityBlock: React.FC<{ dest: Trip['destinations'][0]; index: number; tripCurrency: string }> = ({ dest, index, tripCurrency }) => {
  const [expanded, setExpanded] = useState(true);
  const pal = CITY_PALETTE[index % CITY_PALETTE.length];
  const cityTotal = totalCitySpend(dest);
  const symbol = tripCurrency === 'INR' ? '₹' : '$';
  const nights = getDays(dest.arrivalDate, dest.departureDate);
  const sorted = [...dest.activities].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: pal.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: '#fff', flexShrink: 0, boxShadow: `0 0 0 6px ${pal.light}` }}>
          {index + 1}
        </div>
        {/* Vertical line */}
        <div style={{ flex: 1, width: 2, backgroundColor: pal.light, marginTop: 8, minHeight: 60 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: '2rem' }}>
        {/* City header card */}
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: `1px solid ${pal.accent}30`, marginBottom: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <div style={{ position: 'relative', height: 180 }}>
            <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 35%, rgba(11,19,41,0.82))` }} />
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{dest.name}</h3>
                <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.775rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{shortDate(dest.arrivalDate)} – {shortDate(dest.departureDate)}</span>
                  <span>·</span>
                  <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Spend</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{symbol}{cityTotal.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Toggle bar */}
          <button onClick={() => setExpanded(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', border: 'none', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', borderTop: `2px solid ${pal.accent}30` }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {sorted.length} activities planned
            </span>
            {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </button>
        </div>

        {/* Activity timeline */}
        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: 8 }} className="animate-fade-in">
            {sorted.map((act) => {
              const color = CAT_COLORS[act.category] || '#64748b';
              return (
                <div key={act.id} style={{ display: 'flex', gap: 14, padding: '0.9rem 1.1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-light)', borderLeft: `3px solid ${color}`, position: 'relative' }}>
                  {/* Time */}
                  <div style={{ minWidth: 46, flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{act.time}</div>
                    <div style={{ fontSize: '0.6rem', marginTop: 3 }}>
                      <span style={{ backgroundColor: color + '22', color, padding: '1px 5px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 2 }}>
                        {CAT_ICONS[act.category] || <Star size={11} />}
                      </span>
                    </div>
                  </div>

                  {/* Separator dot */}
                  <div style={{ width: 1, backgroundColor: 'var(--border-color-light)', flexShrink: 0, alignSelf: 'stretch' }} />

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>{act.title}</div>
                    {act.location && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}><MapPin size={10} />{act.location}</div>}
                    {act.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>💡 {act.notes}</div>}
                  </div>

                  {/* Cost */}
                  {act.cost > 0 && (
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{symbol}{act.cost.toLocaleString()}</div>
                      {act.cost === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 700 }}>Free</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main SharedTrip Page
// ─────────────────────────────────────────────────────────────────────────────
export const SharedTrip: React.FC = () => {
  const { isAuthenticated, cloneTrip, showToast, setCurrentView, setIsAuthenticated, sharedTripId, communityPosts } = useApp();
  const selectedPost = communityPosts.find(p => p.trip.id === sharedTripId);
  const trip = selectedPost ? selectedPost.trip : SHARED_TRIP;

  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const symbol = trip.currency === 'INR' ? '₹' : '$';
  const totalDays = getDays(trip.startDate, trip.endDate);
  const totalSpend = trip.destinations.reduce((s, d) => s + totalCitySpend(d), 0);
  const budgetBreakdown = getBudgetBreakdown(trip);
  const routeLabel = trip.destinations.map(d => d.name).join(' → ');

  const handleCopyTrip = () => {
    if (!isAuthenticated) {
      showToast('Sign in to copy this trip to My Trips.', 'info');
      setIsAuthenticated(false);
      setCurrentView('dashboard');
      return;
    }
    cloneTrip(trip);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ── Public Navbar ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        backgroundColor: 'rgba(var(--bg-dark-accent-rgb, 11,19,41), 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 8, padding: 6, display: 'flex' }}>
            <Compass size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>VoyageIQ</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => setShowShare(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
            <Share2 size={14} /> Share
          </button>
          {!isAuthenticated && (
            <button onClick={() => { setCurrentView('dashboard'); }}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '88vh', minHeight: 520, overflow: 'hidden' }}>
        <img
          src={trip.coverImage || trip.destinations[0].image}
          alt={trip.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', transformOrigin: 'center center' }}
        />
        {/* Multi-layer gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,19,41,0.25) 0%, rgba(11,19,41,0.1) 40%, rgba(11,19,41,0.78) 80%, var(--bg-primary) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />

        {/* Hero content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4rem 3rem 3rem', maxWidth: 900, margin: '0 auto' }}>
          {/* Author / Source label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planned with VoyageIQ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              <Heart size={12} fill="rgba(244,63,94,0.7)" color="rgba(244,63,94,0.7)" />
              {trip.likesCount.toLocaleString()} saves
            </div>
          </div>

          {/* Trip name */}
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {trip.name}
          </h1>

          {/* Route subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {trip.destinations.map((d, i) => (
              <React.Fragment key={d.id}>
                {i > 0 && <ArrowRight size={16} color="rgba(255,255,255,0.5)" />}
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{d.name}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Meta stat pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 28 }}>
            {[
              { icon: <Clock size={15} />, val: `${totalDays} Days` },
              { icon: <MapPin size={15} />, val: `${trip.destinations.length} Cities` },
              { icon: <Users size={15} />, val: `${trip.travelersCount} Travellers` },
              { icon: <Wallet size={15} />, val: `${symbol}${totalSpend.toLocaleString()} Estimated` },
            ].map(s => (
              <div key={s.val} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                {s.icon} {s.val}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleCopyTrip}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.8rem 1.75rem', fontSize: '0.925rem', fontWeight: 800, borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: copied ? '#10b981' : 'var(--color-primary)', color: '#fff', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              {copied ? <><Check size={17} /> Copied to My Trips!</> : <><Copy size={17} /> Copy This Trip</>}
            </button>
            <button onClick={() => setShowShare(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.8rem 1.6rem', fontSize: '0.925rem', fontWeight: 800, borderRadius: 'var(--radius-full)', border: '2px solid rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Share2 size={17} /> Share Trip
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>

        {/* Trip description */}
        <div style={{ marginBottom: '3rem', padding: '1.75rem 2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(to bottom, #6366f1, #06b6d4)' }} />
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.75, paddingLeft: '0.5rem' }}>
            {trip.description}
          </p>
        </div>

        {/* Section: Itinerary */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              Day-by-Day Itinerary
            </h2>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
          </div>

          {/* City blocks */}
          {trip.destinations.map((dest, i) => (
            <CityBlock key={dest.id} dest={dest} index={i} tripCurrency={trip.currency || 'INR'} />
          ))}
        </div>

        {/* Section: Budget Breakdown */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              Budget Breakdown
            </h2>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color-light)' }} />
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color-light)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Estimated Cost</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{symbol}{totalSpend.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Person</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{symbol}{Math.round(totalSpend / (trip.travelersCount || 1)).toLocaleString()}</div>
              </div>
            </div>

            {/* Per-city spend */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>By City</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trip.destinations.map((d, i) => {
                  const spend = totalCitySpend(d);
                  const pct = totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0;
                  const pal = CITY_PALETTE[i % CITY_PALETTE.length];
                  return (
                    <div key={d.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</span>
                        <span style={{ fontWeight: 800 }}>{symbol}{spend.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 6, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pal.gradient, borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By category */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>By Category</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                {budgetBreakdown.map(([cat, amt]) => {
                  const color = CAT_COLORS[cat] || '#64748b';
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.9rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${color}` }}>
                      <span style={{ color }}>{CAT_ICONS[cat] || <Star size={14} />}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{symbol}{amt.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA banner ──────────────────────────────────────────────── */}
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', padding: '2.5rem 2rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.05) 0%, transparent 40%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Like this trip?</div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>Plan your own {routeLabel.split(' → ')[0]} adventure</h2>
            <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>Copy this itinerary and customise every detail with VoyageIQ — free forever.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleCopyTrip}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 800, borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: '#fff', color: '#6366f1', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {copied ? <><Check size={17} /> Copied!</> : <><Copy size={17} /> Copy This Trip</>}
              </button>
              <button onClick={() => setShowShare(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.85rem 1.6rem', fontSize: '0.95rem', fontWeight: 800, borderRadius: 'var(--radius-full)', border: '2px solid rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: '#fff', cursor: 'pointer' }}>
                <Share2 size={17} /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Compass size={14} color="var(--color-primary)" />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>VoyageIQ</span>
          </div>
          <p style={{ margin: 0 }}>Plan Smarter. Travel Further. — This is a read-only shared itinerary.</p>
        </div>
      </div>

      {/* Share drawer */}
      {showShare && <ShareDrawer trip={trip} onClose={() => setShowShare(false)} />}
    </div>
  );
};
