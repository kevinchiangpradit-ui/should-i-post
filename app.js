'use strict';

(function () {
  const platformEl  = document.getElementById('platform');
  const audienceEl  = document.getElementById('audience');
  const flexControl = document.getElementById('flexibility');
  const resultEl    = document.getElementById('result');
  const timestampEl = document.getElementById('timestamp');

  let currentFlex = 'balanced';

  // ── Ratio bands ───────────────────────────────────────────────────────────
  // Both timingState() and activityLevel() use these same thresholds.
  // Because they share one source of truth, label and decision can never disagree.
  //
  //   now  = minimum ratio to say NOW  (also: peak label floor)
  //   soon = minimum ratio to say SOON (also: high label floor)
  //   anything below soon → WAIT, with medium / low / very-low labels
  //
  const RATIO_BANDS = {
    flexible: { now: 0.80, soon: 0.65 },
    balanced: { now: 0.90, soon: 0.75 },  // matches spec thresholds exactly
    strict:   { now: 0.95, soon: 0.85 },
  };

  // ── Flexibility control ───────────────────────────────────────────────────
  flexControl.addEventListener('click', function (e) {
    const btn = e.target.closest('.flex-btn');
    if (!btn) return;
    flexControl.querySelectorAll('.flex-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFlex = btn.dataset.flex;
    render();
  });

  // ── Core interpretation layer ─────────────────────────────────────────────
  // Both functions take (ratio, bands) — the SAME two arguments.
  // This is the structural guarantee: same input → consistent output.

  function timingState(ratio, bands) {
    if (ratio >= bands.now)  return 'NOW';
    if (ratio >= bands.soon) return 'SOON';
    return 'WAIT';
  }

  // Activity label relative to the best upcoming window, not absolute score.
  // "peak" always means the same state as NOW; "high" as SOON; rest as WAIT.
  function activityLevel(ratio, bands) {
    if (ratio >= bands.now)  return 'peak';
    if (ratio >= bands.soon) return 'high';
    if (ratio >= 0.55)       return 'medium';
    if (ratio >= 0.30)       return 'low';
    return 'very low';
  }

  // Short sub-label showing the specific timing under the big state word.
  function subDecision(state, hoursToWait) {
    if (state === 'NOW') return 'Post now';
    const h = hoursToWait;
    return `Wait ~${h} ${h === 1 ? 'hour' : 'hours'}`;
  }

  // One conversational line keyed directly to the activity level name.
  function reasonLine(state, level, bestScore) {
    if (state === 'NOW') {
      if (bestScore < 1)    return "It's pretty slow all day — no better window ahead.";
      if (level === 'peak') return "You're basically at peak activity.";
      return "You're in a strong window right now.";
    }
    if (state === 'SOON') {
      return "Getting close — activity picks up soon.";
    }
    // WAIT
    if (level === 'very low') return "Most people aren't active yet.";
    if (level === 'low')      return "It's pretty quiet right now.";
    return "Some activity, but a better window is coming.";
  }

  // Badge label for the right of the detail row.
  // NOW: qualitative. SOON/WAIT: % improvement to peak.
  function activityBadge(state, ratio, currentScore, bestScore) {
    if (state === 'NOW') {
      if (bestScore < 1)  return 'Low activity period';
      if (ratio >= 0.97)  return 'At peak';
      return 'Near peak';
    }
    // SOON or WAIT — show how much better the peak window is
    if (currentScore <= 0) return '<strong>&gt;999%</strong> more activity at peak';
    const pct = Math.round(((bestScore - currentScore) / currentScore) * 100);
    if (pct < 10)  return 'Slightly more at peak';
    return `<strong>${pct}%</strong> more activity at peak`;
  }

  const PLATFORM_LABELS = {
    instagram: 'Instagram',
    tiktok:    'TikTok',
    twitter:   'Twitter/X',
    linkedin:  'LinkedIn',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    const platform = platformEl.value;
    const audience = audienceEl.value;
    const now      = new Date();

    // No threshold passed — app.js owns the decision now via ratio + bands.
    const rec   = getRecommendation(platform, audience, now);
    const bands = RATIO_BANDS[currentFlex];

    // Both state and level derived from the same ratio + bands: contradiction impossible.
    const state = timingState(rec.ratio, bands);
    const level = activityLevel(rec.ratio, bands);

    const sub          = subDecision(state, rec.hoursToWait);
    const reason       = reasonLine(state, level, rec.bestScore);
    const badge        = activityBadge(state, rec.ratio, rec.currentScore, rec.bestScore);
    const levelClass   = 'level-' + level.replace(' ', '-');
    const windowLabel  = state === 'NOW' ? 'Peak window' : 'Best window';
    const platformName = PLATFORM_LABELS[platform];

    const localTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    timestampEl.textContent = `Updated at ${localTime}`;

    resultEl.className = `result-card ${state.toLowerCase()}`;
    resultEl.innerHTML = `
      <div class="state">${state}</div>
      <div class="sub-decision">${sub}</div>
      <p class="reason">${reason}</p>
      <p class="window-line">
        ${windowLabel}: <strong>${rec.bestWindowRange}</strong>
        <span class="window-note">· peak hours</span>
      </p>
      <div class="detail-row">
        <span>Right now: <strong class="${levelClass}">${level}</strong></span>
        <span class="score-badge">${badge}</span>
      </div>
      <p class="disclaimer">Based on typical ${platformName} usage patterns — not your personal analytics.</p>
    `;
  }

  platformEl.addEventListener('change', render);
  audienceEl.addEventListener('change', render);

  render();
  setInterval(render, 60_000);
})();
