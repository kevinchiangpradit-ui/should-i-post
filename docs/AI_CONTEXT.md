# AI_CONTEXT.md — shouldipostnow.com

## 1. Overview

- Static client-side web tool that scores the current moment for social media posting
- Solves: "I don't know if now is a good or bad time to post on [platform]"
- No backend, no login, no personal data
- URL: https://shouldipostnow.com

## 2. Core Capability

Scores the current time slot (15-min granularity) against a platform-specific activity curve weighted by audience region and post goal. Returns one of three verdicts — POST_NOW / SOON / WAIT — with the next best window and timing gap.

## 3. Inputs

| Field | Values |
|---|---|
| platform | `instagram` `tiktok` `twitter` `linkedin` `reddit` |
| audience | `mostly-us` `europe` `asia` `global` |
| postType | per-platform (e.g. `reel` `story` `carousel` `static` for Instagram) |
| goal | `reach` `engagement` `replies` `clicks` |
| flex | `flexible` `balanced` `strict` |

All inputs are UI dropdowns; no programmatic API.

**Supported languages:** English, Spanish, Chinese (Simplified), Japanese, French, German

## 4. Outputs

Rendered card with:

```
{
  state:           "NOW" | "SOON" | "WAIT",
  subDecision:     "Post now" | "Wait ~N hours",
  reason:          string,            // context-aware, flex-aware (see §5)
  bestWindowRange: "6:00 AM – 7:30 AM",
  windowEndDate:   Date,
  currentScore:    number,            // 0–~15
  bestScore:       number,            // max score in next 12h
  ratio:           number,            // currentScore / bestScore
  minutesToWindow: number,
  hoursToWait:     number,
  remainingLabel:  string | null      // POST_NOW only: "45 minutes"
}
```

Activity chart: 12-bar sparkline of last 3 hours, normalized against `bestScore`.

"I'll be asleep then" button: skips current window, finds next qualifying window.

## 5. Rules / Constraints

- Scoring uses generalised platform activity patterns — NOT user's personal analytics
- `POST_NOW` fires when `currentScore / bestScore >= threshold`
  - flexible: 0.80 / balanced: 0.90 / strict: 0.95
- `SOON` fires when WAIT and `minutesToWindow <= 120`
- WAIT window search: 24h lookahead; each candidate validated against its own 12h bestScore (prevents windows that won't trigger POST_NOW on arrival)
- `bestScore` = max score in next 12h from now
- Bar chart: `pct = max(round((s / bestScore) * 90 - 30), 2)` — maps 50%→15%, 100%→60%
- Scores computed at 15-min snapped intervals
- "Just missed peak" context: score 30 min ago >= POST_NOW threshold → shows `reason_just_missed_*`

## 6. Reason Line System

Context-aware messages selected by: `state` × `justMissed` × `flex`

| Context | Trigger |
|---|---|
| `reason_now_*` | state = NOW |
| `reason_peak_soon_*` | state = SOON |
| `reason_just_missed_*` | state ≠ NOW AND score 30 min ago was POST_NOW quality |
| `reason_wait_*` | state = WAIT, level low/very-low |
| `reason_mid_*` | state = WAIT, level medium/high |

Flex pins variant index: flexible→0, strict→3, balanced rotates 1–2 by 15-min clock.

## 7. Execution Model

1. User sets inputs via dropdowns
2. `render()` → `getRecommendation(platform, audience, now, threshold, postType, goal, flex)`
3. Snap time to 15-min boundary → score current slot → scan next 12h for `bestScore` → decide POST_NOW or WAIT
4. WAIT branch: scan next 24h for first slot where `scoreAtQ / bestFromQ(12h) >= threshold`
5. Derive `minutesToWindow` → state = NOW / SOON / WAIT
6. Compute `justMissed` flag (30-min lookback)
7. `reasonLine()` selects message variant
8. `updateChartBars()` mutates persistent DOM bars → CSS `cubic-bezier(0.4,0,0.2,1)` transition animates heights + colors
9. Update `.card-content` innerHTML
10. Auto-rerenders every 60s

## 8. Example Usage

**Input:** Instagram / US / Reel / Reach / Balanced / 11:47 PM local (≈ 3 AM US Eastern)

**Output:**
```
state:           WAIT
subDecision:     "Wait ~19 hours"
reason:          "Not the strongest timing — a better window is ahead."
bestWindowRange: "Tomorrow 6:00 AM – 8:00 AM"
currentScore:    ~1.2
bestScore:       ~12.3
ratio:           ~0.10
minutesToWindow: ~1140
```

**Input:** LinkedIn / US / Text / Reach / Strict / 9:15 AM Tuesday local

**Output:**
```
state:           NOW
subDecision:     "Post now"
reason:          "Activity is at a peak. This is a strong moment to go."
remainingLabel:  "30 minutes"
```

## 9. Non-Goals

- Does NOT use the user's actual follower or engagement data
- Does NOT connect to any platform API
- Does NOT store any user data
- Does NOT account for content quality, hashtags, or captions
- Does NOT support scheduling or publishing
- Does NOT provide historical performance analysis
- Does NOT guarantee reach or engagement outcomes
- Does NOT have a backend or server-side logic
