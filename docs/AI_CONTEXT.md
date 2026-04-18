# AI_CONTEXT.md — shouldipostnow.com

## 1. Overview

- Static client-side web tool that scores the current moment for social media posting
- Solves: "I don't know if now is a good or bad time to post on [platform]"
- No backend, no login, no personal data

## 2. Core Capability

Scores the current time slot (15-min granularity) against a platform-specific activity curve weighted by audience region and post goal. Returns one of three verdicts — POST_NOW / SOON / WAIT — with the next best window and timing gap.

## 3. Inputs

| Field | Values |
|---|---|
| platform | `instagram` `tiktok` `twitter` `linkedin` `reddit` |
| audience | `mostly-us` `europe` `asia` `global` |
| postType | per-platform (e.g. `reel`, `story`, `carousel`, `static` for Instagram) |
| goal | `reach` `engagement` `replies` `clicks` |
| flex | `flexible` `balanced` `strict` |

All inputs are UI dropdowns; no programmatic API.

## 4. Outputs

Rendered card with:

```
{
  state:           "NOW" | "SOON" | "WAIT",
  subDecision:     "Post now" | "Wait ~N hours",
  reason:          string,            // context-aware, flex-aware
  bestWindowRange: "6:00 AM – 7:30 AM",
  windowEndDate:   Date,
  currentScore:    number,            // 0–~15
  bestScore:       number,
  ratio:           number,            // currentScore / bestScore
  minutesToWindow: number,
  hoursToWait:     number,
  remainingLabel:  string | null      // POST_NOW only: "45 minutes"
}
```

Activity chart: 12-bar sparkline of last 3 hours, normalized against `bestScore`.

## 5. Rules / Constraints

- Scoring is based on generalised platform activity patterns, NOT the user's personal analytics
- `POST_NOW` fires when `currentScore / bestScore >= threshold` (threshold: 0.80 / 0.90 / 0.95 by flex)
- `SOON` fires when WAIT and `minutesToWindow <= 120`
- WAIT window search looks 24h ahead; validates each candidate by checking it also passes the POST_NOW threshold at arrival time (prevents false windows)
- `bestScore` = max score over next 12h from now
- Bar heights: `pct = max(round((s / bestScore) * 90 - 30), 2)` — maps 50%→15%, 100%→60%
- Scores computed at 15-min snapped intervals via `_scoreAtQuarter()`
- "Just missed peak" detected by checking if score 30 min ago >= POST_NOW threshold

## 6. Execution Model

1. User sets inputs (platform, audience, postType, goal, flex)
2. `render()` fires → calls `getRecommendation(platform, audience, now, threshold, postType, goal, flex)`
3. `getRecommendation` snaps current time to 15-min boundary → scores current slot → scans next 12h for bestScore → decides POST_NOW or WAIT
4. WAIT branch: scans next 24h for first slot where `scoreAtQ / bestFromQ(12h) >= threshold`
5. `minutesToWindow` derived → state = NOW / SOON / WAIT
6. `justMissed` flag: compares score 30 min ago against threshold
7. `reasonLine()` selects message variant by state + context + flex
8. `updateChartBars()` sets heights on persistent DOM bars → CSS transitions animate
9. `resultEl.querySelector('.card-content').innerHTML` updated with verdict text
10. Auto-rerenders every 60s

## 7. Example Usage

**Input:** Instagram / US audience / Reel / Reach / Balanced / 11:47 PM local (= ~3 AM US Eastern)

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

## 8. Non-Goals

- Does NOT use the user's actual follower or engagement data
- Does NOT connect to any platform API
- Does NOT store any user data
- Does NOT account for content quality, hashtags, or captions
- Does NOT support scheduling or publishing
- Does NOT provide historical performance analysis
- Does NOT guarantee reach or engagement outcomes
