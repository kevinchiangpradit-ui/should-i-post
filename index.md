# Should I Post Now?

**URL:** https://shouldipostnow.com  
**Type:** Free, browser-only timing tool. No login, no account connection, no data stored.  
**Platforms:** Instagram, TikTok, Twitter/X, LinkedIn, Reddit  
**Languages:** English, Spanish, Chinese (Simplified), Japanese, French, German

---

## What it does

Determines whether the current moment is a good time to post on a social media platform. Scores the current 15-minute window against platform-specific activity patterns and returns a verdict with an explanation and, when relevant, the next best posting window.

---

## Verdicts

| Verdict | Meaning |
|---------|---------|
| POST NOW | Current window meets the activity threshold. Post now. |
| SOON | Current window falls short, but a qualifying window is within 2 hours. |
| WAIT | Activity is low. Shows next best window and estimated wait time. |

---

## Inputs

| Field | Options |
|-------|---------|
| Platform | Instagram, TikTok, Twitter/X, LinkedIn, Reddit |
| Audience | US, Europe, Asia, Mixed Global |
| Post type | Varies by platform — e.g. Reel, Story, Carousel, Static (Instagram) |
| Goal | Reach, Engagement, Replies, Clicks |
| Timing | Good enough (flexible) · Balanced · Best possible (strict) |

---

## Outputs

| Field | Description |
|-------|-------------|
| `state` | NOW / SOON / WAIT |
| `reason` | Context-aware explanation of the verdict |
| `bestWindowRange` | Time range of next recommended window (WAIT/SOON) |
| `hoursToWait` | Estimated wait in hours (WAIT) |
| `remainingLabel` | Time remaining in current window (NOW) |
| `currentScore` | Numeric score for the current 15-min slot (0–~15) |
| `bestScore` | Maximum score available in next 12 hours |
| `ratio` | currentScore / bestScore |
| Activity chart | 12-bar sparkline of the last 3 hours |

---

## Scoring logic

- Time is snapped to the nearest 15-minute boundary
- `currentScore / bestScore >= threshold` → POST NOW
  - flexible: 0.80 · balanced: 0.90 · strict: 0.95
- SOON fires when state is WAIT and next window ≤ 120 minutes away
- Next window is validated: candidate slot must itself trigger POST_NOW on arrival
- Auto-refreshes every 60 seconds

---

## Use cases

- Deciding whether to post a Reel now or wait for a stronger window
- Checking peak hours for a platform and region without platform analytics access
- Adjusting post timing when audience timezone differs from creator timezone
- Quick pre-post timing check for personal (non-Business) accounts

---

## What it does not do

- Connect to any social media account or read personal data
- Schedule or publish posts
- Account for content quality, hashtags, captions, or trends
- Use real-time platform data or trending topic information
- Store any user data
- Provide personalised predictions based on individual follower behaviour

---

## Accuracy note

Recommendations use generalised platform activity patterns per region — not the user's personal follower data. Useful as a free baseline signal, particularly for personal accounts without analytics access. Accuracy improves when audience region is set correctly.
