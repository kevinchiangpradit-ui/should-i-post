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

  // ── Skip-window override state ─────────────────────────────────────────────
  // null  → show primary recommendation
  // Date  → show next qualifying window starting after this Date
  let skipFrom         = null;
  let _shownWindowEnd  = null;  // tracks end of currently displayed window for chaining

  // Gap added after a skipped window's end before searching for the next one.
  // Prevents the alternative from being an adjacent fragment of the same period.
  const SKIP_GAP_MS = 3 * 60 * 60 * 1000;  // 3 hours — change here to tune

  // ── Post type options per platform ────────────────────────────────────────
  // Each platform gets its own set of options. When the platform changes,
  // postTypeEl is rebuilt from this config.
  // Keys map to translation strings via t() so labels update with language.
  const POST_TYPE_OPTIONS = {
    instagram: [
      { value: 'reel',     key: 'post_reel' },
      { value: 'story',    key: 'post_story' },
      { value: 'carousel', key: 'post_carousel' },
      { value: 'static',   key: 'post_static' },
    ],
    tiktok: [
      { value: 'video', key: 'post_video' },
      { value: 'photo', key: 'post_photo' },
    ],
    twitter: [
      { value: 'text',   key: 'post_text' },
      { value: 'image',  key: 'post_image' },
      { value: 'video',  key: 'post_video' },
      { value: 'thread', key: 'post_thread' },
    ],
    linkedin: [
      { value: 'text_post',  key: 'post_text' },
      { value: 'image_post', key: 'post_image' },
      { value: 'doc_post',   key: 'post_document' },
      { value: 'video_post', key: 'post_video' },
    ],
    reddit: [
      { value: 'discussion', key: 'post_discussion' },
      { value: 'meme',       key: 'post_meme' },
      { value: 'question',   key: 'post_question' },
      { value: 'promotion',  key: 'post_promotion' },
    ],
  };

  const POST_TYPE_DEFAULT = {
    instagram: 'reel',
    tiktok:    'video',
    twitter:   'text',
    linkedin:  'text_post',
    reddit:    'discussion',
  };

  // Rebuild post-type <select> whenever platform changes.
  function updatePostTypeOptions(platform) {
    const opts    = POST_TYPE_OPTIONS[platform] || [];
    const current = postTypeEl.value;
    postTypeEl.innerHTML = '';
    opts.forEach(function (o) {
      const el = document.createElement('option');
      el.value       = o.value;
      el.textContent = t(o.key);
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

  // Deterministic variant index — changes every 15 min, never flickers mid-render.
  function _reasonVariant(now) {
    return Math.floor(now.getTime() / (15 * 60 * 1000)) % 4;
  }

  function reasonLine(state, level, bestScore, now) {
    if (state === 'NOW') {
      if (bestScore < 1) return t('reason_slow_all_day');
      return t('reason_now_' + _reasonVariant(now));
    }
    if (level === 'very low' || level === 'low') {
      return t('reason_wait_' + _reasonVariant(now));
    }
    return t('reason_mid_' + _reasonVariant(now));
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
      return t('badge_x_more_at_peak', { n: '<strong>3x</strong>' });
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

    return t('badge_x_more_at_peak', { n: `<strong>${display}x</strong>` });
  }

  const PLATFORM_LABELS = {
    instagram: 'Instagram',
    tiktok:    'TikTok',
    twitter:   'Twitter/X',
    linkedin:  'LinkedIn',
    reddit:    'Reddit',
  };

  // ── Event wiring ──────────────────────────────────────────────────────────

  flexControl.addEventListener('click', function (e) {
    const btn = e.target.closest('.flex-btn');
    if (!btn) return;
    flexControl.querySelectorAll('.flex-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentFlex = btn.dataset.flex;
    skipFrom = null;
    render();
  });

  platformEl.addEventListener('change', function () {
    skipFrom = null;
    updatePostTypeOptions(platformEl.value);
    render();
  });

  audienceEl.addEventListener('change', function () { skipFrom = null; render(); });
  postTypeEl.addEventListener('change', function () { skipFrom = null; render(); });
  goalEl.addEventListener('change',     function () { skipFrom = null; render(); });
  window.addEventListener('langchange', function () {
    skipFrom = null;
    updatePostTypeOptions(platformEl.value);
    render();
  });

  // Logo → reset all inputs to defaults + scroll to top
  var logoEl = document.querySelector('.nav-brand');
  if (logoEl) {
    logoEl.addEventListener('click', function (e) {
      e.preventDefault();
      skipFrom = null;
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

  // Skip / reset click delegation — attached once, survives innerHTML resets
  resultEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="skip-window"]')) {
      skipFrom = new Date(_shownWindowEnd.getTime() + SKIP_GAP_MS);
      render();
    }
    if (e.target.closest('[data-action="reset-window"]')) {
      skipFrom = null;
      render();
    }
  });

  // ── Mini activity chart ──────────────────────────────────────────────────
  // Builds a 12-bar sparkline-style strip covering the last ~3 hours.
  // Bar heights are normalized against bestScore (the upcoming peak) so
  // they convey both trend and absolute level simultaneously.
  function buildActivityChart(platform, audience, postType, goal, now, bestScore) {
    const N    = 12;
    const STEP = 15 * 60_000;  // 15 minutes
    const scores = [];
    for (let i = N - 1; i >= 0; i--) {
      const t = new Date(now.getTime() - i * STEP);
      scores.push(getActivityScore(platform, audience, t, postType, goal, 'personal'));
    }
    // Normalize against the upcoming peak so bars show absolute activity level
    const ref  = Math.max(bestScore, Math.max(...scores), 0.001);
    const bars = scores.map(function (s, i) {
      const pct = Math.max(Math.round((s / ref) * 100), 6);  // min 6% so bar always visible
      const cls = i === N - 1 ? ' chart-bar--now' : '';
      return '<div class="chart-bar' + cls + '" style="height:' + pct + '%"></div>';
    }).join('');
    return '<div class="activity-chart" aria-hidden="true">' + bars + '</div>';
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    const platform = platformEl.value;
    const audience = audienceEl.value;
    const postType = postTypeEl.value;
    const goal     = goalEl.value;
    const now      = new Date();

    // Auto-reset skip if the skipped-past window is now in the past
    if (skipFrom !== null && skipFrom <= now) {
      skipFrom = null;
    }

    const bands     = RATIO_BANDS[currentFlex];
    const threshold = FLEXIBILITY_THRESHOLDS[currentFlex];
    const rec       = getRecommendation(platform, audience, now, threshold, postType, goal, currentFlex);

    let state;
    if (rec.action === 'POST_NOW') {
      state = 'NOW';
    } else if (rec.minutesToWindow <= 120) {
      state = 'SOON';
    } else {
      state = 'WAIT';
    }
    const level = activityLevel(rec.ratio, bands);

    const sub          = subDecision(state, rec.hoursToWait);
    const reason       = reasonLine(state, level, rec.bestScore, now);
    const badge        = activityBadge(state, rec.ratio, rec.currentScore, rec.bestScore);
    const levelClass   = 'level-' + level.replace(' ', '-');
    const windowLabel  = state === 'NOW' ? t('peak_window') : t('best_window');
    const platformName = PLATFORM_LABELS[platform];

    const localTime = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    timestampEl.textContent = t('updated_at', { time: localTime });

    // ── Build the window section (primary or skipped-to alternative) ─────────
    let windowSection;

    if (skipFrom !== null) {
      // User has skipped the primary window — find next qualifying window
      const altRec = getRecommendation(platform, audience, skipFrom, threshold, postType, goal, currentFlex);
      _shownWindowEnd = altRec.windowEndDate;
      windowSection = `
        <div class="window-row">
          <p class="alt-window-line">Next available window: <strong>${altRec.bestWindowRange}</strong></p>
          <button class="skip-btn" data-action="skip-window">Skip this one too</button>
        </div>
        <button class="reset-btn" data-action="reset-window">Show best window again</button>`;
    } else {
      // Primary recommendation — show normal window info + skip button
      _shownWindowEnd = rec.windowEndDate;
      const withinNote = (state === 'NOW' && rec.remainingLabel)
        ? `<p class="within-note">Post within <strong>${rec.remainingLabel}</strong> to achieve best results</p>`
        : '';
      const primaryWindow = state !== 'NOW'
        ? `<p class="window-line">${windowLabel}: <strong>${rec.bestWindowRange}</strong> <span class="window-note">${t('peak_hours')}</span></p>`
        : withinNote;
      windowSection = `
        <div class="window-row">
          ${primaryWindow}
          <button class="skip-btn" data-action="skip-window">I'll be asleep then</button>
        </div>`;
    }

    const chart = buildActivityChart(platform, audience, postType, goal, now, rec.bestScore);

    resultEl.className = `result-card ${state.toLowerCase()}`;
    resultEl.innerHTML = `
      ${chart}
      <div class="card-content">
        <div class="state">${t('state_' + state.toLowerCase())}</div>
        <div class="sub-decision">${sub}</div>
        <p class="reason">${reason}</p>
        ${windowSection}
        <div class="detail-row">
          <span>${t('right_now')}: <strong class="${levelClass}">${t('level_' + level.replace(' ', '_'))}</strong></span>
          <span class="score-badge">${badge}</span>
        </div>
        <p class="disclaimer">${t('disclaimer', { platform: platformName })}</p>
      </div>
    `;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  updatePostTypeOptions(platformEl.value);
  render();
  setInterval(render, 60_000);
})();
