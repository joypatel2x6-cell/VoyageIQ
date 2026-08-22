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
import { MapPin, Calendar, DollarSign, Plus, ArrowLeft, ArrowRight, Save, Trash2, PieChart, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

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
      setActiveCityId('');
    }
  }, [activeTripId, activeTrip]);

  const handleCreateOrUpdateTrip = () => {
    if (!tripName.trim()) {
      showToast('Trip name is required!', 'error');
      return;
    }
    if (!startDate || !endDate) {
      showToast('Start and end dates are required!', 'error');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showToast('Start date cannot be after end date!', 'error');
      return;
    }

    if (activeTrip) {
      // Update
      updateTrip({
        ...activeTrip,
        name: tripName,
        description: tripDesc,
        startDate,
        endDate,
        budgetLimit: Number(budgetLimit),
      });
      setStep(2);
    } else {
      // Create New
      addTrip({
        name: tripName,
        description: tripDesc,
        startDate,
        endDate,
        budgetLimit: Number(budgetLimit),
        destinations: [],
        collaborators: [],
        isShared: false,
      });
      setStep(2);
    }
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
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Trip Core Settings</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="form-grid">
            <style>{`
              @media (min-width: 768px) {
                .form-grid {
                  grid-template-columns: 2fr 1fr !important;
                }
              }
            `}</style>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input
                label="Trip Name"
                placeholder="e.g. Cherry Blossoms in Tokyo"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Trip Description</label>
                <textarea
                  placeholder="Enter notes about who you're traveling with, flight references..."
                  value={tripDesc}
                  onChange={(e) => setTripDesc(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.6rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.925rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Input
                label="Total Budget Limit ($)"
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                leftIcon={<DollarSign size={15} />}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button onClick={handleCreateOrUpdateTrip} rightIcon={<ArrowRight size={18} />}>
              Save & Continue
            </Button>
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
