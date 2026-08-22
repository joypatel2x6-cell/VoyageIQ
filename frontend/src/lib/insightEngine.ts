/**
 * VoyageIQ Insight Engine
 * ───────────────────────────────────────────────────────────────────────────
 * Rule-based trip analysis that generates actionable recommendations.
 *
 * ARCHITECTURE NOTE:
 * This module is intentionally designed to be AI-integration-ready.
 * The `analyzeTrip()` function returns a `Promise<InsightResult[]>` so that
 * a future implementation can transparently swap the synchronous rule logic
 * for an async LLM or backend API call — zero changes to call sites.
 *
 * To integrate an AI backend later:
 *   1. Replace the body of `analyzeTrip()` with an API call.
 *   2. Keep the `InsightResult` shape identical.
 *   3. All UI components consuming this function will work unchanged.
 */

import type { Trip, Activity } from '../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
//  Public Types
// ─────────────────────────────────────────────────────────────────────────────

export type InsightPriority = 'critical' | 'warning' | 'info' | 'success' | 'tip';
export type InsightCategory =
  | 'budget'
  | 'pace'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'general';

export interface InsightResult {
  /** Stable identifier for this insight — useful for dismissal tracking */
  id: string;

  priority: InsightPriority;
  category: InsightCategory;

  /** One-liner headline shown in the card header */
  title: string;

  /** Full explanatory message shown in the card body */
  message: string;

  /** Short action label shown as "Recommended Action" */
  action: string;

  /** Estimated saving in trip currency; 0 if not applicable */
  potentialSaving: number;

  /**
   * Optional thunk the UI can call when "Apply Recommendation" is clicked.
   * Return `true` if the action mutated app state (triggers a toast).
   */
  apply?: () => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function totalSpend(trip: Trip): number {
  return trip.destinations.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + a.cost, 0),
    0,
  );
}

function getDays(start: string, end: string): number {
  return Math.max(
    1,
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000),
  );
}

/**
 * Groups activities into calendar-day buckets and returns a map of
 * { dateString → activities[] }.
 */
function activitiesByDay(trip: Trip): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const dest of trip.destinations) {
    for (const act of dest.activities) {
      const key = act.date || dest.arrivalDate;
      const bucket = map.get(key) ?? [];
      bucket.push(act);
      map.set(key, bucket);
    }
  }
  return map;
}

function currencySymbol(trip: Trip): string {
  return trip.currency === 'INR' ? '₹' : '$';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Rule definitions
//  Each rule is a pure function (Trip → InsightResult | null).
//  Rules are evaluated in priority order; the engine surfaces all that match.
// ─────────────────────────────────────────────────────────────────────────────

type Rule = (trip: Trip) => InsightResult | null;

/** RULE 1 — Budget exceeded */
const ruleOverBudget: Rule = (trip) => {
  const spend = totalSpend(trip);
  if (spend <= trip.budgetLimit) return null;

  const sym  = currencySymbol(trip);
  const over = spend - trip.budgetLimit;
  const days = getDays(trip.startDate, trip.endDate);
  const savingTarget = Math.min(over, Math.round(spend * 0.12)); // Suggest trimming ~12%

  return {
    id: 'over-budget',
    priority: 'critical',
    category: 'budget',
    title: 'Budget Exceeded',
    message: `Your trip is ${sym}${over.toLocaleString()} over budget. Total spend is ${sym}${spend.toLocaleString()} against a limit of ${sym}${trip.budgetLimit.toLocaleString()}. Review high-cost activities to bring the plan back within range.`,
    action: `Remove or replace the highest-cost activity per city to recover ~${sym}${savingTarget.toLocaleString()} across ${days} days.`,
    potentialSaving: savingTarget,
  };
};

/** RULE 2 — Approaching budget (>90%) */
const ruleNearBudget: Rule = (trip) => {
  const spend = totalSpend(trip);
  const pct   = spend / trip.budgetLimit;
  if (pct <= 0.90 || pct >= 1.0) return null; // handled by over-budget rule

  const sym       = currencySymbol(trip);
  const remaining = trip.budgetLimit - spend;
  const saving    = Math.round(remaining * 0.5);

  return {
    id: 'near-budget',
    priority: 'warning',
    category: 'budget',
    title: 'Approaching Budget Limit',
    message: `Your trip is approaching the budget limit — you've used ${Math.round(pct * 100)}% of your ${sym}${trip.budgetLimit.toLocaleString()} budget. Only ${sym}${remaining.toLocaleString()} remains. Consider auditing lower-priority activities before adding anything new.`,
    action: `Swap one "nice-to-have" activity per city for a free or low-cost alternative to preserve ${sym}${saving.toLocaleString()} of buffer.`,
    potentialSaving: saving,
  };
};

/** RULE 3 — Healthy budget (≤60%) */
const ruleHealthyBudget: Rule = (trip) => {
  const spend = totalSpend(trip);
  const pct   = spend / trip.budgetLimit;
  if (pct > 0.60 || spend === 0) return null;

  const sym  = currencySymbol(trip);
  const left = trip.budgetLimit - spend;

  return {
    id: 'healthy-budget',
    priority: 'success',
    category: 'budget',
    title: 'Healthy Budget Range',
    message: `Your itinerary is currently within a healthy budget range — you've only used ${Math.round(pct * 100)}% of your ${sym}${trip.budgetLimit.toLocaleString()} budget. You have ${sym}${left.toLocaleString()} available to enhance the experience.`,
    action: `Use the remaining budget to add a memorable experience — a fine-dining dinner or a day trip typically costs ${sym}${Math.round(left * 0.3).toLocaleString()}–${sym}${Math.round(left * 0.6).toLocaleString()}.`,
    potentialSaving: 0,
  };
};

/** RULE 4 — A single day is unusually expensive (> 2× average daily spend) */
const ruleHighSpendDay: Rule = (trip) => {
  const days  = getDays(trip.startDate, trip.endDate);
  const spend = totalSpend(trip);
  const avgDaily = spend / days;
  if (avgDaily === 0) return null;

  const sym    = currencySymbol(trip);
  const byDay  = activitiesByDay(trip);
  let worstDay = '';
  let worstAmt = 0;

  for (const [day, acts] of byDay) {
    const dayTotal = acts.reduce((s, a) => s + a.cost, 0);
    if (dayTotal > worstAmt) { worstAmt = dayTotal; worstDay = day; }
  }

  if (!worstDay || worstAmt < avgDaily * 2.0) return null;

  const dayLabel = new Date(worstDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const excess   = Math.round(worstAmt - avgDaily);
  const saving   = Math.round(excess * 0.4);

  return {
    id: 'high-spend-day',
    priority: 'warning',
    category: 'budget',
    title: 'High-Spend Day Detected',
    message: `${dayLabel} is significantly above your average daily spending (${sym}${Math.round(worstAmt).toLocaleString()} vs. avg ${sym}${Math.round(avgDaily).toLocaleString()}). Concentrating too much spend in one day can strain the overall budget.`,
    action: `Move one costly activity from ${dayLabel} to a lighter day, or replace it with a free/low-cost alternative to redistribute ~${sym}${saving.toLocaleString()}.`,
    potentialSaving: saving,
  };
};

/** RULE 5 — A day has too many activities (> 4) */
const ruleBusyDay: Rule = (trip) => {
  const byDay = activitiesByDay(trip);
  let busiest = '';
  let maxCount = 0;

  for (const [day, acts] of byDay) {
    if (acts.length > maxCount) { maxCount = acts.length; busiest = day; }
  }

  if (!busiest || maxCount <= 4) return null;

  const dayLabel = new Date(busiest).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const sym      = currencySymbol(trip);
  const byDay2   = activitiesByDay(trip);
  const dayActs  = byDay2.get(busiest) ?? [];
  const costOfMovable = dayActs.sort((a, b) => b.cost - a.cost)[maxCount - 1]?.cost ?? 0;

  return {
    id: 'busy-day',
    priority: 'info',
    category: 'pace',
    title: 'Busy Day Schedule',
    message: `Your ${dayLabel} schedule is very busy with ${maxCount} activities. Over-scheduling leads to rushed experiences and travel fatigue — research shows most travellers enjoy 3–4 activities per day for the best experience.`,
    action: `Move one activity from ${dayLabel} to an adjacent lighter day. Shifting "${dayActs[maxCount - 1]?.title ?? 'an activity'}" could save ~${sym}${Math.round(costOfMovable * 0.1).toLocaleString()} in transport/time costs.`,
    potentialSaving: Math.round(costOfMovable * 0.1),
  };
};

/** RULE 6 — Long transport gap between consecutive cities (> 6h implied by cost) */
const ruleLongTransit: Rule = (trip) => {
  if (trip.destinations.length < 2) return null;

  const sym = currencySymbol(trip);
  let highTransitFrom = '';
  let highTransitTo   = '';
  let highTransitCost = 0;

  for (let i = 0; i < trip.destinations.length - 1; i++) {
    const from = trip.destinations[i];
    const to   = trip.destinations[i + 1];

    // Heuristic: find explicit "transport" activities with cost > ₹5000/$60
    const transitActs = from.activities.filter(
      a => a.category === 'transport' && a.cost > 5000,
    );

    if (transitActs.length > 0) {
      const maxCost = Math.max(...transitActs.map(a => a.cost));
      if (maxCost > highTransitCost) {
        highTransitCost = maxCost;
        highTransitFrom = from.name;
        highTransitTo   = to.name;
      }
    }
  }

  // Also check if two adjacent cities are far apart by date gap > 1 day
  if (!highTransitFrom) {
    for (let i = 0; i < trip.destinations.length - 1; i++) {
      const from = trip.destinations[i];
      const to   = trip.destinations[i + 1];
      const gap  = getDays(from.departureDate, to.arrivalDate);
      if (gap > 1) {
        highTransitFrom = from.name;
        highTransitTo   = to.name;
        highTransitCost = 0;
      }
    }
  }

  if (!highTransitFrom) return null;

  const saving = Math.round(highTransitCost * 0.25);

  return {
    id: 'long-transit',
    priority: 'tip',
    category: 'transport',
    title: 'Review Transport Between Cities',
    message: `The journey from ${highTransitFrom} to ${highTransitTo} involves significant travel time and cost${highTransitCost > 0 ? ` (${sym}${highTransitCost.toLocaleString()})` : ''}. Long transit legs reduce sightseeing time and add fatigue. Consider whether the transport mode is optimal.`,
    action: `Compare train vs. flight vs. bus options for ${highTransitFrom}→${highTransitTo}. Booking 4–6 weeks ahead or choosing off-peak travel could save up to ${sym}${saving > 0 ? saving.toLocaleString() : '2,000–5,000'}.`,
    potentialSaving: saving,
  };
};

/** RULE 7 — No activities planned yet */
const ruleEmptyItinerary: Rule = (trip) => {
  const total = trip.destinations.reduce((s, d) => s + d.activities.length, 0);
  if (total > 0) return null;

  return {
    id: 'empty-itinerary',
    priority: 'info',
    category: 'general',
    title: 'Itinerary Not Yet Planned',
    message: `Your trip has no activities scheduled yet. A detailed itinerary helps you stay on budget, avoid overbooking, and spot gaps in your travel days early.`,
    action: `Start with 2–3 must-see landmarks per city, then fill in meals and transport. Use "Things to Do" to discover popular activities at each destination.`,
    potentialSaving: 0,
  };
};

/** RULE 8 — Missing accommodation in a multi-night city */
const ruleMissingAccommodation: Rule = (trip) => {
  for (const dest of trip.destinations) {
    const nights = getDays(dest.arrivalDate, dest.departureDate);
    const hasAccom = dest.activities.some(a => a.category === 'accommodation');
    if (nights >= 1 && !hasAccom) {
      const sym    = currencySymbol(trip);
      const saving = Math.round(nights * 3000 * 0.15); // 15% of avg hotel cost

      return {
        id: `no-accom-${dest.id}`,
        priority: 'warning',
        category: 'accommodation',
        title: `No Accommodation in ${dest.name}`,
        message: `You're planning ${nights} night${nights !== 1 ? 's' : ''} in ${dest.name} but no accommodation is budgeted. Unplanned last-minute bookings typically cost 30–50% more than advance reservations.`,
        action: `Add a hotel or rental to your ${dest.name} itinerary. Booking now vs. last-minute can save up to ${sym}${saving.toLocaleString()} per stay.`,
        potentialSaving: saving,
      };
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Ordered rule pipeline — highest priority first
// ─────────────────────────────────────────────────────────────────────────────

const RULES: Rule[] = [
  ruleOverBudget,
  ruleNearBudget,
  ruleHighSpendDay,
  ruleBusyDay,
  ruleMissingAccommodation,
  ruleLongTransit,
  ruleHealthyBudget,
  ruleEmptyItinerary,
];

// ─────────────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse a trip and return all matching insights, sorted by priority.
 *
 * Designed as async so a future AI/backend implementation can be dropped in
 * without changing any call sites.
 */
export async function analyzeTrip(trip: Trip): Promise<InsightResult[]> {
  // Rule-based analysis (synchronous, wrapped in Promise for API parity)
  const results = RULES.map(rule => rule(trip)).filter((r): r is InsightResult => r !== null);

  // Sort: critical → warning → info → success → tip
  const ORDER: Record<InsightPriority, number> = {
    critical: 0, warning: 1, info: 2, success: 3, tip: 4,
  };
  return results.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

/**
 * Synchronous variant for cases where async is not convenient.
 * Returns the same results as analyzeTrip.
 */
export function analyzeTripSync(trip: Trip): InsightResult[] {
  const results = RULES.map(rule => rule(trip)).filter((r): r is InsightResult => r !== null);
  const ORDER: Record<InsightPriority, number> = {
    critical: 0, warning: 1, info: 2, success: 3, tip: 4,
  };
  return results.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}
