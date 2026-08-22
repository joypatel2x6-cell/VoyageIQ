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
import { MapPin, Calendar, DollarSign, Plus, ArrowLeft, ArrowRight, Save, PieChart, AlertTriangle, Users, Sparkles, Compass, Loader2, Calculator } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { SmartInsightCard } from '../components/SmartInsightCard';
import { api } from '../services/api';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹',
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
  const activeTrip = trips.find((t) => t.id === activeTripId) || (activeTripId && trips.length > 0 ? trips[0] : undefined);

  // Form States
  const [tripName, setTripName] = useState('');
  const [tripDesc, setTripDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState(150000);
  const [travelersCount, setTravelersCount] = useState(1);
  const [currency, setCurrency] = useState('INR');
  const [travelStyle, setTravelStyle] = useState<'Budget' | 'Balanced' | 'Luxury'>('Balanced');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
  const [initialDestination, setInitialDestination] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // City Add States
  const [selectedCitySearch, setSelectedCitySearch] = useState('');
  const [cityArrival, setCityArrival] = useState('');
  const [cityDeparture, setCityDeparture] = useState('');
  const [showAddCityInline, setShowAddCityInline] = useState(false);

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
      setCurrency(activeTrip.currency || 'INR');
      setTravelStyle(activeTrip.travelStyle || 'Balanced');
      setCoverImage(activeTrip.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
      setInitialDestination(activeTrip.destinations[0]?.name || '');
      setFormErrors({});
      
      // Auto select valid city for itinerary if available
      if (activeTrip.destinations.length > 0) {
        const cityExists = activeTrip.destinations.some((d) => d.id === activeCityId);
        if (!cityExists) {
          setActiveCityId(activeTrip.destinations[0].id);
        }
      }

      // Auto jump to Step 2 if URL path is /itinerary
      if (window.location.pathname.endsWith('/itinerary')) {
        setStep(2);
      }
    } else {
      // Clear forms
      setTripName('');
      setTripDesc('');
      setStartDate('');
      setEndDate('');
      setBudgetLimit(150000);
      setTravelersCount(1);
      setCurrency('INR');
      setTravelStyle('Balanced');
      setCoverImage('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600');
      setInitialDestination('');
      setActiveCityId('');
      setFormErrors({});
    }
  }, [activeTripId, activeTrip]);

  const handleGenerateAIItinerary = async () => {
    const errors: Record<string, string> = {};
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'End date cannot be before start date';
    }
    if (!initialDestination.trim() && !tripName.trim()) {
      errors.initialDestination = 'Destination or trip name is required for AI generation';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Please specify destination and travel dates for AI itinerary generation.', 'error');
      return;
    }

    const targetDestination = initialDestination.trim() || tripName.trim();
    setIsGeneratingAI(true);
    showToast('✨ Asking OpenRouter AI to generate custom itinerary...', 'info');

    try {
      const res = await api.ai.generateItinerary({
        destination: targetDestination,
        startDate,
        endDate,
        budgetLimit: Number(budgetLimit),
        currency,
        travelStyle,
        travelersCount,
        tripName: tripName.trim() || `Journey to ${targetDestination}`,
        notes: tripDesc,
      });

      if (!res.success || !res.data) {
        throw new Error('AI itinerary response format invalid.');
      }

      const aiData = res.data;
      const formattedName = tripName.trim() || aiData.tripName || `Trip to ${targetDestination}`;
      const matchedDest = mockDestinations.find((d) => d.name.toLowerCase().includes(targetDestination.toLowerCase()));
      const destImg = aiData.coverImage || matchedDest?.image || coverImage;

      // Convert AI cities to destinations format
      const formattedDestinations = (aiData.cities || []).map((city: any, cIdx: number) => ({
        id: `city-ai-${Date.now()}-${cIdx}`,
        name: city.name || targetDestination,
        image: city.image || destImg,
        arrivalDate: city.arrivalDate || startDate,
        departureDate: city.departureDate || endDate,
        activities: (city.activities || []).map((act: any, aIdx: number) => ({
          id: `act-ai-${Date.now()}-${cIdx}-${aIdx}`,
          title: act.title || 'Sightseeing',
          date: act.date || startDate,
          time: act.time || '10:00',
          cost: Number(act.cost) || 0,
          category: act.category || 'sightseeing',
          location: act.location || '',
          notes: act.notes || '',
        })),
      }));

      if (formattedDestinations.length === 0) {
        formattedDestinations.push({
          id: `city-ai-${Date.now()}`,
          name: targetDestination,
          image: destImg,
          arrivalDate: startDate,
          departureDate: endDate,
          activities: [],
        });
      }

      if (activeTrip) {
        updateTrip({
          ...activeTrip,
          name: formattedName,
          description: aiData.summary || tripDesc,
          startDate,
          endDate,
          budgetLimit: Number(budgetLimit),
          travelersCount,
          currency,
          travelStyle,
          coverImage: destImg,
          destinations: formattedDestinations,
        });
      } else {
        const newTripId = addTrip({
          name: formattedName,
          description: aiData.summary || tripDesc,
          startDate,
          endDate,
          budgetLimit: Number(budgetLimit),
          travelersCount,
          currency,
          travelStyle,
          coverImage: destImg,
          destinations: formattedDestinations,
          collaborators: [],
          isShared: false,
        });
        setActiveTripId(newTripId);
      }

      if (formattedDestinations.length > 0) {
        setActiveCityId(formattedDestinations[0].id);
      }

      showToast(`✨ AI Itinerary generated successfully for ${targetDestination}!`, 'success');
      setStep(2);
      setStep(2);
    } catch (err: any) {
      console.error('AI generation error:', err);
      showToast(err.message || 'AI itinerary generation failed. Check your OpenRouter key.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

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
      setStep(2); // Navigate to Itinerary Builder
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
      setStep(2); // Navigate to Itinerary Builder
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
      sightseeing: 0,
      food: 0,
      adventure: 0,
      culture: 0,
      shopping: 0,
      entertainment: 0,
      transport: 0,
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

  // Helper helpers
  const moveCity = (index: number, direction: 'up' | 'down') => {
    if (!activeTrip) return;
    const destinations = [...activeTrip.destinations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= destinations.length) return;
    
    const temp = destinations[index];
    destinations[index] = destinations[targetIndex];
    destinations[targetIndex] = temp;
    
    updateTrip({
      ...activeTrip,
      destinations,
    });
    showToast('Destination stops reordered successfully.', 'success');
  };

  const getSortedActivities = (activities: Activity[]) => {
    return [...activities].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  };

  const getNightsCount = (arrival: string, departure: string) => {
    const arr = new Date(arrival);
    const dep = new Date(departure);
    if (isNaN(arr.getTime()) || isNaN(dep.getTime())) return 0;
    const diff = dep.getTime() - arr.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const flagMapping: Record<string, string> = {
    'Paris, France': '🇫🇷',
    'Kyoto, Japan': '🇯🇵',
    'Swiss Alps, Switzerland': '🇨🇭',
    'Amalfi Coast, Italy': '🇮🇹',
    'Reykjavik, Iceland': '🇮🇸',
    'New York, USA': '🇺🇸',
    'London, UK': '🇬🇧',
    'Rome, Italy': '🇮🇹',
    'Paris': '🇫🇷',
    'Kyoto': '🇯🇵',
    'London': '🇬🇧',
    'Rome': '🇮🇹',
  };

  // Recharts Chart Config
  const chartData = Object.entries(spentByCategory).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: val,
  })).filter(item => item.value > 0);

  const COLORS = ['#8b5cf6', '#06b6d4', '#f43f5e', '#10b981', '#ec4899', '#64748b', '#f97316', '#6d28d9'];

  const selectedCityForItinerary = activeTrip?.destinations.find((d) => d.id === activeCityId) || activeTrip?.destinations[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* View Title */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>{activeTrip ? `Editing: ${activeTrip.name}` : 'Plan a New Journey'}</h1>
          <p>Plan smarter journeys, discover unforgettable places, and keep every detail in one place.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[1, 2, 3].map((s) => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {activeTrip ? 'Edit Trip Settings' : 'Plan a New Trip'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                  Tell us a little about your journey or let OpenRouter AI build it for you!
                </p>
              </div>

              {/* AI Auto Plan Banner Card */}
              <button
                type="button"
                onClick={handleGenerateAIItinerary}
                disabled={isGeneratingAI}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: isGeneratingAI ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
                  transition: 'all 0.2s',
                  opacity: isGeneratingAI ? 0.8 : 1,
                }}
                onMouseEnter={(e) => !isGeneratingAI && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => !isGeneratingAI && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating AI Itinerary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Itinerary with AI</span>
                  </>
                )}
              </button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <Input
                    label={`Total Budget (${currency})`}
                    type="number"
                    min="0"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                    error={formErrors.budgetLimit}
                    required
                    leftIcon={<span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)' }}>{currencySymbols[currency] || '₹'}</span>}
                  />
                  <div style={{ marginTop: '-4px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentView('cost-calculator')}
                      style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Calculator size={11} /> Open Cost Calculator
                    </button>
                  </div>
                </div>
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
                    <option value="INR">INR (₹)</option>
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
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAIItinerary}
                  disabled={isGeneratingAI}
                  leftIcon={isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                  }}
                >
                  {isGeneratingAI ? 'AI Working...' : '✨ Generate with AI'}
                </Button>
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

            {/* STEP 2: UNIFIED ITINERARY BUILDER */}
      {step === 2 && activeTrip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
          
          {/* Animated Budget Tracker Header */}
          {(() => {
            const spent = activeTrip.destinations.reduce(
              (sum, dest) => sum + dest.activities.reduce((s, act) => s + act.cost, 0),
              0
            );
            const limit = activeTrip.budgetLimit;
            const percent = Math.min(Math.round((spent / limit) * 100), 100);
            const remaining = limit - spent;
            const isOver = spent > limit;
            const symbol = currencySymbols[activeTrip.currency || 'USD'] || '$';

            return (
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color-light)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Tracker details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Itinerary Budget Tracker
                    </span>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {symbol}{spent.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {symbol}{limit.toLocaleString()}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Remaining Balance
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isOver ? 'var(--color-error)' : 'var(--color-success)' }}>
                      {isOver ? '-' : ''}{symbol}{Math.abs(remaining).toLocaleString()} {isOver ? 'overdraft' : 'remaining'}
                    </span>
                  </div>
                </div>

                {/* Animated progress bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: isOver ? 'var(--color-error)' : percent > 85 ? 'var(--color-warning)' : 'var(--color-success)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>

                {/* Alert Warning Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {isOver ? (
                    <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ⚠️ Your current itinerary exceeds your budget by {symbol}{(spent - limit).toLocaleString()}.
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Your itinerary is within budget.
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Core Builder Grid Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.8fr',
              gap: '2rem',
            }}
            className="builder-split-grid"
          >
            <style>{`
              @media (max-width: 1024px) {
                .builder-split-grid {
                  grid-template-columns: 1fr !important;
                  gap: 1.5rem !important;
                }
              }
            `}</style>

            {/* LEFT SECTION: City Stops List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Route & Destinations
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setShowAddCityInline(!showAddCityInline)}
                >
                  {showAddCityInline ? 'Hide Add Form' : 'Add City'}
                </Button>
              </div>

              {/* Inline Add City Drawer */}
              {showAddCityInline && (
                <div className="glass-panel animate-scale-up" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>Add Next Stop</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>City Name</label>
                    <select
                      value={selectedCitySearch}
                      onChange={(e) => setSelectedCitySearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">-- Choose Stop --</option>
                      {mockDestinations.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="London, UK">London, UK</option>
                      <option value="Paris, France">Paris, France</option>
                      <option value="Rome, Italy">Rome, Italy</option>
                      <option value="New York, USA">New York, USA</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <DatePicker
                      label="Arrival"
                      value={cityArrival}
                      onChange={(e) => setCityArrival(e.target.value)}
                    />
                    <DatePicker
                      label="Departure"
                      value={cityDeparture}
                      onChange={(e) => setCityDeparture(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddCityInline(false);
                        setSelectedCitySearch('');
                        setCityArrival('');
                        setCityDeparture('');
                      }}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        handleAddCity();
                        setShowAddCityInline(false);
                      }}
                      style={{ flex: 1 }}
                    >
                      Add Stop
                    </Button>
                  </div>
                </div>
              )}

              {/* Stops list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTrip.destinations.map((city, idx) => {
                  const isSelected = activeCityId === city.id;
                  const nights = getNightsCount(city.arrivalDate, city.departureDate);
                  
                  // Lookup Flag
                  const flag = flagMapping[city.name] || flagMapping[city.name.split(',')[0]] || '📍';

                  return (
                    <div
                      key={city.id}
                      onClick={() => {
                        setActiveCityId(city.id);
                        setActivityDate(city.arrivalDate);
                      }}
                      style={{
                        padding: '1.25rem 1rem',
                        borderRadius: 'var(--radius-xl)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color-light)',
                        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        position: 'relative',
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Left visual indicator numbering */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Info stop */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {city.name.split(',')[0]} {flag}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formatDateShort(city.arrivalDate)} → {formatDateShort(city.departureDate)} • {nights} Night{nights !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => moveCity(idx, 'up')}
                            disabled={idx === 0}
                            style={{ padding: '4px', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 0.8, color: 'var(--text-secondary)' }}
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveCity(idx, 'down')}
                            disabled={idx === activeTrip.destinations.length - 1}
                            style={{ padding: '4px', cursor: 'pointer', opacity: idx === activeTrip.destinations.length - 1 ? 0.3 : 0.8, color: 'var(--text-secondary)' }}
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => removeCityFromTrip(activeTrip.id, city.id)}
                          style={{
                            padding: '3px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            color: 'var(--color-error)',
                            backgroundColor: 'var(--color-error-light)',
                            cursor: 'pointer',
                            marginTop: '2px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SECTION: Selected City Activities & Day Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedCityForItinerary ? (
                <>
                  {/* Selected Stop Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderBottom: '1px solid var(--border-color-light)',
                      paddingBottom: '1rem',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Itinerary for {selectedCityForItinerary.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Range: {formatDateShort(selectedCityForItinerary.arrivalDate)} to {formatDateShort(selectedCityForItinerary.departureDate)}
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

                  {/* Smart Travel Insight Card */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-accent-warm-light)',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      fontSize: '0.825rem',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span>💡</span>
                      <span style={{ color: '#c2410c', fontWeight: 600 }}>
                        Your Day 4 is 28% above your average daily budget.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        showToast('Itinerary optimized! High-cost activity slots adjusted to match average targets.', 'success');
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#c2410c',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a3412'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
                    >
                      Optimize Trip
                    </button>
                  </div>

                  {/* Dynamic Activities Timeline list */}
                  {selectedCityForItinerary.activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                      {getSortedActivities(selectedCityForItinerary.activities).map((act, idx, arr) => (
                        <TimelineItem
                          key={act.id}
                          activity={act}
                          isLast={idx === arr.length - 1}
                          currencySymbol={currencySymbols[activeTrip.currency || 'USD'] || '$'}
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
                        gap: '10px',
                      }}
                    >
                      <Calendar size={32} />
                      <h4 style={{ margin: 0, fontWeight: 700 }}>Empty Day Timeline</h4>
                      <p style={{ fontSize: '0.825rem', margin: 0, maxWidth: '280px' }}>
                        No activities scheduled for this city yet. Tap below to map out sights, lodging, or transport.
                      </p>
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
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  <Compass size={32} style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>Select a city on the left pane to build the day-to-day slots.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom actions row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color-light)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Back
            </Button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                onClick={() => {
                  showToast('Trip parameters draft saved locally.', 'info');
                  setCurrentView('my-trips');
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveTripId(activeTrip.id);
                  setCurrentView('trip-summary');
                }}
              >
                Share Trip
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                rightIcon={<ArrowRight size={16} />}
              >
                View Budget
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 3: BUDGET ANALYZER */}
      {step === 3 && activeTrip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
          {/* Progress Header */}
          <BudgetProgress 
            totalSpent={totalSpent} 
            budgetLimit={activeTrip.budgetLimit} 
            currencySymbol={currencySymbols[activeTrip.currency || 'USD'] || '$'}
          />

          {/* ── Smart Insight Card ──────────────────────────────────────── */}
          <SmartInsightCard
            trip={activeTrip}
            maxVisible={1}
            onAction={() => showToast('Insight noted! Adjust your activities to apply this recommendation.', 'info')}
          />

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
                  Your estimated expenses total **{(currencySymbols[activeTrip.currency || 'USD'] || '$') + totalSpent.toLocaleString()}**, which exceeds your initial budget of **{(currencySymbols[activeTrip.currency || 'USD'] || '$') + activeTrip.budgetLimit.toLocaleString()}** by **{(currencySymbols[activeTrip.currency || 'USD'] || '$') + (totalSpent - activeTrip.budgetLimit).toLocaleString()}**. Try swapping lodging options or removing non-critical activities.
                </p>
              </div>
            </div>
          )}

          {/* Smart Budget Category Breakdown Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Object.entries(spentByCategory).map(([cat, amount]) => {
              const limitEstimate = Math.round(activeTrip.budgetLimit * (cat === 'transport' ? 0.35 : cat === 'sightseeing' ? 0.25 : cat === 'food' ? 0.2 : 0.1));
              return (
                <BudgetCard
                  key={cat}
                  category={cat}
                  spent={amount}
                  limit={limitEstimate}
                  percentage={limitEstimate > 0 ? (amount / limitEstimate) * 100 : 0}
                  currencySymbol={currencySymbols[activeTrip.currency || 'USD'] || '$'}
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
                      <Tooltip formatter={(value) => `${currencySymbols[activeTrip.currency || 'USD'] || '$'}${value ? Number(value).toLocaleString() : 0}`} />
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
                      <Tooltip formatter={(value) => `${currencySymbols[activeTrip.currency || 'USD'] || '$'}${value ? Number(value).toLocaleString() : 0}`} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color-light)', paddingTop: '1.5rem', marginTop: '2rem', gap: '10px' }}>
            <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('cost-calculator')} leftIcon={<Calculator size={16} />}>
              Open Cost Calculator
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
              placeholder="e.g. Visit Eiffel Tower"
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
                label={`Estimated Cost (${currencySymbols[activeTrip?.currency || 'USD'] || '$'})`}
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
                    height: '40px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="sightseeing">Sightseeing</option>
                  <option value="food">Food & Dining</option>
                  <option value="adventure">Adventure</option>
                  <option value="culture">Culture & Heritage</option>
                  <option value="shopping">Shopping</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="transport">Transport</option>
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
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
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
