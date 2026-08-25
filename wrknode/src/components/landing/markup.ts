export const landingBodyHtml = `
<canvas id="scene-canvas"></canvas>
<div id="warp-flash"></div>
<div id="warp-shockwave"></div>

<nav class="nav">
  <div class="wrap">
    <div class="logo">Wrknode</div>
    <div class="nav-links">
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#access">Early access</a>
      <a href="/login">Client Login</a>
    </div>
    <a href="#access" class="btn btn-primary">Get Early Access</a>
  </div>
</nav>

<section class="hero" id="hero">
  <div class="wrap">
    <div class="hero-copy">
      <div class="eyebrow">Built for teams who can't miss a lead</div>
      <h1 style="margin-top:16px;">
        <span class="kw">Never</span> <span class="kw">let</span> <span class="kw">a</span> <span class="kw">lead</span><br>
        <span class="kw">go</span> <span class="kw" style="font-style:italic;color:var(--brass-soft);">cold</span> <span class="kw">again.</span>
      </h1>
      <p class="sub">Wrknode replies the moment a lead arrives — from <span class="cycle-word" id="cycleWord">your website</span> — before they've even set their phone down.</p>
      <div class="hero-ctas">
        <a href="#access" class="btn btn-primary">Get Early Access</a>
        <a href="#how" class="btn btn-ghost">See how it works</a>
      </div>
      <div class="scroll-cue"><span>Scroll</span><span class="line"></span></div>
    </div>
  </div>
</section>

<section class="problem" id="problem">
  <div class="wrap">
    <div class="panel">
      <div class="eyebrow" style="color:var(--brick);">The problem</div>
      <h2>You already know this one.</h2>
      <p>A new lead comes in while you're mid-showing, or driving, or finally sitting down for dinner. By the time you're free to reply, they've already called the next agent on the list. It's not that you don't care — there just aren't enough hours between showings, open houses, and closings to reply to everyone the second they reach out.</p>
    </div>
  </div>
</section>

<section class="who" id="who">
  <div class="wrap">
    <div class="panel">
      <div class="eyebrow">Who it's for</div>
      <h2>Built for agents who can't drop everything.</h2>
      <div class="who-grid">
        <div class="who-item">
          <h3>Solo agents</h3>
          <p>Juggling showings, calls, and paperwork with no assistant to catch what you miss.</p>
        </div>
        <div class="who-item">
          <h3>Small teams</h3>
          <p>2-5 agents splitting leads who need every reply to feel just as fast and personal.</p>
        </div>
        <div class="who-item">
          <h3>Anyone running ads</h3>
          <p>Zillow, Facebook, or Google leads, where speed-to-lead decides whether that ad spend pays off.</p>
        </div>
      </div>
      <p class="who-note">Started with real estate, where speed-to-lead is make-or-break — but the same pattern applies to any business where a slow first reply loses the deal: contractors, clinics, salons, agencies, and more. If leads come in faster than you can reply, this is the gap Wrknode fills, whatever the industry.</p>
    </div>
  </div>
</section>

<section class="how" id="how">
  <div class="wrap">
    <div class="panel" style="position:relative;">
      <div class="floating-message" id="floatingMessage">
        "Hi Jane! Thanks for asking about 214 Maple St — I'd love to help. Are you free for a quick call this week?"
        <div class="fm-meta">✓ sent <span id="counterSeconds">0</span> seconds after lead came in</div>
      </div>
      <div class="eyebrow">How it works</div>
      <h2>Three steps. No typing required.</h2>
      <div class="steps">
        <div class="step">
          <div class="step-num">01</div>
          <h3>A lead reaches out</h3>
          <p>From your website, a listing site, or a Facebook ad — wherever they find you.</p>
        </div>
        <div class="step">
          <div class="step-num">02</div>
          <h3>Wrknode replies in seconds</h3>
          <p>A warm, personal-sounding message goes out immediately, referencing the listing they asked about.</p>
        </div>
        <div class="step">
          <div class="step-num">03</div>
          <h3>You take it from there</h3>
          <p>The lead lands in your dashboard, ready for you to follow up personally whenever you're free.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bento-section" id="included">
  <div class="wrap">
    <div class="eyebrow">What's included</div>
    <h2>Everything set up for you.</h2>
    <div class="bento">
      <div class="bento-card big">
        <div class="bento-icon"><span class="bento-ring"></span></div>
        <h3>Instant reply</h3>
        <p>Responds in seconds, any hour — nights, weekends, mid-showing.</p>
      </div>
      <div class="bento-card">
        <div class="bento-icon"><span class="bento-ring"></span></div>
        <h3>Works with your CRM</h3>
        <p>No need to switch tools or change how you work.</p>
      </div>
      <div class="bento-card">
        <div class="bento-icon"><span class="bento-ring"></span></div>
        <h3>We set it up</h3>
        <p>No forms to configure, no software to learn.</p>
      </div>
      <div class="bento-card wide">
        <div class="bento-icon"><span class="bento-ring"></span></div>
        <div>
          <h3>You stay in control</h3>
          <p>Every reply is reviewable, and you can take over any conversation anytime.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="faq" id="faq">
  <div class="wrap">
    <div class="panel">
      <div class="eyebrow">Questions</div>
      <h2>Before you ask.</h2>
      <div class="faq-list">
        <div class="faq-item">
          <h3>Will this sound like a robot?</h3>
          <p>No. Replies reference the specific listing or question the lead asked about, not a generic "thank you for your inquiry."</p>
        </div>
        <div class="faq-item">
          <h3>Do I need to change how I work?</h3>
          <p>No. Wrknode plugs into tools you already use — it doesn't ask you to switch your CRM or your process.</p>
        </div>
        <div class="faq-item">
          <h3>What if I want to jump in myself?</h3>
          <p>Every conversation is yours to take over any time. This handles the first response, not the whole relationship.</p>
        </div>
        <div class="faq-item">
          <h3>Is this only for real estate?</h3>
          <p>No — real estate is where we started because the pain is so clear-cut, but the same instant-reply pattern works for any business where a fast first response decides whether you win the customer.</p>
        </div>
        <div class="faq-item">
          <h3>Is this only for big brokerages?</h3>
          <p>No — built first for individual agents and small teams, not enterprise sales floors.</p>
        </div>
        <div class="faq-item">
          <h3>Do you sell my leads or data?</h3>
          <p>No. Your leads are yours. We don't sell or share your data with anyone.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="pricing" id="pricing">
  <div class="wrap">
    <div class="panel">
      <div class="eyebrow" style="text-align:center;">Pricing</div>
      <h2 style="text-align:center;">Built for you, priced for where you're working from.</h2>
      <div class="currency-toggle">
        <button class="currency-btn active" data-region="india" type="button">India</button>
        <button class="currency-btn" data-region="intl" type="button">International</button>
      </div>
      <div class="pricing-cards">
        <div class="price-card featured region-india">
          <div class="price-card-name">Full Package</div>
          <div class="price-amount">₹19,999<span class="price-period"> to start</span></div>
          <p class="price-desc">A complete automation build for your business — landing page, working automation, and setup, done end to end.</p>
          <ul class="price-features">
            <li>Custom-built around your actual workflow, not a template</li>
            <li>One clear project price, scoped before work begins</li>
            <li>Final price depends on complexity — quoted after a quick call</li>
          </ul>
          <a href="#access" class="btn btn-primary" style="width:100%;">Get Early Access</a>
        </div>
        <div class="price-card featured region-intl" style="display:none;">
          <div class="price-card-name">Hourly</div>
          <div class="price-amount">$45<span class="price-period">/hour</span></div>
          <p class="price-desc">Billed for the actual work: automation builds, AI agent setup, integrations, ongoing support.</p>
          <ul class="price-features">
            <li>Scoped time estimate before any work begins</li>
            <li>Pay only for hours actually worked</li>
            <li>Same rate for new builds and ongoing support</li>
          </ul>
          <a href="#access" class="btn btn-primary" style="width:100%;">Get Early Access</a>
        </div>
      </div>
      <p class="pricing-note">Early-stage pricing for first clients — these rates may adjust as the business grows.</p>
    </div>
  </div>
</section>

<section class="cta" id="access">
  <div class="wrap">
    <div class="panel">
      <div class="eyebrow">Early access</div>
      <h2>Be one of the first teams on Wrknode</h2>
      <p class="sub">We're setting up early access with a handful of real estate teams before opening this up more widely. Leave your details and we'll reach out personally.</p>

      <form class="signup" id="signupForm">
        <div class="field">
          <label for="name">Name</label>
          <input type="text" id="name" placeholder="Your name" required>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="you@example.com" required>
        </div>
        <div class="field">
          <label for="message">Tell us briefly what you need <span style="opacity:0.6">(optional)</span></label>
          <textarea id="message" rows="4" placeholder="What are you looking to automate?"></textarea>
        </div>
        <div class="form-error" id="formError">Please enter your name and a valid email.</div>
        <button type="submit" class="btn btn-primary" id="submitBtn">Get Early Access</button>
        <div class="form-note">No spam. We'll reach out personally about next steps.</div>
      </form>

      <div class="success-state" id="successState">
        <div class="check">✓</div>
        <h3 style="color: var(--paper); font-size: 1.3rem; font-weight: 500;">You're on the list.</h3>
        <p style="color: var(--lavender); margin-top: 10px;">We'll be in touch soon to get your team set up.</p>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="logo">Wrknode</div>
    <div class="tag">Automation for teams that can't afford to miss a lead.</div>
  </div>
</footer>
`;
