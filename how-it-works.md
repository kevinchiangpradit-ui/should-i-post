# How It Works — Should I Post Now?

**URL:** https://shouldipostnow.com/how-it-works.html  
**See also:** https://shouldipostnow.com/

---

## Overview

The tool assigns a numeric activity score to each 15-minute interval across the day. Scores are platform-specific and adjusted by audience region, post type, and goal. The current score is compared against the best available score in the next 12 hours to produce a normalised ratio, which determines the verdict.

---

## Scoring model

### Activity curves

Each platform (Instagram, TikTok, Twitter/X, LinkedIn, Reddit) has a distinct activity curve representing typical audience engagement patterns throughout the day. Curves are weighted by:

- **Audience region:** US, Europe, Asia, Mixed Global
- **Post type:** e.g. Reel vs. Static on Instagram; Video vs. Text on LinkedIn
- **Goal:** Reach, Engagement, Replies, Clicks

### Score normalisation

```
bestScore = max(score) over next 12 hours from now
ratio     = currentScore / bestScore
```

`bestScore` is recomputed each render and each 60-second auto-refresh.

---

## Decision logic

```
POST_NOW  if  ratio >= threshold
SOON      if  ratio < threshold  AND  minutesToNextWindow <= 120
WAIT      otherwise
```

**Thresholds by timing setting:**

| Setting | Threshold |
|---------|-----------|
| Good enough (flexible) | 0.80 |
| Balanced | 0.90 |
| Best possible (strict) | 0.95 |

---

## Next window search

When the verdict is WAIT, the tool scans the next 24 hours at 15-minute intervals to find the earliest slot where:

```
scoreAtSlot / bestScoreFromSlot(12h lookahead) >= threshold
```

This forward-validation step ensures that the suggested window will itself trigger POST_NOW when it arrives. Windows that would not qualify on arrival are skipped.

---

## Just-missed detection

If the activity score 30 minutes ago met the POST_NOW threshold but the current score does not, a "just missed peak" reason variant is shown. This informs the user they were recently in a strong window.

---

## Reason line system

The reason message is selected by a combination of state, just-missed flag, and timing strictness:

| Context | Trigger condition |
|---------|------------------|
| `reason_now` | state = NOW |
| `reason_peak_soon` | state = SOON |
| `reason_just_missed` | state ≠ NOW AND score 30 min ago was POST_NOW quality |
| `reason_wait` | state = WAIT, current level low or very low |
| `reason_mid` | state = WAIT, current level medium or high |

Timing strictness pins a variant index: flexible → 0, strict → 3, balanced rotates 1–2 by 15-min clock tick.

---

## Activity chart

12 bars, one per 15-minute slot covering the last 3 hours. Bar height formula:

```
pct = max(round((score / bestScore) * 90 - 30), 2)
```

This maps ~50% of best → ~15% bar height, 100% of best → ~60% bar height. Bars animate with `cubic-bezier(0.4, 0, 0.2, 1)` easing when inputs change. Respects `prefers-reduced-motion`.

---

## Auto-refresh

Rerenders every 60 seconds. All state is derived from the current wall-clock time — no persistence required.

---

## Execution sequence

1. User sets inputs via dropdowns
2. Time is snapped to nearest 15-minute boundary
3. Current slot is scored; `bestScore` is computed over next 12 hours
4. POST_NOW threshold is evaluated → verdict assigned
5. If WAIT: next 24 hours scanned for first validated qualifying window
6. `minutesToWindow` derived → SOON check applied
7. Just-missed flag computed (30-minute lookback)
8. Reason line selected
9. Activity chart updated (DOM mutation with CSS transition)
10. Result card rendered with verdict, reason, and window details

---

## Limitations

- Activity patterns are generalised per platform and region — not derived from the user's actual follower data
- No integration with any social platform API
- Static patterns; does not reflect real-time events, viral moments, or algorithmic changes
- Accuracy decreases for niche audiences or atypical posting schedules
- All computation runs in the browser; no server-side logic or data
