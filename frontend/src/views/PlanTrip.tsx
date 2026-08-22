import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Activity } from '../data/mockData';
import { mockDestinations } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DatePicker } from '../components/ui/DatePicker';
import { TimelineItem } from '../components/TimelineItem';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetProgress } from '../components/BudgetProgress';
import { MapPin, Calendar, DollarSign, Plus, ArrowLeft, ArrowRight, Save, Trash2, PieChart, AlertTriangle, Users, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};

export const PlanTrip: React.FC = () => {
  const {
    trips,
    activeTripId,
    setActiveTripId,
    setCurrentView,
    addTrip,
    updateTrip,
    addCityToTrip,
    removeCityFromTrip,
    addActivity,
    removeActivity,
    showToast
  } = useApp();

  const [step, setStep] = useState(1);
  const activeTrip = trips.find((t) => t.id === activeTripId);

  // Form States
  const [tripName, setTripName] = useState('');
  const [tripDesc, setTripDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState(2000);
  const [travelersCount, setTravelersCount] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const [travelStyle, setTravelStyle] = useState<'Budget' | 'Balanced' | 'Luxury'>('Balanced');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
  const [initialDestination, setInitialDestination] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // City Add States
  const [selectedCitySearch, setSelectedCitySearch] = useState('');
  const [cityArrival, setCityArrival] = useState('');
  const [cityDeparture, setCityDeparture] = useState('');

  // Activity Add States
  const [activeCityId, setActiveCityId] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityTime, setActivityTime] = useState('09:00');
  const [activityDate, setActivityDate] = useState('');
  const [activityCost, setActivityCost] = useState(0);
  const [activityCategory, setActivityCategory] = useState<Activity['category']>('activity');
  const [activityLocation, setActivityLocation] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);

  // Populate fields if we are editing an active trip
  useEffect(() => {
    if (activeTrip) {
      setTripName(activeTrip.name);
      setTripDesc(activeTrip.description);
      setStartDate(activeTrip.startDate);
      setEndDate(activeTrip.endDate);
      setBudgetLimit(activeTrip.budgetLimit);
      setTravelersCount(activeTrip.travelersCount || 1);
      setCurrency(activeTrip.currency || 'USD');
      setTravelStyle(activeTrip.travelStyle || 'Balanced');
      setCoverImage(activeTrip.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
      setInitialDestination(activeTrip.destinations[0]?.name || '');
      setFormErrors({});
      
      // Auto select first city for itinerary if available
      if (activeTrip.destinations.length > 0 && !activeCityId) {
        setActiveCityId(activeTrip.destinations[0].id);
      }
    } else {
      // Clear forms
      setTripName('');
      setTripDesc('');
      setStartDate('');
      setEndDate('');
      setBudgetLimit(2000);
      setTravelersCount(1);
      setCurrency('USD');
      setTravelStyle('Balanced');
      setCoverImage('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
      setInitialDestination('');
      setActiveCityId('');
      setFormErrors({});
    }
  }, [activeTripId, activeTrip]);

  const handleCreateOrUpdateTrip = () => {
    const errors: Record<string, string> = {};
    if (!tripName.trim()) errors.tripName = 'Trip name is required';
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'End date cannot be before start date';
    }
    if (travelersCount < 1) errors.travelersCount = 'Travelers must be at least 1';
    if (budgetLimit < 0) errors.budgetLimit = 'Budget cannot be negative';
    if (!initialDestination.trim()) errors.initialDestination = 'Initial destination is required';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast('Please fix required validation fields to create a trip.', 'error');
      return;
    }

    const matchedDest = mockDestinations.find(
      (d) => d.name.toLowerCase().includes(initialDestination.toLowerCase())
    );
    const destImg = matchedDest?.image || coverImage;

    if (activeTrip) {
      // Update
      updateTrip({
        ...activeTrip,
        name: tripName,
        description: tripDesc,
        startDate,
        endDate,
        budgetLimit: Number(budgetLimit),
        travelersCount,
        currency,
        travelStyle,
        coverImage: destImg,
      });
      setStep(3); // Navigate to Itinerary Builder
    } else {
      // Create New
      const newTripId = addTrip({
        name: tripName,
        description: tripDesc,
        startDate,
        endDate,
        budgetLimit: Number(budgetLimit),
        travelersCount,
        currency,
        travelStyle,
        coverImage: destImg,
        destinations: [
          {
            id: `city-${Math.random().toString(36).substring(2, 9)}`,
            name: initialDestination,
            image: destImg,
            arrivalDate: startDate,
            departureDate: endDate,
            activities: [],
          }
        ],
        collaborators: [],
        isShared: false,
      });
      
      const createdTrip = trips.find(t => t.id === newTripId);
      if (createdTrip && createdTrip.destinations.length > 0) {
        setActiveCityId(createdTrip.destinations[0].id);
      }
      setStep(3); // Navigate to Itinerary Builder
    }
  };

  const handleSaveDraft = () => {
    if (!tripName.trim()) {
      showToast('Trip name is required to save a draft.', 'error');
      return;
    }
    const matchedDest = mockDestinations.find(
      (d) => d.name.toLowerCase().includes(initialDestination.toLowerCase())
    );
    const destImg = matchedDest?.image || coverImage;

    addTrip({
      name: `${tripName} (Draft)`,
      description: tripDesc,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      budgetLimit: Number(budgetLimit),
      travelersCount,
      currency,
      travelStyle,
      coverImage: destImg,
      destinations: initialDestination ? [
        {
          id: `city-${Math.random().toString(36).substring(2, 9)}`,
          name: initialDestination,
          image: destImg,
          arrivalDate: startDate || new Date().toISOString().split('T')[0],
          departureDate: endDate || new Date().toISOString().split('T')[0],
          activities: [],
        }
      ] : [],
      collaborators: [],
      isShared: false,
    });

    setCurrentView('my-trips');
  };

  const handleAddCity = () => {
    if (!activeTripId) return;
    if (!selectedCitySearch.trim()) {
      showToast('Select a city name!', 'error');
      return;
    }
    if (!cityArrival || !cityDeparture) {
      showToast('Arrival and departure dates are required for the city!', 'error');
      return;
    }
    if (new Date(cityArrival) < new Date(startDate) || new Date(cityDeparture) > new Date(endDate)) {
      showToast('City dates must fall within the main trip dates!', 'error');
      return;
    }

    // Attempt to match image from suggestions
    const matched = mockDestinations.find(
      (d) => d.name.toLowerCase().includes(selectedCitySearch.toLowerCase())
    );
    const imgUrl = matched?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800';

    addCityToTrip(activeTripId, {
      name: selectedCitySearch,
      image: imgUrl,
      arrivalDate: cityArrival,
      departureDate: cityDeparture,
    });

    // Reset forms
    setSelectedCitySearch('');
    setCityArrival('');
    setCityDeparture('');
  };

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripId || !activeCityId) return;
    if (!activityTitle.trim()) {
      showToast('Activity title is required!', 'error');
      return;
    }
    if (!activityDate) {
      showToast('Date is required!', 'error');
      return;
    }

    const city = activeTrip?.destinations.find((d) => d.id === activeCityId);
    if (city) {
      if (new Date(activityDate) < new Date(city.arrivalDate) || new Date(activityDate) > new Date(city.departureDate)) {
        showToast(`Activity date must fall between city dates (${city.arrivalDate} to ${city.departureDate})!`, 'error');
        return;
      }
    }

    addActivity(activeTripId, activeCityId, {
      title: activityTitle,
      date: activityDate,
      time: activityTime,
      cost: Number(activityCost),
      category: activityCategory,
      location: activityLocation,
      notes: activityNotes,
    });

    // Reset form
    setActivityTitle('');
    setActivityTime('09:00');
    setActivityCost(0);
    setActivityCategory('activity');
    setActivityLocation('');
    setActivityNotes('');
    setShowAddActivityModal(false);
  };

  // Budget computations
  const getBudgetStats = () => {
    if (!activeTrip) return { total: 0, categories: {} as Record<string, number> };

    let total = 0;
    const categories: Record<string, number> = {
      accommodation: 0,
      transport: 0,
      food: 0,
      activity: 0,
      shopping: 0,
      other: 0,
    };

    activeTrip.destinations.forEach((dest) => {
      dest.activities.forEach((act) => {
        total += act.cost;
        if (categories[act.category] !== undefined) {
          categories[act.category] += act.cost;
        } else {
          categories.other += act.cost;
        }
      });
    });

    return { total, categories };
  };

  const { total: totalSpent, categories: spentByCategory } = getBudgetStats();

  const getDurationInDays = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return null;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };
  const duration = getDurationInDays();

  // Recharts Chart Config
  const chartData = Object.entries(spentByCategory).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: val,
  })).filter(item => item.value > 0);

  const COLORS = ['#8b5cf6', '#06b6d4', '#f43f5e', '#10b981', '#ec4899', '#64748b'];

  const selectedCityForItinerary = activeTrip?.destinations.find((d) => d.id === activeCityId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* View Title */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>{activeTrip ? `Editing: ${activeTrip.name}` : 'Plan a New Journey'}</h1>
          <p>Design multi-city flight and hotel bookings, itineraries, and map your budgets.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              onClick={() => activeTripId && setStep(s)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step === s ? 'var(--color-primary)' : step > s ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                color: step === s ? '#ffffff' : step > s ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeTripId ? 'pointer' : 'default',
                border: step === s ? 'none' : '1px solid var(--border-color)',
                transition: 'all 0.2s',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CONFIGURE TRIP */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="plan-setup-grid animate-fade-in">
          <style>{`
            .plan-setup-grid {
              grid-template-columns: 1fr;
            }
            @media (min-width: 1024px) {
              .plan-setup-grid {
                grid-template-columns: 1.8fr 1.2fr !important;
              }
            }
            .image-picker-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }
            @media (max-width: 480px) {
              .image-picker-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `}</style>

          {/* Left Form Panel */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border-color-light)' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeTrip ? 'Edit Trip Settings' : 'Plan a New Trip'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                Tell us a little about your journey and we'll help you organize the rest.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Row 1: Trip Name */}
              <Input
                label="Trip Name"
                placeholder="e.g. European Summer Adventure"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                error={formErrors.tripName}
                required
              />

              {/* Row 2: Date Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row-dates">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={formErrors.startDate}
                  required
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  error={formErrors.endDate}
                  required
                />
              </div>

              {/* Row 3: Travelers & Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row-details">
                <Input
                  label="Number of Travelers"
                  type="number"
                  min="1"
                  value={travelersCount}
                  onChange={(e) => setTravelersCount(Number(e.target.value))}
                  error={formErrors.travelersCount}
                  required
                  leftIcon={<Users size={15} />}
                />
                <Input
                  label={`Total Budget (${currency})`}
                  type="number"
                  min="0"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  error={formErrors.budgetLimit}
                  required
                  leftIcon={<DollarSign size={15} />}
                />
              </div>

              {/* Row 4: Currency & Initial Destination */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row-geo">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.925rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      height: '42px',
                    }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Destination</label>
                  <select
                    value={initialDestination}
                    onChange={(e) => {
                      setInitialDestination(e.target.value);
                      const match = mockDestinations.find(d => d.name === e.target.value);
                      if (match) setCoverImage(match.image);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.925rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      height: '42px',
                    }}
                  >
                    <option value="">-- Select Destination --</option>
                    {mockDestinations.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    <option value="Paris, France">Paris, France</option>
                    <option value="London, UK">London, UK</option>
                    <option value="New York, USA">New York, USA</option>
                  </select>
                  {formErrors.initialDestination && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-error)', fontWeight: 600, marginTop: '2px' }}>
                      {formErrors.initialDestination}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 5: Travel Style */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Travel Style</label>
                <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'fit-content' }}>
                  {(['Budget', 'Balanced', 'Luxury'] as const).map((styleOpt) => {
                    const isActive = travelStyle === styleOpt;
                    return (
                      <button
                        key={styleOpt}
                        type="button"
                        onClick={() => setTravelStyle(styleOpt)}
                        style={{
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          border: 'none',
                          backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-secondary)',
                          color: isActive ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          borderRight: styleOpt !== 'Luxury' ? '1px solid var(--border-color)' : 'none',
                        }}
                      >
                        {styleOpt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Trip Description</label>
                <textarea
                  placeholder="Summarize your itinerary objectives, hotel confirmations..."
                  value={tripDesc}
                  onChange={(e) => setTripDesc(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.6rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.925rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              {/* Row 7: Cover Image Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Cover Image Suggestion
                </label>
                
                <div className="image-picker-grid">
                  {[
                    { name: 'Nature Peak', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400' },
                    { name: 'Ocean Shore', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
                    { name: 'Tokyo City', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' },
                    { name: 'Amalfi Coast', url: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400' }
                  ].map((imgOpt) => {
                    const isSelected = coverImage.split('?')[0] === imgOpt.url.split('?')[0];
                    return (
                      <div
                        key={imgOpt.name}
                        onClick={() => setCoverImage(imgOpt.url)}
                        style={{
                          height: '56px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          position: 'relative',
                          border: isSelected ? '3px solid var(--color-primary)' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img src={imgOpt.url} alt={imgOpt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(15,23,42,0.6)', padding: '2px 4px', fontSize: '0.6rem', color: '#ffffff', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {imgOpt.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color-light)', paddingTop: '1rem' }}>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('dashboard')}
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </Button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!activeTrip && (
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>
                )}
                <Button
                  onClick={handleCreateOrUpdateTrip}
                  rightIcon={<ArrowRight size={18} />}
                >
                  {activeTrip ? 'Update Trip Settings' : 'Create Trip'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Live Summary Panel */}
          <div
            style={{
              position: 'sticky',
              top: '80px',
              height: 'fit-content',
            }}
          >
            <div
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color-light)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header Visual Cover */}
              <div style={{ height: '150px', position: 'relative' }}>
                <img
                  src={coverImage}
                  alt="Summary Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
                
                <div style={{ position: 'absolute', bottom: '12px', left: '16px', color: '#ffffff' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-secondary)' }}>
                    Live Preview
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '260px' }}>
                    {tripName.trim() || 'My Journey Destination'}
                  </h3>
                </div>
              </div>

              {/* Attributes Details body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  {/* Duration */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex' }}>
                      <Calendar size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>DURATION</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {duration ? `${duration} Days` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Travelers */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-primary-hover)', display: 'flex' }}>
                      <Users size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>TRAVELERS</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {travelersCount > 0 ? `${travelersCount} Traveler${travelersCount > 1 ? 's' : ''}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex' }}>
                      <DollarSign size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>TOTAL BUDGET</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {budgetLimit >= 0 ? `${currencySymbols[currency] || '$'}${budgetLimit.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Style */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'var(--color-accent-warm-light)', color: 'var(--color-accent-warm)', display: 'flex' }}>
                      <Sparkles size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>BUDGET STYLE</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {travelStyle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stops */}
                <div style={{ borderTop: '1px solid var(--border-color-light)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Initial Destination Stops
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ padding: '4px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex' }}>
                      <MapPin size={10} />
                    </div>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: initialDestination ? 'var(--text-primary)' : 'var(--text-light)' }}>
                      {initialDestination || 'Not specified yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* STEP 2: ADD CITIES */}
      {step === 2 && activeTrip && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="cities-grid">
          <style>{`
            @media (min-width: 1024px) {
              .cities-grid {
                grid-template-columns: 1fr 2fr !important;
              }
            }
          `}</style>

          {/* City Form Add */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Add City Destination</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Search Destinations</label>
              <select
                value={selectedCitySearch}
                onChange={(e) => setSelectedCitySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.9rem',
                  fontSize: '0.925rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <option value="">-- Select a Location --</option>
                {mockDestinations.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
                <option value="London, UK">London, UK</option>
                <option value="Paris, France">Paris, France</option>
                <option value="Rome, Italy">Rome, Italy</option>
              </select>
            </div>

            <DatePicker
              label="Arrival Date"
              value={cityArrival}
              onChange={(e) => setCityArrival(e.target.value)}
            />
            <DatePicker
              label="Departure Date"
              value={cityDeparture}
              onChange={(e) => setCityDeparture(e.target.value)}
            />

            <Button onClick={handleAddCity} fullWidth leftIcon={<Plus size={16} />} style={{ marginTop: '0.5rem' }}>
              Add to Itinerary
            </Button>
          </div>

          {/* Current added cities list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Destinations in this Trip</h3>

            {activeTrip.destinations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {activeTrip.destinations.map((city) => (
                  <div
                    key={city.id}
                    className="glass-panel"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: '110px', position: 'relative', overflow: 'hidden' }}>
                      <img src={city.image} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{city.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {city.arrivalDate} to {city.departureDate}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCityFromTrip(activeTrip.id, city.id)}
                        leftIcon={<Trash2 size={12} />}
                        style={{ color: 'var(--color-error)', alignSelf: 'flex-end', padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                <MapPin size={32} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.875rem' }}>No cities added to this route yet.</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem' }}>
              <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={activeTrip.destinations.length === 0} rightIcon={<ArrowRight size={16} />}>
                Build Itinerary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BUILD ITINERARY / ADD ACTIVITIES */}
      {step === 3 && activeTrip && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="itinerary-grid">
          <style>{`
            @media (min-width: 1024px) {
              .itinerary-grid {
                grid-template-columns: 260px 1fr !important;
              }
            }
          `}</style>

          {/* Left panel: City selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select City</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTrip.destinations.map((dest) => (
                <div
                  key={dest.id}
                  onClick={() => {
                    setActiveCityId(dest.id);
                    setActivityDate(dest.arrivalDate); // Default activity date to arrival date
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: activeCityId === dest.id ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                    color: activeCityId === dest.id ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                    border: activeCityId === dest.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color-light)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {dest.name}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Timeline & Activity List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedCityForItinerary ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      Itinerary for {selectedCityForItinerary.name}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Range: {selectedCityForItinerary.arrivalDate} to {selectedCityForItinerary.departureDate}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={() => {
                      setActivityDate(selectedCityForItinerary.arrivalDate);
                      setShowAddActivityModal(true);
                    }}
                  >
                    Add Activity
                  </Button>
                </div>

                {/* Timeline */}
                {selectedCityForItinerary.activities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
                    {selectedCityForItinerary.activities.map((act, idx) => (
                      <TimelineItem
                        key={act.id}
                        activity={act}
                        isLast={idx === selectedCityForItinerary.activities.length - 1}
                        onDelete={() => removeActivity(activeTrip.id, selectedCityForItinerary.id, act.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '4rem 2rem',
                      borderRadius: 'var(--radius-xl)',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Calendar size={32} />
                    <p style={{ fontSize: '0.875rem' }}>No activities scheduled for this city yet.</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActivityDate(selectedCityForItinerary.arrivalDate);
                        setShowAddActivityModal(true);
                      }}
                      style={{ marginTop: '4px' }}
                    >
                      Schedule First Activity
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select a city on the left to start planning day-to-day slots.</p>
              </div>
            )}

            {/* Back / Next navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color-light)', paddingTop: '1.5rem', marginTop: '2rem' }}>
              <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} rightIcon={<ArrowRight size={16} />}>
                Analyze Budget
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: BUDGET ANALYZER */}
      {step === 4 && activeTrip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Progress Header */}
          <BudgetProgress totalSpent={totalSpent} budgetLimit={activeTrip.budgetLimit} />

          {/* Warnings Panel */}
          {totalSpent > activeTrip.budgetLimit && (
            <div
              style={{
                backgroundColor: 'var(--color-error-light)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                color: '#991b1b',
              }}
            >
              <AlertTriangle size={20} color="var(--color-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Budget Overflow Warning</h4>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.4', marginTop: '2px' }}>
                  Your estimated expenses total **${totalSpent.toLocaleString()}**, which exceeds your initial budget of **${activeTrip.budgetLimit.toLocaleString()}** by **$${(totalSpent - activeTrip.budgetLimit).toLocaleString()}**. Try swapping lodging options or removing non-critical activities.
                </p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Object.entries(spentByCategory).map(([cat, amount]) => {
              // Estimate standard limits
              const limitEstimate = Math.round(activeTrip.budgetLimit * (cat === 'accommodation' ? 0.45 : cat === 'transport' ? 0.25 : 0.1));
              return (
                <BudgetCard
                  key={cat}
                  category={cat as any}
                  spent={amount}
                  limit={limitEstimate}
                  percentage={limitEstimate > 0 ? (amount / limitEstimate) * 100 : 0}
                />
              );
            })}
          </div>

          {/* Charts Row */}
          {chartData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="charts-grid">
              <style>{`
                @media (min-width: 1024px) {
                  .charts-grid {
                    grid-template-columns: 1fr 1fr !important;
                  }
                }
              `}</style>
              
              {/* Category Pie Chart */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Expenses Distribution</h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value ? Number(value).toLocaleString() : 0}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget limit vs spent Bar */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Expenses by Category</h3>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                      <YAxis fontSize={11} stroke="var(--text-muted)" />
                      <Tooltip formatter={(value) => `$${value ? Number(value).toLocaleString() : 0}`} />
                      <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              <PieChart size={36} style={{ marginBottom: '8px' }} />
              <p>No activity expenses recorded yet. Graphs will populate when items are added to itinerary.</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color-light)', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <Button variant="outline" onClick={() => setStep(3)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="success"
              onClick={() => {
                showToast(`Itinerary "${activeTrip.name}" is successfully compiled!`, 'success');
                setActiveTripId(activeTrip.id);
                setCurrentView('trip-summary');
              }}
              leftIcon={<Save size={16} />}
            >
              Compile Trip Summary
            </Button>
          </div>
        </div>
      )}

      {/* Add Activity Modal Form */}
      {showAddActivityModal && selectedCityForItinerary && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowAddActivityModal(false)}
        >
          <form
            onSubmit={handleAddActivitySubmit}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel animate-scale-up"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              maxWidth: '500px',
              width: 'calc(100% - 32px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--border-color-light)', paddingBottom: '0.5rem' }}>
              Add Activity to {selectedCityForItinerary.name}
            </h3>

            <Input
              label="Activity Title"
              placeholder="e.g. Visit Senso-ji Temple"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <DatePicker
                label="Date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                min={selectedCityForItinerary.arrivalDate}
                max={selectedCityForItinerary.departureDate}
                required
              />
              <Input
                label="Time"
                type="time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Estimated Cost ($)"
                type="number"
                value={activityCost}
                onChange={(e) => setActivityCost(Number(e.target.value))}
                leftIcon={<DollarSign size={14} />}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                <select
                  value={activityCategory}
                  onChange={(e) => setActivityCategory(e.target.value as any)}
                  style={{
                    padding: '0.55rem 0.9rem',
                    fontSize: '0.925rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="activity">Sights & Leisure</option>
                  <option value="accommodation">Lodging</option>
                  <option value="transport">Transit</option>
                  <option value="food">Food & Dining</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <Input
              label="Location Address"
              placeholder="e.g. Asakusa, Taito City, Tokyo"
              value={activityLocation}
              onChange={(e) => setActivityLocation(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</label>
              <textarea
                placeholder="Confirmation IDs, train lines, wear comfortable shoes..."
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                style={{
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setShowAddActivityModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Activity
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
