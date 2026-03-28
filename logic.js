'use strict';

// ─── Region configuration ────────────────────────────────────────────────────
// Representative UTC offsets per region.
const REGION_UTC_OFFSETS = {
  US:   -5,   // US Eastern
  EU:    1,   // Central European Time
  ASIA:  8,   // China / Singapore Standard Time
};

// ─── Audience presets ────────────────────────────────────────────────────────
const AUDIENCE_PRESETS = {
  'mostly-us':   { US: 0.80, EU: 0.10, ASIA: 0.10 },
  'mostly-eu':   { US: 0.10, EU: 0.80, ASIA: 0.10 },
  'mostly-asia': { US: 0.10, EU: 0.10, ASIA: 0.80 },
  'global':      { US: 0.40, EU: 0.35, ASIA: 0.25 },
};

// ─── Platform activity curves ────────────────────────────────────────────────
// Score 0–10 for each local hour (index = hour 0–23).
// Each region now has a distinct curve reflecting real behavioral differences.
const PLATFORM_CURVES = {
  instagram: {
    // US: morning check-in, lunch bump, strong evening 6–9 PM
    US:   [1, 1, 1, 1, 1, 1, 2, 3, 5, 6, 7, 8, 7, 6, 5, 5, 6, 7, 9, 9, 8, 6, 4, 2],
    // EU: heavier morning scroll (commute/coffee), sharp evening 7–9 PM
    EU:   [1, 1, 1, 1, 1, 1, 2, 5, 7, 7, 7, 8, 7, 5, 4, 4, 5, 6, 9, 9, 8, 6, 3, 1],
    // Asia: moderate daytime, peak skews later into evening/night 8–10 PM
    ASIA: [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 4, 5, 6, 8, 10, 9, 7, 4, 2],
  },
  tiktok: {
    // US: after-school spike 3–5 PM, prime evening 7–10 PM
    US:   [1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 5, 7, 8, 8, 8, 9, 10, 9, 7, 4, 2],
    // EU: similar pattern but peak pulls slightly earlier
    EU:   [1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 5, 7, 8, 8, 9, 10, 9, 7, 5, 3, 1],
    // Asia: less after-school spike; heavy evening into late night 7–11 PM
    ASIA: [1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 4, 5, 6, 7, 8, 9, 10, 10, 8, 5, 2],
  },
  twitter: {
    // US: morning news cycle 8–10, midday, evening 6–8 PM
    US:   [1, 1, 1, 1, 1, 2, 3, 5, 7, 8, 8, 8, 7, 7, 7, 7, 7, 8, 8, 7, 6, 5, 3, 2],
    // EU: heavier morning news check 7–9, slightly earlier evening
    EU:   [1, 1, 1, 1, 1, 2, 3, 6, 8, 8, 8, 7, 7, 7, 6, 6, 7, 8, 8, 7, 5, 4, 2, 1],
    // Asia: more concentrated evening; weaker mornings
    ASIA: [1, 1, 1, 1, 1, 1, 2, 4, 6, 7, 7, 7, 7, 6, 6, 6, 7, 8, 9, 8, 6, 5, 3, 1],
  },
  linkedin: {
    // US: 9 AM–5 PM, peak mid-morning and post-lunch
    US:   [0, 0, 0, 0, 0, 0, 1, 3, 7, 9, 9, 8, 8, 8, 8, 7, 5, 3, 1, 0, 0, 0, 0, 0],
    // EU: slightly earlier start (8 AM), similar shape
    EU:   [0, 0, 0, 0, 0, 0, 1, 4, 8, 9, 9, 8, 8, 7, 7, 6, 4, 2, 1, 0, 0, 0, 0, 0],
    // Asia: 9 AM–6 PM with modest after-hours browsing
    ASIA: [0, 0, 0, 0, 0, 0, 1, 3, 7, 9, 9, 8, 8, 8, 8, 8, 7, 4, 2, 1, 0, 0, 0, 0],
  },
};

// ─── Day-of-week multipliers ──────────────────────────────────────────────────
// Replaces the old flat weekend multiplier with per-day granularity.
// Index 0 = Sunday, 1 = Monday … 6 = Saturday (UTC day).
const DAY_MULTIPLIERS = {
  //              Sun   Mon   Tue   Wed   Thu   Fri   Sat
  instagram:  [1.05, 0.88, 0.95, 1.00, 1.00, 1.05, 1.10],
  tiktok:     [1.15, 0.85, 0.88, 0.90, 0.92, 1.10, 1.20],
  twitter:    [0.80, 0.95, 1.00, 1.00, 1.00, 0.90, 0.80],
  linkedin:   [0.20, 1.00, 1.00, 1.00, 1.00, 0.75, 0.25],
};

// ─── Flexibility thresholds ──────────────────────────────────────────────────
// Controls how close to peak the current score must be before saying "post now".
// Exposed as a global so app.js can pass the user's chosen value to getRecommendation.
const FLEXIBILITY_THRESHOLDS = {
  flexible: 0.75,  // Post when within 25% of best upcoming score
  balanced: 0.85,  // Post when within 15% of best (default)
  strict:   0.95,  // Post only within 5% of best
};

const LOOKAHEAD_HOURS = 12;

// ─── Internal helpers ────────────────────────────────────────────────────────

function _regionHour(utcHour, offset) {
  return ((utcHour + offset) % 24 + 24) % 24;
}

// Compute weighted activity score for a given platform + audience preset at a Date.
function _scoreAtDate(platform, audiencePreset, date) {
  const weights = AUDIENCE_PRESETS[audiencePreset];
  const curves  = PLATFORM_CURVES[platform];
  const dayMult = DAY_MULTIPLIERS[platform][date.getUTCDay()];
  const utcHour = date.getUTCHours();

  let score = 0;
  for (const [region, weight] of Object.entries(weights)) {
    const localHour = _regionHour(utcHour, REGION_UTC_OFFSETS[region]);
    score += curves[region][localHour] * weight;
  }
  return score * dayMult;
}

// Walk ±3 hours from the peak to find the contiguous high-activity window.
// Any hour scoring >= 80% of the peak is considered "in the window."
function _findWindowRange(platform, audiencePreset, peakDate, peakScore) {
  if (peakScore === 0) return { startDate: peakDate, endDate: peakDate };

  const MIN_RATIO = 0.80;
  let startDate = new Date(peakDate);
  let endDate   = new Date(peakDate);

  for (let h = 1; h <= 3; h++) {
    const t = new Date(peakDate.getTime() - h * 3_600_000);
    if (_scoreAtDate(platform, audiencePreset, t) / peakScore >= MIN_RATIO) {
      startDate = t;
    } else break;
  }

  for (let h = 1; h <= 3; h++) {
    const t = new Date(peakDate.getTime() + h * 3_600_000);
    if (_scoreAtDate(platform, audiencePreset, t) / peakScore >= MIN_RATIO) {
      endDate = t;
    } else break;
  }

  return { startDate, endDate };
}

function _fmtHour(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns a posting recommendation.
 *
 * @param {string} platform        - Key from PLATFORM_CURVES
 * @param {string} audiencePreset  - Key from AUDIENCE_PRESETS
 * @param {Date}   now             - Current datetime
 * @param {number} [threshold]     - POST_NOW ratio threshold (default: balanced)
 * @returns {{
 *   action: 'POST_NOW'|'WAIT',
 *   hoursToWait: number,
 *   bestWindowRange: string,
 *   currentScore: number,
 *   bestScore: number,
 *   ratio: number,
 * }}
 */
function getRecommendation(platform, audiencePreset, now, threshold) {
  if (threshold === undefined) threshold = FLEXIBILITY_THRESHOLDS.balanced;

  const currentScore = _scoreAtDate(platform, audiencePreset, now);

  let bestScore        = currentScore;
  let bestHoursFromNow = 0;

  for (let h = 1; h <= LOOKAHEAD_HOURS; h++) {
    const futureTime = new Date(now.getTime() + h * 3_600_000);
    const score = _scoreAtDate(platform, audiencePreset, futureTime);
    if (score > bestScore) {
      bestScore        = score;
      bestHoursFromNow = h;
    }
  }

  const ratio   = bestScore > 0 ? currentScore / bestScore : 1;
  const postNow = bestHoursFromNow === 0 || bestScore === 0 || ratio >= threshold;

  const peakDate = new Date(now.getTime() + bestHoursFromNow * 3_600_000);
  const { startDate, endDate } = _findWindowRange(platform, audiencePreset, peakDate, bestScore);

  const startTime      = _fmtHour(startDate);
  const endTime        = _fmtHour(endDate);
  const bestWindowRange = startTime === endTime ? startTime : `${startTime} – ${endTime}`;

  return {
    action:          postNow ? 'POST_NOW' : 'WAIT',  // kept for compat; app.js now uses ratio directly
    hoursToWait:     bestHoursFromNow,                // always the real distance to peak (not clamped)
    bestWindowRange,
    currentScore,
    bestScore,
    ratio,
  };
}
