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
  // Returns internal English keys — used for CSS classes and t() lookups.
  function activityLevel(ratio, bands) {
    if (ratio >= bands.now)  return 'peak';
    if (ratio >= bands.soon) return 'high';
    if (ratio >= 0.55)       return 'medium';
    if (ratio >= 0.30)       return 'low';
    return 'very low';
  }

  // Short sub-label showing the specific timing under the big state word.
  function subDecision(state, hoursToWait) {
    if (state === 'NOW') return t('sub_post_now');
    const h = hoursToWait;
    return h === 1 ? t('sub_wait_hour') : t('sub_wait_hours', { n: h });
  }

  // One conversational line keyed directly to the activity level name.
  function reasonLine(state, level, bestScore) {
    if (state === 'NOW') {
      if (bestScore < 1)    return t('reason_slow_all_day');
      if (level === 'peak') return t('reason_at_peak');
      return t('reason_strong_window');
    }
    if (state === 'SOON') return t('reason_soon');
    // WAIT
    if (level === 'very low') return t('reason_very_low');
    if (level === 'low')      return t('reason_low');
    return t('reason_medium');
  }

  // Badge label for the right of the detail row.
  // NOW: qualitative. SOON/WAIT: % improvement to peak.
  function activityBadge(state, ratio, currentScore, bestScore) {
    if (state === 'NOW') {
      if (bestScore < 1)  return t('badge_low_period');   // neutral — no color
      if (ratio >= 0.97)  return `<strong>${t('badge_at_peak')}</strong>`;
      return `<strong>${t('badge_near_peak')}</strong>`;
    }
    // SOON or WAIT — show how much better the peak window is
    if (currentScore <= 0) return t('badge_pct_more', { pct: '<strong>&gt;999%</strong>' });
    const pct = Math.round(((bestScore - currentScore) / currentScore) * 100);
    if (pct < 10) return `<strong>${t('badge_slightly_more')}</strong>`;
    return t('badge_pct_more', { pct: `<strong>${pct}%</strong>` });
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
    const windowLabel  = state === 'NOW' ? t('peak_window') : t('best_window');
    const platformName = PLATFORM_LABELS[platform];

    const localTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    timestampEl.textContent = t('updated_at', { time: localTime });

    resultEl.className = `result-card ${state.toLowerCase()}`;
    resultEl.innerHTML = `
      <div class="state">${t('state_' + state.toLowerCase())}</div>
      <div class="sub-decision">${sub}</div>
      <p class="reason">${reason}</p>
      <p class="window-line">
        ${windowLabel}: <strong>${rec.bestWindowRange}</strong>
        <span class="window-note">${t('peak_hours')}</span>
      </p>
      <div class="detail-row">
        <span>${t('right_now')}: <strong class="${levelClass}">${t('level_' + level.replace(' ', '_'))}</strong></span>
        <span class="score-badge">${badge}</span>
      </div>
      <p class="disclaimer">${t('disclaimer', { platform: platformName })}</p>
    `;
  }

  platformEl.addEventListener('change', render);
  audienceEl.addEventListener('change', render);
  window.addEventListener('langchange', render);

  render();
  setInterval(render, 60_000);
})();
