'use strict';

(function () {
  const platformEl  = document.getElementById('platform');
  const audienceEl  = document.getElementById('audience');
  const postTypeEl  = document.getElementById('post-type');
  const goalEl      = document.getElementById('goal');
  const flexControl = document.getElementById('flexibility');
  const resultEl    = document.getElementById('result');
  const timestampEl = document.getElementById('timestamp');

  let currentFlex = 'balanced';

  // ── Post type options per platform ────────────────────────────────────────
  // Each platform gets its own set of options. When the platform changes,
  // postTypeEl is rebuilt from this config.
  const POST_TYPE_OPTIONS = {
    instagram: [
      { value: 'reel',     label: 'Reel' },
      { value: 'story',    label: 'Story' },
      { value: 'carousel', label: 'Photo album' },
      { value: 'static',   label: 'Post' },
    ],
    tiktok: [
      { value: 'video', label: 'Video' },
      { value: 'photo', label: 'Photo' },
    ],
    twitter: [
      { value: 'text',   label: 'Text' },
      { value: 'image',  label: 'Image' },
      { value: 'video',  label: 'Video' },
      { value: 'thread', label: 'Thread' },
    ],
    linkedin: [
      { value: 'text_post',  label: 'Text' },
      { value: 'image_post', label: 'Image' },
      { value: 'doc_post',   label: 'Document' },
      { value: 'video_post', label: 'Video' },
    ],
  };

  const POST_TYPE_DEFAULT = {
    instagram: 'reel',
    tiktok:    'video',
    twitter:   'text',
    linkedin:  'text_post',
  };

  // Rebuild post-type <select> whenever platform changes.
  function updatePostTypeOptions(platform) {
    const opts    = POST_TYPE_OPTIONS[platform] || [];
    const current = postTypeEl.value;
    postTypeEl.innerHTML = '';
    opts.forEach(function (o) {
      const el = document.createElement('option');
      el.value       = o.value;
      el.textContent = o.label;
      postTypeEl.appendChild(el);
    });
    const stillValid = opts.some(function (o) { return o.value === current; });
    postTypeEl.value = stillValid ? current : (POST_TYPE_DEFAULT[platform] || (opts[0] && opts[0].value) || '');
  }

  // ── Ratio bands ───────────────────────────────────────────────────────────
  const RATIO_BANDS = {
    flexible: { now: 0.80, soon: 0.65 },
    balanced: { now: 0.90, soon: 0.75 },
    strict:   { now: 0.95, soon: 0.85 },
  };

  // ── Badge: low-activity threshold ────────────────────────────────────────
  // Scores below this are considered "very low" and get a harder ratio cap
  // to prevent unrealistic multipliers when the denominator is near-zero.
  const LOW_ACTIVITY_THRESHOLD = 0.5;

  // ── Core interpretation functions ─────────────────────────────────────────

  function timingState(ratio, bands) {
    if (ratio >= bands.now)  return 'NOW';
    if (ratio >= bands.soon) return 'SOON';
    return 'WAIT';
  }

  function activityLevel(ratio, bands) {
    if (ratio >= bands.now)  return 'peak';
    if (ratio >= bands.soon) return 'high';
    if (ratio >= 0.55)       return 'medium';
    if (ratio >= 0.30)       return 'low';
    return 'very low';
  }

  function subDecision(state, hoursToWait) {
    if (state === 'NOW') return t('sub_post_now');
    const h = hoursToWait;
    return h === 1 ? t('sub_wait_hour') : t('sub_wait_hours', { n: h });
  }

  function reasonLine(state, level, bestScore) {
    if (state === 'NOW') {
      if (bestScore < 1)    return t('reason_slow_all_day');
      if (level === 'peak') return t('reason_at_peak');
      return t('reason_strong_window');
    }
    if (state === 'SOON') return t('reason_soon');
    if (level === 'very low') return t('reason_very_low');
    if (level === 'low')      return t('reason_low');
    return t('reason_medium');
  }

  function activityBadge(state, ratio, currentScore, bestScore) {
    // NOW state: qualitative labels (no multiplier needed — already at/near peak)
    if (state === 'NOW') {
      if (bestScore < 1)  return t('badge_low_period');
      if (ratio >= 0.97)  return `<strong>${t('badge_at_peak')}</strong>`;
      return `<strong>${t('badge_near_peak')}</strong>`;
    }

    // WAIT / SOON: deterministic numeric multiplier, 1 decimal place max
    if (currentScore <= 0) {
      // Denominator is zero — use hard cap
      return `<strong>3x</strong> more activity at peak`;
    }

    let r = bestScore / currentScore;

    // Extra cap when current activity is near-zero to avoid inflated values
    if (currentScore < LOW_ACTIVITY_THRESHOLD) {
      r = Math.min(r, 3.0);
    }

    // Overall clamp: 1.1 – 3.5
    r = Math.max(1.1, Math.min(r, 3.5));

    // Round to 1 decimal place
    const rounded = Math.round(r * 10) / 10;

    // Drop trailing ".0" for whole numbers
    const display = (rounded % 1 === 0) ? rounded.toFixed(0) : rounded.toFixed(1);

    return `<strong>${display}x</strong> more activity at peak`;
  }

  const PLATFORM_LABELS = {
    instagram: 'Instagram',
    tiktok:    'TikTok',
    twitter:   'Twitter/X',
    linkedin:  'LinkedIn',
  };

  // ── Event wiring ──────────────────────────────────────────────────────────

  flexControl.addEventListener('click', function (e) {
    const btn = e.target.closest('.flex-btn');
    if (!btn) return;
    flexControl.querySelectorAll('.flex-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentFlex = btn.dataset.flex;
    render();
  });

  platformEl.addEventListener('change', function () {
    updatePostTypeOptions(platformEl.value);
    render();
  });

  audienceEl.addEventListener('change',  render);
  postTypeEl.addEventListener('change',  render);
  goalEl.addEventListener('change',      render);
  window.addEventListener('langchange',  render);

  // Logo → reset all inputs to defaults + scroll to top
  var logoEl = document.querySelector('.nav-brand');
  if (logoEl) {
    logoEl.addEventListener('click', function (e) {
      e.preventDefault();
      platformEl.value = 'instagram';
      audienceEl.value = 'mostly-us';
      goalEl.value     = 'reach';
      // Reset flex toggle to balanced
      currentFlex = 'balanced';
      flexControl.querySelectorAll('.flex-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.flex === 'balanced');
      });
      updatePostTypeOptions('instagram');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    const platform = platformEl.value;
    const audience = audienceEl.value;
    const postType = postTypeEl.value;
    const goal     = goalEl.value;
    const now      = new Date();

    const bands     = RATIO_BANDS[currentFlex];
    const threshold = FLEXIBILITY_THRESHOLDS[currentFlex];
    const rec       = getRecommendation(platform, audience, now, threshold, postType, goal);

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

  // ── Init ──────────────────────────────────────────────────────────────────
  updatePostTypeOptions(platformEl.value);
  render();
  setInterval(render, 60_000);
})();
