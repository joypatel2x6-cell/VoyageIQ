/**
 * SmartInsightCard
 * ─────────────────────────────────────────────────────────────────────────────
 * A reusable card that analyses the given trip using the rule-based insight
 * engine and surfaces the most relevant recommendation.
 *
 * Props
 * ─────
 * trip         — The Trip to analyse. The card re-runs analysis whenever this
 *                object reference changes (useMemo-based, reactive).
 * maxVisible   — How many insights to show before a "See more" toggle.
 *                Defaults to 1 (single top-priority card).
 * compact      — Renders a smaller version without the action row (e.g. for
 *                dashboard widgets).
 * onAction     — Optional callback when "Apply Recommendation" is clicked.
 *                Receives the InsightResult. The engine-supplied `apply()`
 *                thunk is called first if present.
 * className    — Extra CSS class for the outer wrapper.
 *
 * AI-Readiness Note
 * ─────────────────
 * The component uses the async `analyzeTrip()` function via a useEffect →
 * useState pattern. When the engine is upgraded to hit a real API, the UI
 * will automatically show a loading skeleton and re-render on resolution —
 * no changes to this component required.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Trip } from '../data/mockData';
import { analyzeTrip, type InsightResult, type InsightPriority } from '../lib/insightEngine';
import { Sparkles, TrendingDown, ChevronLeft, ChevronRight, RefreshCw, Lightbulb, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Priority → visual config
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<InsightPriority, {
  border: string;
  headerBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  label: string;
  icon: React.ReactNode;
}> = {
  critical: {
    border: 'rgba(239,68,68,0.35)',
    headerBg: 'rgba(239,68,68,0.08)',
    iconColor: '#ef4444',
    badgeBg: 'rgba(239,68,68,0.12)',
    badgeColor: '#ef4444',
    label: 'Action Required',
    icon: <AlertTriangle size={14} />,
  },
  warning: {
    border: 'rgba(245,158,11,0.35)',
    headerBg: 'rgba(245,158,11,0.07)',
    iconColor: '#f59e0b',
    badgeBg: 'rgba(245,158,11,0.12)',
    badgeColor: '#f59e0b',
    label: 'Heads Up',
    icon: <AlertTriangle size={14} />,
  },
  info: {
    border: 'rgba(6,182,212,0.3)',
    headerBg: 'rgba(6,182,212,0.06)',
    iconColor: '#06b6d4',
    badgeBg: 'rgba(6,182,212,0.1)',
    badgeColor: '#06b6d4',
    label: 'Insight',
    icon: <Info size={14} />,
  },
  success: {
    border: 'rgba(16,185,129,0.3)',
    headerBg: 'rgba(16,185,129,0.06)',
    iconColor: '#10b981',
    badgeBg: 'rgba(16,185,129,0.1)',
    badgeColor: '#10b981',
    label: 'All Good',
    icon: <CheckCircle2 size={14} />,
  },
  tip: {
    border: 'rgba(139,92,246,0.3)',
    headerBg: 'rgba(139,92,246,0.07)',
    iconColor: '#8b5cf6',
    badgeBg: 'rgba(139,92,246,0.1)',
    badgeColor: '#8b5cf6',
    label: 'Smart Tip',
    icon: <Lightbulb size={14} />,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────
const InsightSkeleton: React.FC = () => (
  <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden' }}>
    <div style={{ padding: '0.85rem 1.1rem', backgroundColor: 'var(--bg-tertiary)', display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--bg-primary)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: 160, height: 14, borderRadius: 6, backgroundColor: 'var(--bg-primary)', animation: 'pulse 1.5s infinite' }} />
    </div>
    <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', height: 12, borderRadius: 6, backgroundColor: 'var(--bg-tertiary)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: '85%', height: 12, borderRadius: 6, backgroundColor: 'var(--bg-tertiary)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: '72%', height: 12, borderRadius: 6, backgroundColor: 'var(--bg-tertiary)', animation: 'pulse 1.5s infinite' }} />
    </div>
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Single insight card
// ─────────────────────────────────────────────────────────────────────────────
interface SingleCardProps {
  insight: InsightResult;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
  onAction?: (insight: InsightResult) => void;
  compact: boolean;
  currencySymbol: string;
}

const SingleInsightCard: React.FC<SingleCardProps> = ({
  insight, index, total, onPrev, onNext, onDismiss, onAction, compact, currencySymbol,
}) => {
  const cfg = PRIORITY_CONFIG[insight.priority];
  const [applied, setApplied] = useState(false);

  const handleApply = useCallback(() => {
    if (insight.apply) insight.apply();
    setApplied(true);
    onAction?.(insight);
    setTimeout(() => setApplied(false), 2500);
  }, [insight, onAction]);

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-xl)',
      border: `1px solid ${cfg.border}`,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      boxShadow: `0 2px 12px ${cfg.border}`,
    }}>
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: cfg.headerBg,
        padding: '0.8rem 1.1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${cfg.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sparkle icon — always shows VoyageIQ branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color={cfg.iconColor} />
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: cfg.iconColor, letterSpacing: '0.01em' }}>
              VoyageIQ Smart Insight
            </span>
          </div>
          {/* Priority badge */}
          <span style={{
            fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 'var(--radius-full)',
            backgroundColor: cfg.badgeBg, color: cfg.badgeColor,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Pagination dots / counter */}
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={onPrev} disabled={index === 0}
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={12} />
              </button>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 28, textAlign: 'center' }}>
                {index + 1}/{total}
              </span>
              <button onClick={onNext} disabled={index === total - 1}
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
          {/* Dismiss */}
          <button onClick={onDismiss}
            style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', backgroundColor: 'transparent', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Card Body ───────────────────────────────────────────────────── */}
      <div style={{ padding: compact ? '0.9rem 1.1rem' : '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>

        {/* Insight title */}
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {insight.title}
        </h4>

        {/* Message */}
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {insight.message}
        </p>

        {!compact && (
          <>
            {/* Divider */}
            <div style={{ height: 1, backgroundColor: 'var(--border-color-light)' }} />

            {/* Recommended Action */}
            <div>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Recommended Action
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}>
                {insight.action}
              </p>
            </div>

            {/* Potential saving */}
            {insight.potentialSaving > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.5rem 0.8rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <TrendingDown size={14} color="#10b981" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>
                  Potential Saving: {currencySymbol}{insight.potentialSaving.toLocaleString()}
                </span>
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={handleApply}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '0.6rem 1.25rem',
                fontSize: '0.825rem', fontWeight: 800,
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${applied ? 'rgba(16,185,129,0.5)' : cfg.border}`,
                backgroundColor: applied ? 'rgba(16,185,129,0.1)' : cfg.headerBg,
                color: applied ? '#10b981' : cfg.iconColor,
                cursor: 'pointer',
                transition: 'all 0.25s',
                width: '100%',
              }}
              onMouseEnter={e => { if (!applied) { e.currentTarget.style.backgroundColor = cfg.badgeBg; } }}
              onMouseLeave={e => { if (!applied) { e.currentTarget.style.backgroundColor = cfg.headerBg; } }}
            >
              {applied
                ? <><CheckCircle2 size={15} /> Recommendation Applied!</>
                : <><Sparkles size={15} /> Apply Recommendation</>
              }
            </button>
          </>
        )}

        {/* Compact mode: just the action button */}
        {compact && insight.action && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
            💡 {insight.action.split('.')[0]}.
          </div>
        )}
      </div>

      {/* Rule-based label — honest about the technology */}
      {!compact && (
        <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
            ⚙️ Rule-based analysis · Not AI-generated
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Public Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SmartInsightCardProps {
  trip: Trip;
  /** Max insights before "see all" — default 1 */
  maxVisible?: number;
  /** Compact mode for sidebar/widget usage */
  compact?: boolean;
  /** Callback when Apply is clicked */
  onAction?: (insight: InsightResult) => void;
  /** Extra wrapper style */
  style?: React.CSSProperties;
}

export const SmartInsightCard: React.FC<SmartInsightCardProps> = ({
  trip,
  maxVisible = 1,
  compact = false,
  onAction,
  style,
}) => {
  const [insights, setInsights]     = useState<InsightResult[]>([]);
  const [loading, setLoading]       = useState(true);
  const [current, setCurrent]       = useState(0);
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [showAll, setShowAll]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Currency symbol from trip
  const sym = trip.currency === 'INR' ? '₹' : '$';

  // Run analysis whenever trip data changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    analyzeTrip(trip).then(results => {
      if (!cancelled) {
        setInsights(results);
        setCurrent(0);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [trip]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const results = await analyzeTrip(trip);
    setInsights(results);
    setDismissed(new Set());
    setCurrent(0);
    setRefreshing(false);
  };

  const visible = insights.filter(i => !dismissed.has(i.id));
  const shown   = showAll ? visible : visible.slice(0, maxVisible);

  if (loading) return <InsightSkeleton />;

  if (visible.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 10, ...style }}>
        <CheckCircle2 size={18} color="#10b981" />
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>No issues detected</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Your trip plan looks good! All checks passed.</div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{ marginLeft: 'auto', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600 }}>
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Single-card mode (maxVisible = 1, paginated)
  if (maxVisible === 1 && !showAll) {
    const validIndex = Math.min(current, visible.length - 1);
    const insight    = visible[validIndex];
    if (!insight) return null;

    return (
      <div style={style}>
        <SingleInsightCard
          insight={insight}
          index={validIndex}
          total={visible.length}
          onPrev={() => setCurrent(v => Math.max(0, v - 1))}
          onNext={() => setCurrent(v => Math.min(visible.length - 1, v + 1))}
          onDismiss={() => {
            setDismissed(prev => new Set([...prev, insight.id]));
            setCurrent(v => Math.max(0, v - 1));
          }}
          onAction={onAction}
          compact={compact}
          currencySymbol={sym}
        />
        {/* Refresh + dot indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {visible.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{ width: i === validIndex ? 16 : 6, height: 6, borderRadius: 3, border: 'none', backgroundColor: i === validIndex ? 'var(--color-primary)' : 'var(--bg-tertiary)', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }} />
            ))}
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-light)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Re-analyse
          </button>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  // Multi-card stacked mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', ...style }}>
      {shown.map((insight, i) => (
        <SingleInsightCard
          key={insight.id}
          insight={insight}
          index={i}
          total={shown.length}
          onPrev={() => {}}
          onNext={() => {}}
          onDismiss={() => setDismissed(prev => new Set([...prev, insight.id]))}
          onAction={onAction}
          compact={compact}
          currencySymbol={sym}
        />
      ))}
      {!showAll && visible.length > maxVisible && (
        <button onClick={() => setShowAll(true)}
          style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
          + {visible.length - maxVisible} more insight{visible.length - maxVisible !== 1 ? 's' : ''}
        </button>
      )}
      {showAll && visible.length > maxVisible && (
        <button onClick={() => setShowAll(false)}
          style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Show less
        </button>
      )}
    </div>
  );
};
