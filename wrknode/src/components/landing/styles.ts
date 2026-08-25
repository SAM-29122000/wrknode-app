export const landingCss = `
  :root {
    --ink: #12172B;
    --ink-deep: #0B0F1E;
    --brass: #C9A24B;
    --brass-soft: #E4CE93;
    --paper: #F2EEE4;
    --lavender: #ADB4CC;
    --brick: #B8453D;
  }
  #landing-root * { box-sizing: border-box; }
  @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
  #landing-root { font-family: 'IBM Plex Sans', sans-serif; color: var(--paper); background: var(--ink-deep); -webkit-font-smoothing: antialiased; }
  #landing-root h1, #landing-root h2, #landing-root h3 { font-family: 'Fraunces', serif; margin: 0; line-height: 1.08; }
  #landing-root p { margin: 0; }
  #landing-root a { color: inherit; }
  #landing-root .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; color: var(--brass-soft); }
  #landing-root .wrap { max-width: 1080px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

  #scene-canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; display: block; }
  #warp-flash { position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0; background: radial-gradient(circle at 50% 50%, rgba(228,206,147,0.9), rgba(201,162,75,0.5) 40%, rgba(11,15,30,0) 72%); }
  #warp-shockwave { position: fixed; top: 50%; left: 50%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%; border: 2px solid var(--brass-soft); z-index: 51; pointer-events: none; opacity: 0; }

  @media (hover: hover) and (pointer: fine) {
    #landing-root, #landing-root a, #landing-root button, #landing-root input { cursor: none; }
  }
  .cursor-dot { position: fixed; top: 0; left: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--brass-soft); pointer-events: none; z-index: 200; transform: translate(-50%, -50%); }
  .cursor-ring { position: fixed; top: 0; left: 0; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(228,206,147,0.55); pointer-events: none; z-index: 199; transform: translate(-50%, -50%); transition: width 0.25s ease, height 0.25s ease, border-color 0.25s ease; }
  .cursor-ring.hover { width: 58px; height: 58px; border-color: var(--brass); }

  #landing-root .nav { position: sticky; top: 0; z-index: 20; background: rgba(11,15,30,0.55); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(201,162,75,0.18); }
  #landing-root .nav .wrap { display: flex; align-items: center; justify-content: space-between; height: 72px; gap: 20px; }
  #landing-root .logo { font-family: 'Fraunces', serif; font-size: 1.3rem; color: var(--brass-soft); font-weight: 600; }
  #landing-root .nav-links { display: flex; gap: 32px; align-items: center; }
  #landing-root .nav-links a { color: var(--lavender); text-decoration: none; font-size: 0.92rem; }
  #landing-root .nav-links a:hover { color: var(--brass-soft); }

  #landing-root .btn { display: inline-flex; align-items: center; justify-content: center; font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; font-size: 0.92rem; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; text-decoration: none; transition: box-shadow 0.15s ease; white-space: nowrap; }
  #landing-root .btn-primary { background: var(--brass); color: var(--ink-deep); }
  #landing-root .btn-primary:hover { box-shadow: 0 10px 26px rgba(201,162,75,0.4); }
  #landing-root .btn-primary:disabled { opacity: 0.6; cursor: default; box-shadow: none; }
  #landing-root .btn-ghost { background: transparent; color: var(--paper); border: 1px solid rgba(242,238,228,0.28); }
  #landing-root .btn-ghost:hover { border-color: var(--brass-soft); color: var(--brass-soft); }
  #landing-root .btn:focus-visible, #landing-root a:focus-visible, #landing-root input:focus-visible { outline: 2px solid var(--brass-soft); outline-offset: 3px; }

  #landing-root .hero { position: relative; min-height: 92vh; display: flex; align-items: center; padding: 140px 0 100px; }
  #landing-root .hero::before { content: ''; position: absolute; top: 50%; left: 50%; width: 1000px; height: 1000px; max-width: 160vw; background: radial-gradient(circle, rgba(201,162,75,0.22), rgba(201,162,75,0.06) 45%, transparent 68%); transform: translate(-50%, -50%); pointer-events: none; z-index: 0; }
  #landing-root .hero-copy { position: relative; z-index: 1; text-align: center; max-width: 780px; margin: 0 auto; }
  #landing-root .cycle-word { display: inline-block; color: var(--brass-soft); font-weight: 500; }
  #landing-root .hero h1 { font-size: clamp(2.4rem, 5.4vw, 4.2rem); font-weight: 480; color: var(--paper); text-shadow: 0 4px 40px rgba(0,0,0,0.6); perspective: 600px; }
  #landing-root .kw { display: inline-block; }
  #landing-root .hero p.sub { margin: 26px auto 0; font-size: 1.15rem; line-height: 1.6; color: var(--lavender); max-width: 46ch; text-shadow: 0 2px 20px rgba(0,0,0,0.6); }
  #landing-root .hero-ctas { margin-top: 36px; display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
  #landing-root .scroll-cue { margin-top: 64px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--lavender); font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.8; }
  #landing-root .scroll-cue .line { width: 1px; height: 34px; background: linear-gradient(var(--brass-soft), transparent); }

  #landing-root .panel { background: rgba(11,15,30,0.62); backdrop-filter: blur(6px); border: 1px solid rgba(201,162,75,0.14); border-radius: 28px; padding: 56px 48px; }

  #landing-root .problem { padding: 140px 0; }
  #landing-root .problem .wrap { max-width: 720px; }
  #landing-root .problem h2 { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 500; color: var(--paper); margin-top: 14px; }
  #landing-root .problem p { margin-top: 22px; font-size: 1.08rem; line-height: 1.75; color: var(--lavender); }

  #landing-root .who { padding: 20px 0 100px; }
  #landing-root .who-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 40px; }
  #landing-root .who-item h3 { color: var(--paper); font-size: 1.1rem; font-weight: 500; }
  #landing-root .who-item p { color: var(--lavender); margin-top: 10px; font-size: 0.95rem; line-height: 1.6; }
  #landing-root .who-note { margin-top: 40px; padding-top: 28px; border-top: 1px solid rgba(201,162,75,0.18); color: var(--lavender); font-size: 0.92rem; font-style: italic; line-height: 1.6; }
  @media (max-width: 860px) { #landing-root .who-grid { grid-template-columns: 1fr; } }

  #landing-root .how { padding: 160px 0 180px; position: relative; }
  #landing-root .how h2 { color: var(--paper); font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 500; margin-top: 14px; margin-bottom: 52px; }
  #landing-root .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; }
  #landing-root .step-num { font-family: 'Fraunces', serif; font-size: 2.4rem; color: var(--brass); font-weight: 500; }
  #landing-root .step h3 { color: var(--paper); font-size: 1.15rem; font-weight: 500; margin-top: 12px; }
  #landing-root .step p { color: var(--lavender); margin-top: 10px; font-size: 0.96rem; line-height: 1.6; }

  #landing-root .floating-message { position: absolute; right: 6%; top: -60px; width: 280px; padding: 20px 22px; background: rgba(18,23,43,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(201,162,75,0.35); border-radius: 16px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); font-size: 0.92rem; line-height: 1.55; color: var(--paper); opacity: 0; z-index: 2; }
  #landing-root .floating-message .fm-meta { font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; color: var(--brass-soft); margin-top: 12px; }

  #landing-root .bento-section { padding: 20px 0 100px; }
  #landing-root .bento-section h2 { margin-top: 14px; margin-bottom: 40px; }
  #landing-root .bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  #landing-root .bento-card { background: rgba(11,15,30,0.55); backdrop-filter: blur(6px); border: 1px solid rgba(201,162,75,0.16); border-radius: 20px; padding: 28px; }
  #landing-root .bento-card.big { grid-column: span 2; grid-row: span 2; display: flex; flex-direction: column; justify-content: center; }
  #landing-root .bento-card.wide { grid-column: span 4; display: flex; align-items: center; gap: 20px; }
  #landing-root .bento-card.wide .bento-icon { margin-bottom: 0; flex-shrink: 0; }
  #landing-root .bento-ring { display: inline-block; width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--brass); position: relative; margin-bottom: 16px; }
  #landing-root .bento-ring::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: var(--brass-soft); opacity: 0.75; }
  #landing-root .bento-card h3 { color: var(--paper); font-size: 1.05rem; font-weight: 500; }
  #landing-root .bento-card p { color: var(--lavender); margin-top: 8px; font-size: 0.92rem; line-height: 1.55; }
  @media (max-width: 860px) {
    #landing-root .bento { grid-template-columns: 1fr 1fr; }
    #landing-root .bento-card.big { grid-row: span 1; }
    #landing-root .bento-card.wide { grid-column: span 2; flex-direction: column; align-items: flex-start; }
  }

  #landing-root .faq { padding: 20px 0 100px; }
  #landing-root .faq-list { margin-top: 36px; display: flex; flex-direction: column; gap: 28px; }
  #landing-root .faq-item h3 { color: var(--brass-soft); font-size: 1.05rem; font-weight: 500; font-family: 'IBM Plex Sans', sans-serif; }
  #landing-root .faq-item p { color: var(--lavender); margin-top: 8px; font-size: 0.95rem; line-height: 1.6; }

  #landing-root .pricing { padding: 20px 0 100px; }
  #landing-root .pricing-body { color: var(--lavender); margin-top: 20px; font-size: 1.02rem; line-height: 1.7; max-width: 55ch; margin-left: auto; margin-right: auto; }
  #landing-root .currency-toggle { display: flex; justify-content: center; gap: 10px; margin: 28px 0 8px; }
  #landing-root .currency-btn { background: rgba(242,238,228,0.06); border: 1px solid rgba(242,238,228,0.18); color: var(--lavender); padding: 8px 18px; border-radius: 999px; font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease; }
  #landing-root .currency-btn.active { background: var(--brass); color: var(--ink-deep); border-color: var(--brass); }
  #landing-root .pricing-cards { display: flex; justify-content: center; margin-top: 36px; text-align: left; }
  #landing-root .price-card { max-width: 420px; width: 100%; background: rgba(11,15,30,0.5); border: 1px solid rgba(201,162,75,0.16); border-radius: 20px; padding: 32px 28px; }
  #landing-root .price-card.featured { border-color: var(--brass); background: rgba(201,162,75,0.07); }
  #landing-root .price-card-name { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brass-soft); }
  #landing-root .price-amount { margin-top: 12px; font-family: 'Fraunces', serif; font-size: 2.3rem; color: var(--paper); font-weight: 500; }
  #landing-root .price-period { font-family: 'IBM Plex Sans', sans-serif; font-size: 0.95rem; color: var(--lavender); font-weight: 400; }
  #landing-root .price-desc { margin-top: 10px; color: var(--lavender); font-size: 0.9rem; }
  #landing-root .price-features { list-style: none; padding: 0; margin: 20px 0; display: flex; flex-direction: column; gap: 10px; }
  #landing-root .price-features li { color: var(--paper); font-size: 0.88rem; padding-left: 20px; position: relative; }
  #landing-root .price-features li::before { content: '✓'; position: absolute; left: 0; color: var(--brass); }
  #landing-root .pricing-note { text-align: center; margin-top: 28px; color: var(--lavender); font-size: 0.85rem; }
  @media (max-width: 860px) { #landing-root .pricing-cards { grid-template-columns: 1fr; } }

  #landing-root .cta { padding: 160px 0 140px; }
  #landing-root .cta .wrap { max-width: 560px; text-align: center; }
  #landing-root .cta h2 { color: var(--paper); font-size: clamp(1.9rem, 3.4vw, 2.6rem); font-weight: 500; margin-top: 14px; }
  #landing-root .cta p.sub { color: var(--lavender); margin-top: 16px; font-size: 1.02rem; line-height: 1.6; }
  #landing-root form.signup { margin-top: 34px; display: flex; flex-direction: column; gap: 12px; text-align: left; }
  #landing-root .field label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--lavender); margin-bottom: 6px; }
  #landing-root .field input, #landing-root .field textarea { width: 100%; padding: 13px 14px; border-radius: 8px; border: 1px solid rgba(242,238,228,0.22); background: rgba(242,238,228,0.06); color: var(--paper); font-family: 'IBM Plex Sans', sans-serif; font-size: 0.98rem; resize: vertical; }
  #landing-root .field input::placeholder { color: rgba(242,238,228,0.35); }
  #landing-root .signup .btn-primary { margin-top: 8px; padding: 14px; font-size: 1rem; }
  #landing-root .form-note { margin-top: 14px; font-size: 0.82rem; color: var(--lavender); text-align: center; }
  #landing-root .form-error { color: #E8837A; font-size: 0.85rem; display: none; }
  #landing-root .success-state { display: none; margin-top: 8px; }
  #landing-root .success-state.show { display: block; }
  #landing-root .success-state .check { width: 46px; height: 46px; border-radius: 50%; background: var(--brass); color: var(--ink-deep); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 1.3rem; }

  #landing-root footer { padding: 44px 0 60px; }
  #landing-root footer .wrap { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  #landing-root footer .logo { font-size: 1.05rem; }
  #landing-root footer .tag { color: var(--lavender); font-size: 0.85rem; }

  @media (max-width: 860px) {
    #landing-root .steps { grid-template-columns: 1fr; gap: 40px; }
    #landing-root .nav-links { display: none; }
    #landing-root .floating-message { position: static; width: 100%; margin-bottom: 40px; opacity: 1 !important; }
    #landing-root .panel { padding: 36px 26px; border-radius: 20px; }
    #landing-root .hero { min-height: auto; padding: 120px 0 70px; }
  }
`;
