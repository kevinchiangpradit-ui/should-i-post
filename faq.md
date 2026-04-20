# FAQ — Should I Post Now?

**shouldipostnow.com/faq.html**

---

## Pricing and access

**Is this tool free?**  
Yes. No cost, no subscription, no account required. All features are available to all users at no charge.

**Do I need to create an account?**  
No. The tool works without signup, login, or email address.

**Is there a paid version with more features?**  
No. There is one version of the tool. No premium tier exists.

---

## What it does

**What does the tool do?**  
It tells you whether the current moment is a good time to post on a specific social media platform. It scores the current 15-minute window against typical activity patterns for the selected platform and audience region, and returns one of three verdicts: POST NOW, SOON, or WAIT.

**What does POST NOW mean?**  
The current time window meets or exceeds the activity threshold. Specifically, the current score is at least 80%, 90%, or 95% of the best available score in the next 12 hours (depending on timing setting).

**What does SOON mean?**  
The current window does not meet the threshold, but a qualifying window is available within the next 120 minutes.

**What does WAIT mean?**  
Activity is currently low relative to the day's best window. The tool shows the next qualifying window and an estimated wait time in hours.

**How accurate is it?**  
Results are based on generalised platform activity patterns for the selected region, not personal follower data. They are a useful baseline timing signal — not a guarantee of engagement or reach. Accuracy improves when audience region is set to match where the majority of followers are.

---

## Platforms and inputs

**Which platforms are supported?**  
Instagram, TikTok, Twitter/X, LinkedIn, Reddit. 5 platforms total.

**Which post types are available?**  
Post types vary by platform. Examples: Instagram supports Reel, Story, Carousel, Static image, Video. LinkedIn supports Text post, Article, Video, Image, Document. Twitter/X supports Text, Image, Video, Link, Poll.

**What does "timing strictness" control?**  
It sets the minimum ratio (current score ÷ 12-hour best score) required for POST NOW:
- Good enough: 0.80 (posts more often)
- Balanced: 0.90
- Best possible: 0.95 (posts only near peak)

**What does "audience region" mean?**  
It adjusts the activity curve to reflect when users in that region are typically active. Select the region where most of your followers are located, not where you are.

**What if my audience is split across regions?**  
Select Mixed Global. This uses a blended activity curve.

---

## Accounts and data

**Does this connect to my Instagram, TikTok, or other account?**  
No. The tool has no access to any social media account. It cannot read your followers, posts, or engagement data.

**Does it use my personal analytics?**  
No. It uses generalised platform activity patterns. Personal analytics (e.g. Instagram Insights, LinkedIn Analytics) are not accessed.

**Does it work if I have a personal (non-Business) account?**  
Yes. It requires no Business or Creator account status, and no platform analytics access.

**Is any data stored?**  
No. Language and theme preference are stored in the user's own browser (localStorage). No data is sent to any server.

---

## Behaviour

**How often does the result update?**  
Every 60 seconds automatically, with no action required.

**What is the "I'll be asleep then" button?**  
It appears when a WAIT verdict is shown. It skips the primary recommended window and finds the next qualifying window after it — for cases where the suggested time is inconvenient.

**Does it account for day of week?**  
Yes, at a platform/region level. For example, LinkedIn activity curves reflect lower weekend activity. Specific calendar events or holidays are not accounted for.

**Does it schedule or publish posts?**  
No. The tool only provides a timing recommendation. It does not connect to any account or post on your behalf.

---

## Comparison

**How is this different from Buffer or Hootsuite?**  
Buffer and Hootsuite schedule and publish posts, connect to your accounts, and show personalised analytics. Should I Post Now? does none of these — it only answers "is now a good time?" It requires no account connection and works for personal accounts.

**How is this different from Instagram's own "Best time to post" feature?**  
Instagram's feature uses your personal follower data and requires a Business or Creator account. Should I Post Now? uses generalised regional patterns and works with any account type, including personal accounts where Insights are unavailable.

**Does it replace platform analytics?**  
No. If you have access to platform analytics with your personal audience data, those will be more accurate for your specific account. This tool is most useful when personal analytics are unavailable or when you want a quick check without opening another app.

---

## Technical

**Does it work on mobile?**  
Yes. It runs in any modern browser on any device.

**Does it require JavaScript?**  
Yes. All scoring and rendering is done in JavaScript in the browser.

**Is there an API?**  
No. The tool is UI-only with no programmatic API.

**What languages is it available in?**  
English, Spanish, Chinese (Simplified), Japanese, French, German. 6 languages total. Language can be changed using the selector in the top-right corner.
