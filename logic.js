'use strict';

// ─── Region configuration ────────────────────────────────────────────────────
const REGION_UTC_OFFSETS = {
  US:   -5,   // US Eastern
  EU:    1,   // Central European Time
  ASIA:  8,   // China / Singapore Standard Time
};

// ─── Audience presets ─────────────────────────────────────────────────────────
const AUDIENCE_PRESETS = {
  'mostly-us':   { US: 0.80, EU: 0.10, ASIA: 0.10 },
  'mostly-eu':   { US: 0.10, EU: 0.80, ASIA: 0.10 },
  'mostly-asia': { US: 0.10, EU: 0.10, ASIA: 0.80 },
  'global':      { US: 0.40, EU: 0.35, ASIA: 0.25 },
};

// ─── Platform base curves (score 0–10, index = local hour 0–23) ───────────────
const PLATFORM_CURVES = {
  instagram: {
    US:   [1,1,1,1,1,1,2,3,5,6,7,8,7,6,5,5,6,7,9,9,8,6,4,2],
    EU:   [1,1,1,1,1,1,2,5,7,7,7,8,7,5,4,4,5,6,9,9,8,6,3,1],
    ASIA: [1,1,1,1,1,1,2,3,4,5,6,7,6,5,4,4,5,6,8,10,9,7,4,2],
  },
  tiktok: {
    US:   [1,1,1,1,1,1,1,2,3,4,5,5,5,5,7,8,8,8,9,10,9,7,4,2],
    EU:   [1,1,1,1,1,1,1,2,3,4,5,5,5,5,7,8,8,9,10,9,7,5,3,1],
    ASIA: [1,1,1,1,1,1,1,2,3,4,5,5,5,4,5,6,7,8,9,10,10,8,5,2],
  },
  twitter: {
    US:   [1,1,1,1,1,2,3,5,7,8,8,8,7,7,7,7,7,8,8,7,6,5,3,2],
    EU:   [1,1,1,1,1,2,3,6,8,8,8,7,7,7,6,6,7,8,8,7,5,4,2,1],
    ASIA: [1,1,1,1,1,1,2,4,6,7,7,7,7,6,6,6,7,8,9,8,6,5,3,1],
  },
  linkedin: {
    US:   [0,0,0,0,0,0,1,3,7,9,9,8,8,8,8,7,5,3,1,0,0,0,0,0],
    EU:   [0,0,0,0,0,0,1,4,8,9,9,8,8,7,7,6,4,2,1,0,0,0,0,0],
    ASIA: [0,0,0,0,0,0,1,3,7,9,9,8,8,8,8,8,7,4,2,1,0,0,0,0],
  },
  reddit: {
    US:   [1,1,1,1,1,1,2,3,5,6,7,7,7,6,5,5,6,7,8,9,10,9,6,3],
    EU:   [1,1,1,1,1,1,2,4,5,6,7,8,7,6,5,5,6,7,8,9, 9,7,4,2],
    ASIA: [1,1,1,1,1,1,2,3,4,5,6,7,6,5,4,4,5,7,9,10, 9,7,4,2],
  },
};

// ─── Day-of-week multipliers ──────────────────────────────────────────────────
// Index 0 = Sunday … 6 = Saturday (UTC day).
const DAY_MULTIPLIERS = {
  //              Sun   Mon   Tue   Wed   Thu   Fri   Sat
  instagram:  [1.05, 0.88, 0.95, 1.00, 1.00, 1.05, 1.10],
  tiktok:     [1.15, 0.85, 0.88, 0.90, 0.92, 1.10, 1.20],
  twitter:    [0.80, 0.95, 1.00, 1.00, 1.00, 0.90, 0.80],
  linkedin:   [0.20, 1.00, 1.00, 1.00, 1.00, 0.75, 0.25],
  reddit:     [1.15, 0.90, 0.92, 0.95, 0.97, 1.05, 1.20],
};

// ─── Post type → modifier bucket ─────────────────────────────────────────────
// Maps per-platform select value to an internal modifier key.
const POST_TYPE_MOD_MAP = {
  instagram: { reel: 'short_video', story: 'story',       carousel: 'document',     static: 'image_static' },
  tiktok:    { video: 'short_video', photo: 'image_static' },
  twitter:   { text: 'text',        image: 'image_static', video: 'long_video',     thread: 'text' },
  linkedin:  { text_post: 'text',   image_post: 'image_static', doc_post: 'document', video_post: 'long_video' },
  reddit:    { discussion: 'text', meme: 'image_static', question: 'text', promotion: 'image_static' },
};

// ─── Post type hour modifiers ─────────────────────────────────────────────────
// 24-length multiplier arrays applied per local hour (range ~0.80–1.25).
// Stacked multipliers are kept mild so combined effect stays believable.
const POST_TYPE_HOUR_MODS = {
  // Short-form video (Reels, TikTok): evening/night skewed
  short_video: [
    0.85,0.80,0.75,0.75,0.75,0.80, 0.90,0.95,1.00,1.00,1.00,1.00,
    1.00,0.95,0.95,1.00, 1.05,1.10,1.18,1.22,1.22,1.18,1.08,0.92,
  ],
  // Stories: broadly tolerant, slight morning check-in boost
  story: [
    0.95,0.90,0.88,0.88,0.88,0.92, 1.08,1.12,1.12,1.08,1.05,1.00,
    1.00,1.00,1.00,1.00, 1.00,1.00,1.00,0.98,0.95,0.92,0.90,0.88,
  ],
  // Documents / carousels: deliberate daytime browsing
  document: [
    0.80,0.75,0.72,0.72,0.72,0.78, 0.90,1.05,1.15,1.20,1.20,1.15,
    1.12,1.10,1.10,1.05, 0.95,0.90,0.85,0.80,0.78,0.78,0.75,0.75,
  ],
  // Static images / photos: mildly evening-leaning, broadly neutral
  image_static: [
    0.85,0.82,0.80,0.80,0.80,0.85, 0.98,1.05,1.08,1.08,1.05,1.00,
    1.00,1.00,1.00,1.00, 1.05,1.08,1.10,1.08,1.05,0.95,0.88,0.85,
  ],
  // Text posts / threads: morning news and work hours favored
  text: [
    0.82,0.78,0.75,0.75,0.75,0.82, 1.00,1.18,1.22,1.20,1.15,1.08,
    1.02,1.02,0.98,0.95, 0.92,0.90,0.85,0.82,0.80,0.80,0.78,0.78,
  ],
  // Long-form video: midday and early evening (need time to watch)
  long_video: [
    0.78,0.72,0.70,0.70,0.70,0.78, 0.88,1.02,1.10,1.18,1.18,1.12,
    1.10,1.05,1.05,1.05, 1.10,1.15,1.20,1.18,1.10,0.98,0.88,0.80,
  ],
};

// ─── Goal hour modifiers ─────────────────────────────────────────────────────
const GOAL_HOUR_MODS = {
  // Reach: maximise when most people are online → peak-weighted
  reach: [
    0.85,0.80,0.78,0.78,0.78,0.85, 1.00,1.00,1.00,1.00,1.00,1.00,
    1.00,1.00,1.00,1.00, 1.05,1.10,1.15,1.18,1.15,1.08,1.00,0.90,
  ],
  // Engagement: rewards mid-day interactive windows
  engagement: [
    0.85,0.80,0.78,0.78,0.78,0.85, 1.00,1.00,1.00,1.00,1.00,1.02,
    1.08,1.08,1.02,1.00, 1.05,1.10,1.12,1.12,1.08,1.00,0.90,0.85,
  ],
  // Replies: needs active users, not passive late-night scrollers
  replies: [
    0.85,0.80,0.75,0.75,0.75,0.85, 1.00,1.08,1.12,1.12,1.08,1.02,
    1.02,1.02,1.08,1.10, 1.10,1.08,1.05,1.00,0.95,0.88,0.82,0.82,
  ],
  // Clicks: deliberate browsing → daytime / early evening
  clicks: [
    0.75,0.70,0.68,0.68,0.68,0.80, 1.00,1.15,1.20,1.22,1.18,1.15,
    1.12,1.10,1.10,1.05, 1.00,1.00,0.92,0.85,0.82,0.78,0.75,0.72,
  ],
};

// ─── Niche hour modifiers ─────────────────────────────────────────────────────
const NICHE_HOUR_MODS = {
  // Meme: leisure content — evening/night heavy
  meme: [
    0.85,0.78,0.72,0.72,0.72,0.80, 0.92,0.98,1.00,1.00,1.00,1.00,
    1.00,1.00,1.00,1.05, 1.12,1.18,1.22,1.25,1.22,1.15,1.05,0.95,
  ],
  // Personal: broadly balanced, light evening lean
  personal: [
    0.90,0.85,0.82,0.82,0.82,0.88, 1.00,1.00,1.00,1.00,1.00,1.00,
    1.00,1.00,1.00,1.00, 1.05,1.08,1.10,1.10,1.05,1.00,0.92,0.90,
  ],
  // Art: evening creative hours
  art: [
    0.80,0.75,0.72,0.72,0.72,0.80, 0.92,1.00,1.00,1.00,1.00,1.00,
    1.00,1.00,1.00,1.00, 1.08,1.15,1.20,1.22,1.18,1.10,0.98,0.85,
  ],
  // Business: strong work-hours bias, penalise evenings and weekends
  business: [
    0.40,0.35,0.32,0.32,0.32,0.55, 0.88,1.18,1.25,1.25,1.20,1.15,
    1.12,1.18,1.18,1.12, 0.95,0.70,0.48,0.40,0.35,0.35,0.35,0.35,
  ],
};

// ─── Flexibility thresholds ──────────────────────────────────────────────────
const FLEXIBILITY_THRESHOLDS = {
  flexible: 0.75,
  balanced: 0.85,
  strict:   0.95,
};

const LOOKAHEAD_HOURS = 12;

// ─── Internal helpers ────────────────────────────────────────────────────────

function _regionHour(utcHour, offset) {
  return ((utcHour + offset) % 24 + 24) % 24;
}

// Score at a 15-minute-snapped time with linear interpolation between hourly
// curve values. Modifier arrays applied per region's local hour before blending.
function _scoreAtQuarter(platform, audiencePreset, date, modKey, goal, niche) {
  const weights = AUDIENCE_PRESETS[audiencePreset];
  const curves  = PLATFORM_CURVES[platform];
  const dayMult = DAY_MULTIPLIERS[platform][date.getUTCDay()];
  const utcHour = date.getUTCHours();
  const frac    = date.getUTCMinutes() / 60;  // 0.00 / 0.25 / 0.50 / 0.75

  const ptMods = modKey ? POST_TYPE_HOUR_MODS[modKey] : null;
  const gMods  = GOAL_HOUR_MODS[goal]   || null;
  const nMods  = NICHE_HOUR_MODS[niche] || null;

  let score = 0;
  for (const [region, weight] of Object.entries(weights)) {
    const h0 = _regionHour(utcHour, REGION_UTC_OFFSETS[region]);
    const h1 = (h0 + 1) % 24;
    const cv  = curves[region];

    // Interpolate base curve between this quarter-hour and the next
    let s = cv[h0] * (1 - frac) + cv[h1] * frac;

    // Apply modifiers (also interpolated for smooth 15-min transitions)
    if (ptMods) s *= ptMods[h0] * (1 - frac) + ptMods[h1] * frac;
    if (gMods)  s *= gMods[h0]  * (1 - frac) + gMods[h1]  * frac;
    if (nMods)  s *= nMods[h0]  * (1 - frac) + nMods[h1]  * frac;

    score += s * weight;
  }
  return score * dayMult;
}

// Walk ±3 hours (12 quarter-steps each way) from peak to find contiguous window.
function _findWindowRange(platform, audiencePreset, peakDate, peakScore, modKey, goal, niche) {
  if (peakScore === 0) return { startDate: peakDate, endDate: peakDate };
  const MIN_RATIO = 0.80;
  let startDate = new Date(peakDate);
  let endDate   = new Date(peakDate);

  for (let q = 1; q <= 12; q++) {
    const t = new Date(peakDate.getTime() - q * 15 * 60_000);
    if (_scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche) / peakScore >= MIN_RATIO) {
      startDate = t;
    } else break;
  }
  for (let q = 1; q <= 12; q++) {
    const t = new Date(peakDate.getTime() + q * 15 * 60_000);
    if (_scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche) / peakScore >= MIN_RATIO) {
      endDate = t;
    } else break;
  }
  return { startDate, endDate };
}

// Round to nearest 30 min for human-friendly window display.
// Prevents 15-min internal precision from leaking into the UI.
function _fmtRounded(date) {
  const d = new Date(date);
  const m = d.getMinutes();
  if (m < 15)      { d.setMinutes(0,  0, 0); }
  else if (m < 45) { d.setMinutes(30, 0, 0); }
  else             { d.setMinutes(0,  0, 0); d.setHours(d.getHours() + 1); }
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Weekday names used for "beyond tomorrow" labels.
const _WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Return the day prefix for a given date, relative to the user's actual current moment:
//   same local calendar day  →  ''           (omit entirely)
//   next local calendar day  →  'Tomorrow'
//   anything later           →  full weekday name  (e.g. 'Tuesday')
// Uses toLocaleDateString() so the day boundary matches the same locale/tz
// as toLocaleTimeString() used for clock display everywhere else.
function _dayLabel(date, today) {
  const dateStr  = date.toLocaleDateString();
  const todayStr = today.toLocaleDateString();
  if (dateStr === todayStr) return '';

  const tom = new Date(today);
  tom.setDate(tom.getDate() + 1);
  if (dateStr === tom.toLocaleDateString()) return 'Tomorrow';

  return _WEEKDAYS[date.getDay()];
}

// Format a window range with smart, human-relative day labels.
// Always uses the real current moment as the "today" reference so that labels
// remain user-relative even for alternate/skip windows that start in the future.
//
// Rules:
//   today → no prefix           "10:00 PM – 11:30 PM"
//   tomorrow start → Tomorrow   "Tomorrow 8:00 AM – 9:30 AM"
//   today→tomorrow cross        "10:00 PM – Tomorrow 12:00 AM"
//   beyond tomorrow same-day    "Tuesday 8:00 AM – 9:30 AM"
//   beyond tomorrow cross-day   "Tuesday 10:00 PM – Wednesday 12:00 AM"
function _fmtWindowRange(startDate, endDate) {
  const today   = new Date();   // actual current moment — user's reference for "today"
  const s       = _fmtRounded(startDate);
  const e       = _fmtRounded(endDate);
  const sLabel  = _dayLabel(startDate, today);
  const eLabel  = _dayLabel(endDate,   today);
  const sameDay = startDate.toLocaleDateString() === endDate.toLocaleDateString();

  const startPart = sLabel ? `${sLabel} ${s}` : s;

  // Degenerate: start and end round to the same time on the same day
  if (s === e && sameDay) return startPart;

  // Same calendar day: no label needed on the end time
  if (sameDay) return `${startPart} – ${e}`;

  // Cross-day: label the end side only if it carries a non-empty label
  const endPart = eLabel ? `${eLabel} ${e}` : e;
  return `${startPart} – ${endPart}`;
}

// Human-readable duration string for "post within X" note.
function _fmtRemainingDuration(mins) {
  if (mins <= 0) return null;
  if (mins < 60) return mins + ' minute' + (mins === 1 ? '' : 's');
  const h = mins / 60;
  if (h % 1 === 0) return h + ' hour' + (h === 1 ? '' : 's');
  const hFloor = Math.floor(h);
  const mRem   = mins % 60;
  return hFloor + ' hour' + (hFloor === 1 ? '' : 's') + ' ' + mRem + ' minutes';
}

// ─── Public API ──────────────────────────────────────────────────────────────
/**
 * @param {string} platform       - Key from PLATFORM_CURVES
 * @param {string} audiencePreset - Key from AUDIENCE_PRESETS
 * @param {Date}   now
 * @param {number} [threshold]    - POST_NOW ratio threshold (default: balanced)
 * @param {string} [postType]     - Select value e.g. 'reel', 'video', 'text_post'
 * @param {string} [goal]         - 'reach' | 'engagement' | 'replies' | 'clicks'
 * @param {string} [flex]         - 'flexible' | 'balanced' | 'strict' (kept for API compat)
 * @param {string} [niche]        - 'meme' | 'personal' | 'art' | 'business'
 */
function getRecommendation(platform, audiencePreset, now, threshold, postType, goal, flex, niche) {
  if (threshold === undefined) threshold = FLEXIBILITY_THRESHOLDS.balanced;
  postType = postType || '';
  goal     = goal     || 'reach';
  flex     = flex     || 'balanced';   // accepted but no longer drives window size
  niche    = niche    || 'personal';

  const modKey = (POST_TYPE_MOD_MAP[platform] || {})[postType] || null;

  // Snap to nearest 15-min boundary for stability (avoids second-by-second jitter)
  const snapped = new Date(now);
  snapped.setMinutes(Math.floor(snapped.getMinutes() / 15) * 15, 0, 0);

  const currentScore = _scoreAtQuarter(platform, audiencePreset, snapped, modKey, goal, niche);

  // Reference peak over lookahead window — used only to derive the absolute threshold.
  let bestScore = currentScore;
  for (let q = 1; q <= LOOKAHEAD_HOURS * 4; q++) {
    const t = new Date(snapped.getTime() + q * 15 * 60_000);
    const s = _scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche);
    if (s > bestScore) bestScore = s;
  }

  const ratio          = bestScore > 0 ? currentScore / bestScore : 1;
  const postNow        = bestScore === 0 || ratio >= threshold;
  const scoreThreshold = bestScore * threshold;   // absolute score bar

  let hoursToWait     = 0;
  let remainingMins   = 0;
  let firstQual       = 0;   // quarters until window start; 0 when already in a window
  let windowStartDate = new Date(snapped);
  let windowEndDate   = new Date(snapped.getTime() + 15 * 60_000);

  if (postNow) {
    // Case A: already above threshold.
    // Walk forward until the first quarter that drops below scoreThreshold.
    // remainingMins tracks the last qualifying offset so the window end =
    // start of the first failing quarter (= end of last qualifying quarter).
    if (bestScore > 0) {
      for (let q = 1; q <= LOOKAHEAD_HOURS * 4; q++) {
        const t = new Date(snapped.getTime() + q * 15 * 60_000);
        if (_scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche) >= scoreThreshold) {
          remainingMins = q * 15;
        } else {
          break;
        }
      }
    }
    windowStartDate = new Date(snapped);
    // End = start of first failing quarter; minimum = end of the current slot (15 min).
    windowEndDate = new Date(snapped.getTime() + Math.max(remainingMins, 15) * 60_000);

  } else {
    // WAIT: find window start = first future quarter where score >= scoreThreshold.
    firstQual = -1;
    for (let q = 1; q <= LOOKAHEAD_HOURS * 4; q++) {
      const t = new Date(snapped.getTime() + q * 15 * 60_000);
      if (_scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche) >= scoreThreshold) {
        firstQual = q;
        break;
      }
    }

    // Fallback (Case B): theoretically unreachable because the peak quarter always
    // satisfies score >= bestScore*threshold, but guard against degenerate inputs.
    if (firstQual === -1) {
      let peakQ = 1, peakS = -Infinity;
      for (let q = 1; q <= LOOKAHEAD_HOURS * 4; q++) {
        const t = new Date(snapped.getTime() + q * 15 * 60_000);
        const s = _scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche);
        if (s > peakS) { peakS = s; peakQ = q; }
      }
      firstQual = peakQ;
    }

    hoursToWait     = Math.max(1, Math.round(firstQual / 4));
    windowStartDate = new Date(snapped.getTime() + firstQual * 15 * 60_000);

    // Window end = first quarter after t_start where score drops below scoreThreshold.
    // Walk forward from t_start; track the last qualifying quarter index.
    let lastQual = firstQual;
    for (let q = firstQual + 1; q <= LOOKAHEAD_HOURS * 4; q++) {
      const t = new Date(snapped.getTime() + q * 15 * 60_000);
      if (_scoreAtQuarter(platform, audiencePreset, t, modKey, goal, niche) >= scoreThreshold) {
        lastQual = q;
      } else {
        break;
      }
    }
    // t_end = start of the first failing quarter = snapped + (lastQual + 1) * 15 min
    windowEndDate = new Date(snapped.getTime() + (lastQual + 1) * 15 * 60_000);
  }

  const bestWindowRange = _fmtWindowRange(windowStartDate, windowEndDate);
  const remainingLabel  = _fmtRemainingDuration(remainingMins);

  return {
    action:          postNow ? 'POST_NOW' : 'WAIT',
    minutesToWindow: postNow ? 0 : firstQual * 15,
    hoursToWait,
    bestWindowRange,
    windowEndDate,      // raw Date — used by the skip-window feature in app.js
    currentScore,
    bestScore,
    ratio,
    remainingLabel,
  };
}
