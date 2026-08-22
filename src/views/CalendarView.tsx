import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Calendar, Award } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { trips } = useApp();
  // Keep focus on October 2026 since our mock Japan trip is in October 2026
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed, so 9 is October
  const [currentYear, setCurrentYear] = useState(2026);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Quick Calendar Generator (Static mock days generator for October/September 2026)
  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay(); // 0 is Sunday, 4 is Thursday for Oct 2026
    const lastDay = new Date(year, month + 1, 0).getDate(); // 31 for Oct
    const prevLastDay = new Date(year, month, 0).getDate();

    // Fill in previous month's padding days
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        day: prevLastDay - i + 1,
        isCurrentMonth: false,
        dateString: `${year}-${String(month).padStart(2, '0')}-${String(prevLastDay - i + 1).padStart(2, '0')}`,
      });
    }

    // Fill in current month's days
    for (let i = 1; i <= lastDay; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    // Fill in next month's padding days to make grid of 42
    const totalCells = 42;
    const nextDaysNeeded = totalCells - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateString: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getTripsForDate = (dateStr: string) => {
    return trips.filter((trip) => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const current = new Date(dateStr);
      // Set hours to 0 to compare dates only
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      current.setHours(0,0,0,0);

      return current >= start && current <= end;
    });
  };

  const getActivitiesCountForDate = (dateStr: string) => {
    let count = 0;
    trips.forEach((trip) => {
      trip.destinations.forEach((dest) => {
        dest.activities.forEach((act) => {
          if (act.date === dateStr) {
            count++;
          }
        });
      });
    });
    return count;
  };

  const calendarDays = getDaysInMonth(currentMonth, currentYear);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Visual Scheduler</h1>
          <p>Track your trip ranges, arrival timelines, and day-to-day slots on a monthly grid.</p>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="calendar-view-grid">
        <style>{`
          @media (min-width: 1024px) {
            .calendar-view-grid {
              grid-template-columns: 3fr 1fr !important;
            }
          }
        `}</style>

        {/* Left: Monthly Grid */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {months[currentMonth]} {currentYear}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handlePrevMonth}
                style={{
                  display: 'flex',
                  padding: '6px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                style={{
                  display: 'flex',
                  padding: '6px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid Header (Days of week) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color-light)' }}>
            {weekDays.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Grid Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '100px', gap: '1px', backgroundColor: 'var(--border-color-light)', border: '1px solid var(--border-color-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {calendarDays.map((cell, idx) => {
              const activeTrips = getTripsForDate(cell.dateString);
              const activityCount = getActivitiesCountForDate(cell.dateString);

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: cell.isCurrentMonth ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    overflow: 'hidden',
                  }}
                >
                  {/* Day Number */}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {cell.day}
                  </span>

                  {/* Highlight bar if active */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                    {activeTrips.map((trip) => (
                      <div
                        key={trip.id}
                        title={`${trip.name} - ${activityCount} activities`}
                        style={{
                          backgroundColor: trip.id === 'trip-1' ? 'var(--color-primary-light)' : 'var(--color-accent-warm-light)',
                          color: trip.id === 'trip-1' ? 'var(--color-primary-hover)' : '#92400e',
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          borderLeft: trip.id === 'trip-1' ? '3px solid var(--color-primary)' : '3px solid var(--color-accent-warm)',
                        }}
                      >
                        {trip.name.substring(0, 10)}..
                        {activityCount > 0 && ` (${activityCount})`}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Agenda List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Award size={18} color="var(--color-primary)" /> Calendar Legend
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Japan Autumn Trip</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--color-accent-warm)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Amalfi Romance Trip</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-primary)" /> Sync Utilities
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Export your VoyageIQ timelines directly into Google Calendar, Apple Calendar, or Outlook for off-line itinerary synchronization.
            </p>
            <button
              onClick={() => alert('Synced with Google Calendar!')}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            >
              Sync Calendar feeds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
