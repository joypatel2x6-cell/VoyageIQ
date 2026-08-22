import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { mockDestinations } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { 
  Calculator, Briefcase, RefreshCw, BarChart2,
  CheckCircle2, AlertTriangle, ShieldCheck,
  Plus, X
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Centralized exchange rates relative to INR (1 INR = Rate)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012, // 1 INR = 0.012 USD
  EUR: 0.011, // 1 INR = 0.011 EUR
  GBP: 0.0094, // 1 INR = 0.0094 GBP
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Base flight costs in INR for mock destinations
const DEST_FLIGHT_COSTS: Record<string, number> = {
  'Kyoto, Japan': 55000,
  'Amalfi Coast, Italy': 65000,
  'Swiss Alps, Switzerland': 70000,
  'Reykjavik, Iceland': 75000,
  'New York City, USA': 80000,
  'Mumbai, India': 5000, // Domestic baseline
};

// Base visa costs in INR
const DEST_VISA_COSTS: Record<string, number> = {
  'Kyoto, Japan': 3500,
  'Amalfi Coast, Italy': 7500, // Schengen
  'Swiss Alps, Switzerland': 7500, // Schengen
  'Reykjavik, Iceland': 7500, // Schengen
  'New York City, USA': 15000, // US Visa
  'Mumbai, India': 0,
};

// Recharts colors
const COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export const CostCalculator: React.FC = () => {
  const { trips, addTrip, updateTrip, setCurrentView, showToast } = useApp();

  // Inputs State
  const [selectedDest, setSelectedDest] = useState(mockDestinations[0].name);
  const [startDate, setStartDate] = useState(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 17 * 86400000).toISOString().split('T')[0]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelStyle, setTravelStyle] = useState<'Budget' | 'Comfort' | 'Premium' | 'Luxury'>('Comfort');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  
  // Budget Match
  const [myBudget, setMyBudget] = useState('');

  // Toggles for optional costs
  const [isFlight, setIsFlight] = useState(true);
  const [isHotel, setIsHotel] = useState(true);
  const [isInsurance, setIsInsurance] = useState(false);
  const [isVisa, setIsVisa] = useState(false);
  const [isCarRental, setIsCarRental] = useState(false);

  // Apply to existing trip state
  const [targetTripId, setTargetTripId] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Calculate days & nights count
  const nightsCount = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const daysCount = nightsCount + 1;

  // Selected destination suggestion metadata
  const activeDest = useMemo(() => {
    return mockDestinations.find(d => d.name === selectedDest) || mockDestinations[0];
  }, [selectedDest]);

  // Deterministic Cost Calculation (centered in INR)
  const calculationResult = useMemo(() => {
    // Travel style budget multipliers
    const styleMultipliers = {
      Budget: 0.6,
      Comfort: 1.0,
      Premium: 1.8,
      Luxury: 3.5,
    };

    const multiplier = styleMultipliers[travelStyle];
    
    // Base daily estimate converted from USD (baseline dailyBudgetEstimate is USD)
    const baseDailyINR = activeDest.dailyBudgetEstimate * 83;

    // 1. Accommodation
    let accommodation = 0;
    if (isHotel) {
      // 40% of base rate goes to accommodation, scaled by rooms needed
      const roomsNeeded = Math.ceil((adults + children * 0.5) / 2);
      const nightlyRate = baseDailyINR * 0.45 * multiplier;
      accommodation = nightlyRate * nightsCount * roomsNeeded;
    }

    // 2. Food (25% of base daily rate)
    const dailyFoodAdult = baseDailyINR * 0.25 * multiplier;
    const dailyFoodChild = dailyFoodAdult * 0.5;
    const food = (dailyFoodAdult * adults + dailyFoodChild * children) * daysCount;

    // 3. Activities (15% of base daily rate)
    const dailyActAdult = baseDailyINR * 0.15 * multiplier;
    const dailyActChild = dailyActAdult * 0.5;
    const activities = (dailyActAdult * adults + dailyActChild * children) * daysCount;

    // 4. Local Transport (8% of daily rate)
    const dailyTrans = baseDailyINR * 0.08 * multiplier;
    const localTransport = dailyTrans * (adults + children) * daysCount;

    // 5. Shopping (12% base)
    const shoppingBase = baseDailyINR * 0.12 * multiplier * Math.min(daysCount, 7);
    const shopping = shoppingBase * (adults + children * 0.5);

    // 6. Miscellaneous (5% base)
    const misc = baseDailyINR * 0.05 * multiplier * (adults + children) * daysCount;

    // 7. Long-Distance Transportation (Flights & Car Rentals)
    let transportation = 0;
    if (isFlight) {
      const baseFlight = DEST_FLIGHT_COSTS[selectedDest] || 60000;
      // Multiplier applies to class of travel (Luxury = business/first, budget = economy saver)
      const flightClassMultiplier = travelStyle === 'Luxury' ? 3.0 : travelStyle === 'Premium' ? 1.6 : 1.0;
      transportation += baseFlight * flightClassMultiplier * (adults + children);
    }
    if (isCarRental) {
      const dailyCar = travelStyle === 'Luxury' ? 8000 : travelStyle === 'Premium' ? 5000 : travelStyle === 'Comfort' ? 3000 : 1500;
      transportation += dailyCar * daysCount;
    }

    // 8. Visas & Insurance (Optional metadata)
    let visa = 0;
    if (isVisa) {
      const baseVisa = DEST_VISA_COSTS[selectedDest] || 5000;
      visa = baseVisa * (adults + children);
    }

    let insurance = 0;
    if (isInsurance) {
      const baseInsurance = 2500; // Flat ₹2,500 per person
      insurance = baseInsurance * (adults + children);
    }

    // Combined category totals
    const totalINR = accommodation + food + activities + localTransport + shopping + misc + transportation + visa + insurance;

    // Rate multiplier for currency conversion
    const rate = EXCHANGE_RATES[currency];

    return {
      accommodation: Math.round(accommodation * rate),
      food: Math.round(food * rate),
      activities: Math.round(activities * rate),
      localTransport: Math.round(localTransport * rate),
      shopping: Math.round(shopping * rate),
      misc: Math.round(misc * rate),
      transportation: Math.round(transportation * rate),
      visa: Math.round(visa * rate),
      insurance: Math.round(insurance * rate),
      total: Math.round(totalINR * rate),
      rawTotalINR: totalINR,
    };
  }, [selectedDest, travelStyle, adults, children, daysCount, nightsCount, isFlight, isHotel, isInsurance, isVisa, isCarRental, currency, activeDest]);

  // Derived values for stats
  const symbol = CURRENCY_SYMBOLS[currency];
  
  // Calculate person totals
  const perPerson = useMemo(() => {
    const divisor = adults > 0 ? adults : 1;
    return Math.round(calculationResult.total / divisor);
  }, [calculationResult.total, adults]);

  const perDay = useMemo(() => {
    const divisor = daysCount > 0 ? daysCount : 1;
    return Math.round(calculationResult.total / divisor);
  }, [calculationResult.total, daysCount]);

  // Recharts Chart Data
  const chartData = useMemo(() => {
    const list = [
      { name: 'Accommodation', value: calculationResult.accommodation },
      { name: 'Transportation', value: calculationResult.transportation },
      { name: 'Food & Dining', value: calculationResult.food },
      { name: 'Activities', value: calculationResult.activities },
      { name: 'Local Transport', value: calculationResult.localTransport },
      { name: 'Shopping', value: calculationResult.shopping },
      { name: 'Other / Visas', value: calculationResult.misc + calculationResult.visa + calculationResult.insurance },
    ];
    return list.filter(item => item.value > 0);
  }, [calculationResult]);

  // Budget status comparison calculations
  const budgetDiff = useMemo(() => {
    if (!myBudget.trim()) return null;
    const num = Number(myBudget);
    if (isNaN(num)) return null;
    return {
      limit: num,
      diff: Math.abs(num - calculationResult.total),
      isExceeded: calculationResult.total > num,
    };
  }, [myBudget, calculationResult.total]);

  // Smart cost optimization recommendations
  const smartInsights = useMemo(() => {
    const list = [];
    const accommodationPct = Math.round((calculationResult.accommodation / calculationResult.total) * 100);
    const transportPct = Math.round((calculationResult.transportation / calculationResult.total) * 100);

    if (accommodationPct > 40) {
      list.push({
        message: `Accommodation represents ${accommodationPct}% of your trip budget.`,
        tip: `You could save approximately ${symbol}${Math.round(calculationResult.accommodation * 0.25).toLocaleString()} by opting for a highly-rated homestay instead of premium hotels.`
      });
    }

    if (transportPct > 35) {
      list.push({
        message: `Transportation costs make up ${transportPct}% of your total estimate.`,
        tip: `Consider adjusting your start dates to mid-week flights or comparing nearby secondary airports to save up to 20% on flights.`
      });
    }

    if (calculationResult.activities > calculationResult.food) {
      list.push({
        message: 'Your activity spending is higher than your food budget.',
        tip: `Look for free sightseeing passes, city tourism discount cards, or book group tours instead of private guides to optimize activities.`
      });
    }

    // Default general advice if list is short
    if (list.length === 0) {
      list.push({
        message: "You're within a healthy allocation range across categories.",
        tip: "Set aside a 10% contingency cash reserve in miscellaneous for unexpected local discoveries."
      });
    }

    return list;
  }, [calculationResult, symbol]);

  const handleCreateTrip = () => {
    addTrip({
      name: `Grand Vacation in ${selectedDest}`,
      description: `${travelStyle} travel style itinerary planned using VoyageIQ Smart Cost Estimator.`,
      startDate,
      endDate,
      budgetLimit: calculationResult.total,
      currency,
      travelersCount: adults + children,
      travelStyle: travelStyle === 'Comfort' ? 'Balanced' : travelStyle === 'Premium' ? 'Balanced' : travelStyle === 'Luxury' ? 'Luxury' : 'Budget',
      destinations: [
        {
          id: `city-${Math.random().toString(36).substring(2, 9)}`,
          name: selectedDest,
          image: activeDest.image,
          arrivalDate: startDate,
          departureDate: endDate,
          activities: [],
        }
      ],
      coverImage: activeDest.image,
      isShared: false,
      collaborators: [],
    });
    
    showToast(`✈️ Trip created with budget ${symbol}${calculationResult.total.toLocaleString()}!`, 'success');
    setCurrentView('plan-trip');
  };

  // Apply Cost calculations to an existing active trip budget
  const handleApplyToExisting = () => {
    if (!targetTripId) {
      showToast('Please select a trip first!', 'error');
      return;
    }

    const trip = trips.find(t => t.id === targetTripId);
    if (!trip) return;

    updateTrip({
      ...trip,
      budgetLimit: calculationResult.total,
      currency: currency,
    });

    showToast(`Applied budget of ${symbol}${calculationResult.total.toLocaleString()} to "${trip.name}"`, 'success');
    setShowApplyModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3.5rem' }} className="animate-fade-in">
      
      {/* Page Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex' }}>
            <Calculator size={22} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>VoyageIQ Cost Calculator</h1>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Plan Smarter. Travel Further. Deterministic cost projections based on travel styles.
        </p>
      </div>

      {/* Main Split Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
        }}
        className="calculator-split-layout"
      >
        <style>{`
          @media (max-width: 1024px) {
            .calculator-split-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* ==================== LEFT: Inputs Panel ==================== */}
        <div
          className="glass-panel"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color-light)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color-light)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={16} color="var(--color-primary)" /> Configure Travel Inputs
          </h2>

          {/* Destination & Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Destination</label>
              <select
                value={selectedDest}
                onChange={e => setSelectedDest(e.target.value)}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                {mockDestinations.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as any)}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Dates Picker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Travelers & Style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Adults</label>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={e => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Children</label>
              <input
                type="number"
                min="0"
                value={children}
                onChange={e => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Travel Style</label>
              <select
                value={travelStyle}
                onChange={e => setTravelStyle(e.target.value as any)}
                style={{
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="Budget">Budget (Basic lodging & transit)</option>
                <option value="Comfort">Comfort (Standard amenities)</option>
                <option value="Premium">Premium (Semi-luxury excursions)</option>
                <option value="Luxury">Luxury (Premium dining & suites)</option>
              </select>
            </div>
          </div>

          {/* Cost Inclusions Options checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inclusions</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { label: 'Flights (Roundtrip Ticket)', state: isFlight, set: setIsFlight },
                { label: 'Hotels / Lodging suites', state: isHotel, set: setIsHotel },
                { label: 'Travel Insurance plan', state: isInsurance, set: setIsInsurance },
                { label: 'Visa application fees', state: isVisa, set: setIsVisa },
                { label: 'Car Rental / Private Taxi', state: isCarRental, set: setIsCarRental },
              ].map((opt, i) => (
                <label 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color-light)',
                    backgroundColor: opt.state ? 'var(--bg-primary)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={opt.state}
                    onChange={e => opt.set(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* My Budget Input Comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Compare to My Budget</span>
              <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Optional</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                placeholder={`Enter target budget in ${currency}...`}
                value={myBudget}
                onChange={e => setMyBudget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem 0.55rem 1.8rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '52%', transform: 'translateY(-50%)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)' }}>
                {symbol}
              </span>
            </div>
          </div>

        </div>

        {/* ==================== RIGHT: Results & Breakdowns ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Big Summary Cards */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
            className="stats-grid-cols"
          >
            <style>{`
              @media (max-width: 480px) {
                .stats-grid-cols {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            
            {/* Stat 1: Total Estimate */}
            <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Trip Cost</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                {symbol}{calculationResult.total.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{daysCount} Days / {nightsCount} Nights</span>
            </div>

            {/* Stat 2: Per Person */}
            <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Per Person Cost</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {symbol}{perPerson.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Based on {adults} Adult{adults > 1 ? 's' : ''}</span>
            </div>

            {/* Stat 3: Per Day */}
            <div className="glass-panel" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-light)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Average</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {symbol}{perDay.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Daily pacing estimate</span>
            </div>
          </div>

          {/* Budget Health comparison banner */}
          {budgetDiff && (
            <div
              style={{
                backgroundColor: budgetDiff.isExceeded ? 'var(--color-error-light)' : 'var(--color-success-light)',
                color: budgetDiff.isExceeded ? 'var(--color-error)' : 'var(--color-success)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${budgetDiff.isExceeded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.875rem',
              }}
              className="animate-fade-in"
            >
              {budgetDiff.isExceeded ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <div style={{ flex: 1, fontWeight: 600 }}>
                {budgetDiff.isExceeded ? (
                  <span>Your estimated trip cost is {symbol}{budgetDiff.diff.toLocaleString()} above your budget!</span>
                ) : (
                  <span>Great! You're within your planned budget limit. Remaining: {symbol}{budgetDiff.diff.toLocaleString()}</span>
                )}
              </div>
              <span style={{ fontSize: '0.725rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: budgetDiff.isExceeded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', fontWeight: 800, textTransform: 'uppercase' }}>
                {budgetDiff.isExceeded ? 'Exceeded' : 'Healthy'}
              </span>
            </div>
          )}

          {/* Breakdown & Visual chart card */}
          <div
            className="glass-panel"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color-light)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={15} color="var(--color-primary)" /> Expenditure Breakdown
            </h3>

            {/* Layout splitting list and Recharts */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }} className="chart-split-cols">
              <style>{`
                @media (max-width: 640px) {
                  .chart-split-cols {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
              
              {/* Category table/list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'center' }}>
                {[
                  { label: 'Accommodation', val: calculationResult.accommodation, desc: `${nightsCount} nights base` },
                  { label: 'Transportation (Flight/Car)', val: calculationResult.transportation, desc: 'Flights roundtrip & rental' },
                  { label: 'Food & Dining', val: calculationResult.food, desc: 'Per-day meal pacing' },
                  { label: 'Activities & Excursions', val: calculationResult.activities, desc: 'Selected daily activities' },
                  { label: 'Local Transport', val: calculationResult.localTransport, desc: 'Taxi, trains, metro' },
                  { label: 'Shopping', val: calculationResult.shopping, desc: 'Souvenirs baseline allocation' },
                  { label: 'Visas, Insurance & Misc', val: calculationResult.misc + calculationResult.visa + calculationResult.insurance, desc: 'Processing fees & buffer cash' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color-light)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.675rem', color: 'var(--text-light)' }}>{item.desc}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: item.val > 0 ? 'var(--text-primary)' : 'var(--text-light)' }}>
                      {item.val > 0 ? `${symbol}${item.val.toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pie/Donut Recharts container */}
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${symbol}${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', textAlign: 'center' }}>No inclusions to render chart.</div>
                )}
              </div>
            </div>

          </div>

          {/* Action triggers */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={() => {
                if (trips.length === 0) {
                  showToast('You do not have any active trips planned yet!', 'warning');
                  return;
                }
                setTargetTripId(trips[0].id);
                setShowApplyModal(true);
              }}
              leftIcon={<RefreshCw size={14} />}
              style={{ flex: 1 }}
            >
              Apply to Existing Trip
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTrip}
              leftIcon={<Plus size={14} />}
              style={{ flex: 1 }}
            >
              Use This Estimate for My Trip
            </Button>
          </div>

          {/* Smart Insights Cards */}
          <div
            className="glass-panel"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color-light)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--color-primary)" /> Smart Cost Optimization Insights
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {smartInsights.map((insight, idx) => (
                <div key={idx} style={{ padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid var(--border-color-light)' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{insight.message}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{insight.tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Apply to Existing Trip Modal */}
      {showApplyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(11, 19, 41, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1.5rem',
          }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className="glass-panel animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Apply Budget Estimate
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Target Trip</label>
                <select
                  value={targetTripId}
                  onChange={e => setTargetTripId(e.target.value)}
                  style={{
                    padding: '0.55rem 0.8rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.startDate.split('-')[0]})</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color-light)' }}>
                🚨 <strong>Important:</strong> Applying this estimate will overwrite the target trip's budget limit setting to <strong>{symbol}{calculationResult.total.toLocaleString()}</strong>. Destinations and activities will remain untouched.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button variant="outline" size="sm" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleApplyToExisting}>Apply to Trip</Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
