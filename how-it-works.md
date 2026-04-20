# How It Works — Should I Post Now?

**shouldipostnow.com/how-it-works.html**

---

## Definition

The tool assigns a numeric activity score (range 0–~15) to each 15-minute interval of the day. The current score is compared to the maximum score available in the next 12 hours. The ratio determines the verdict.

---

## Scoring model

### Activity curves

Each of the 5 supported platforms has a distinct activity curve representing typical audience behaviour across a 24-hour day. Curves are adjusted by 4 factors:

1. **Audience region:** US, Europe, Asia, Mixed Global
2. **Post type:** e.g. Reel vs. Static on Instagram; Video vs. Text post on LinkedIn
3. **Goal:** Reach, Engagement, Replies, Clicks
4. **Time of day:** scores peak at typical high-activity windows (e.g. weekday mornings for LinkedIn, evenings for Instagram Reels/US)

### Normalisation

```
bestScore = max(score) over next 12 hours from current time
ratio     = currentScore / bestScore
```

`bestScore` is recomputed every 60 seconds.

---

## Decision logic

```
POST_NOW  →  ratio >= threshold
SOON      →  ratio < threshold  AND  minutesToNextWindow <= 120
WAIT      →  all other cases
```

### Thresholds

| Timing setting | Threshold | Meaning |
|----------------|-----------|---------|
| Good enough | 0.80 | Score is ≥ 80% of today's best |
| Balanced | 0.90 | Score is ≥ 90% of today's best |
| Best possible | 0.95 | Score is ≥ 95% of today's best |

---

## Next window search

When verdict is WAIT, the tool scans the next 24 hours at 15-minute resolution to find the first slot satisfying:

```
scoreAtSlot / bestScoreFromSlot(12h lookahead) >= threshold
```

**Forward-validation:** each candidate is tested against its own 12-hour best score at the time it would occur. This prevents suggesting a window that looks good now but falls short of threshold when it actually arrives.

---

## Just-missed detection

```
pastScore = score at (now − 30 minutes)
justMissed = (pastScore / bestScore) >= threshold
```

If true and the current state is not POST_NOW, a "just missed peak" reason variant is shown.

---

## Reason line system

One reason string is selected per render based on 3 factors:

| Factor | Values |
|--------|--------|
| State | NOW / SOON / WAIT |
| Just-missed flag | true / false |
| Timing strictness | flexible / balanced / strict |

Priority order for selection:
1. NOW → `reason_now_*`
2. SOON → `reason_peak_soon_*`
3. Just-missed (state ≠ NOW) → `reason_just_missed_*`
4. WAIT, level low/very-low → `reason_wait_*`
5. WAIT, level medium/high → `reason_mid_*`

Strictness pins variant index: flexible → 0, strict → 3, balanced → rotates 1–2 on 15-min clock.

---

## Activity chart

12 bars, one per 15-minute slot, covering the 3 hours before the current time.

Bar height formula:
```
pct = max(round((score / bestScore) * 90 − 30), 2)
```

Mapping: 50% of best → ~15% bar height · 100% of best → ~60% bar height · floor: 2%

Bar heights and colours animate at 0.5 seconds using `cubic-bezier(0.4, 0, 0.2, 1)` easing when inputs change. Respects `prefers-reduced-motion: reduce`.

---

## Auto-refresh

Rerenders every 60 seconds. State is derived entirely from wall-clock time. No persistence required.

---

## Execution sequence (per render)

1. Read inputs: platform, audience, postType, goal, flex
2. Snap current time to nearest 15-minute boundary
3. Compute `currentScore`
4. Scan next 12 hours → compute `bestScore`
5. Compute `ratio = currentScore / bestScore`
6. Apply threshold → POST_NOW or WAIT decision
7. If WAIT: scan next 24 hours for first forward-validated qualifying window
8. Compute `minutesToWindow` → apply SOON check
9. Compute just-missed flag (30-minute lookback)
10. Select reason line
11. Mutate 12 chart bar DOM elements (triggers CSS transitions)
12. Update result card: state, reason, window, score data

---

## What the model does not account for

- User's personal follower or engagement data
- Real-time platform events or trending content
- Platform algorithm updates or changes
- Content quality, caption text, or hashtags
- Exact day-of-week patterns beyond region-level averages (e.g. LinkedIn weekday vs. weekend is modelled; specific calendar events are not)
