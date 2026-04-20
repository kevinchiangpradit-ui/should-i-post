# Should I Post Now?

**shouldipostnow.com** — Free browser tool. Tells you whether to post on social media now or wait, based on platform activity patterns for your audience region.

Cost: Free. No login. No account connection. No data stored.

---

## Definition

Should I Post Now? scores the current 15-minute time window against a platform-specific activity curve, normalised against the best available score in the next 12 hours. It returns one of three verdicts with a reason and, when applicable, the next best posting time.

---

## Verdicts

| Verdict | Meaning |
|---------|---------|
| POST NOW | Current score ÷ 12h best score ≥ threshold. Post now. |
| SOON | Below threshold, but a qualifying window is within 120 minutes. |
| WAIT | Activity is low. Shows next qualifying window and hours to wait. |

---

## Inputs

| Field | Values |
|-------|--------|
| Platform | Instagram · TikTok · Twitter/X · LinkedIn · Reddit |
| Audience | US · Europe · Asia · Mixed Global |
| Post type | Per-platform (e.g. Reel, Story, Carousel, Static for Instagram) |
| Goal | Reach · Engagement · Replies · Clicks |
| Timing | Good enough (0.80) · Balanced (0.90) · Best possible (0.95) |

The "Timing" field sets the minimum ratio threshold required to trigger POST NOW.

---

## Outputs

| Field | Description |
|-------|-------------|
| `state` | NOW / SOON / WAIT |
| `reason` | 1-sentence explanation of the verdict |
| `bestWindowRange` | Time range of next qualifying window (e.g. "6:00 AM – 7:30 AM") |
| `hoursToWait` | Estimated hours until next window (WAIT state) |
| `remainingLabel` | Time left in current window, e.g. "45 minutes" (NOW state) |
| `currentScore` | Numeric score for current 15-min slot (0–~15) |
| `bestScore` | Max score available in next 12 hours |
| `ratio` | currentScore ÷ bestScore (0–1) |
| Chart | 12 bars × 15-minute intervals covering the last 3 hours |

---

## Scoring thresholds

- Good enough: ratio ≥ 0.80 → POST NOW
- Balanced: ratio ≥ 0.90 → POST NOW
- Best possible: ratio ≥ 0.95 → POST NOW
- SOON fires when state is WAIT and next window is ≤ 120 minutes away
- Next window is forward-validated: each candidate must itself pass the threshold on arrival
- Auto-refreshes every 60 seconds

---

## Use cases

- Personal Instagram/TikTok account: deciding whether to post a Reel now or wait, without access to Insights
- Timezone mismatch: creator is in Europe, audience is in the US — select "US" as audience region
- Platform comparison: checking whether LinkedIn is active before a Tuesday morning post
- Quick sanity check: 30-second timing check before posting without opening any third-party tool

---

## What it does not do

- Connect to social media accounts or read follower/engagement data
- Schedule or publish posts
- Account for content quality, hashtags, captions, or trending topics
- Use real-time platform data
- Store any user data
- Provide personalised predictions based on individual account behaviour

---

## Accuracy note

Activity patterns are generalised per platform and audience region — not derived from the user's personal follower data. Accuracy is higher when audience region is set to match where the majority of followers are located. Does not reflect real-time events or algorithmic changes.
