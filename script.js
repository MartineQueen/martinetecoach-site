/* ==========================================================================
   Martine prend sa place — animations (GSAP + ScrollTrigger + Lenis)
   Respecte prefers-reduced-motion : si activé, tout s'affiche direct, sans animation.
   ========================================================================== */

/* -------------------- Correctif zoom résiduel après le popup Calendly --------------------
   Bug connu iOS Safari : le champ de saisie dans l'iframe Calendly déclenche le
   zoom auto au focus, et le navigateur ne dézoome pas toujours en refermant le
   popup. On force un reset du viewport dès que Calendly signale la fermeture
   (ou une réservation confirmée). */
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://calendly.com') return;
  if (!e.data || !e.data.event || e.data.event.indexOf('calendly') !== 0) return;
  if (e.data.event === 'calendly.popup_widget_closed' || e.data.event === 'calendly.event_scheduled') {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;
    const original = viewport.getAttribute('content');
    viewport.setAttribute('content', original + ', maximum-scale=1.0');
    setTimeout(() => viewport.setAttribute('content', original), 300);
  }
});

/* -------------------- Google Analytics --------------------
   Bandeau de consentement retiré (choix de Marine, 2026-09-07) : GA4 se
   charge directement au chargement de la page, sans demander l'accord. */
const GA_MEASUREMENT_ID = 'G-YCLN8DN1E5';

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.indexOf('XXXX') !== -1) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

/* -------------------- Tracking clic "Réserver un appel" --------------------
   Un seul listener délégué sur tous les boutons Calendly (peu importe la page
   ou le libellé) : envoie un événement GA4 juste avant que le popup Calendly
   ne s'ouvre. Si le consentement n'a pas été donné, gtag n'existe pas encore :
   on ne fait rien, silencieusement. */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="calendly.com"]');
  if (!link) return;
  if (typeof gtag === 'function') {
    gtag('event', 'click_book_call', {
      link_url: link.getAttribute('href'),
      link_text: link.textContent.trim(),
      page_path: window.location.pathname,
    });
  }
});

loadGoogleAnalytics();

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------- Menu mobile : hamburger -------------------- */
  /* Indépendant de GSAP et de prefers-reduced-motion : c'est de la navigation,
     pas une animation décorative, donc ça doit marcher même si le reste plante. */
  const navToggle = document.querySelector('.nav-toggle');
  const navOverlay = document.querySelector('[data-nav-overlay]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const navClose = document.querySelector('[data-nav-close]');
  /* Le tiroir (.mobile-menu) est rendu en dehors du <header> exprès : un
     descendant position:fixed d'un ancêtre avec backdrop-filter (l'effet
     verre dépoli du header) se retrouve coincé dans les dimensions de cet
     ancêtre sous Safari. D'où le pilotage via ses propres classes plutôt
     que via .main-nav. */
  if (navToggle && mobileMenu) {
    const closeNav = (opts) => {
      const wasOpen = navToggle.classList.contains('is-active');
      navToggle.classList.remove('is-active');
      navToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('is-open');
      if (navOverlay) navOverlay.classList.remove('is-visible');
      // Rend le focus clavier au bouton hamburger en refermant, sauf si on
      // vient de cliquer un lien (la page change, pas la peine).
      if (wasOpen && !(opts && opts.skipFocus)) navToggle.focus();
    };
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navToggle.classList.toggle('is-active');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.classList.toggle('is-open', isOpen);
      if (navOverlay) navOverlay.classList.toggle('is-visible', isOpen);
      // Focus clavier envoyé dans le tiroir dès qu'il s'ouvre.
      if (isOpen && navClose) navClose.focus();
    });
    if (navClose) navClose.addEventListener('click', closeNav);
    if (navOverlay) navOverlay.addEventListener('click', closeNav);
    mobileMenu.querySelectorAll('.nav-link, .nav-cta-mobile').forEach((link) => {
      link.addEventListener('click', () => closeNav({ skipFocus: true }));
    });
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* -------------------- CTA sticky mobile : masqué près d'un autre CTA --------------------
     Évite d'avoir le CTA sticky ET un autre CTA (hero, cartes offres/interventions)
     visibles en même temps (redondant). Ne s'affiche qu'une fois qu'on a déjà VU
     un de ces CTA et qu'on l'a quitté en scrollant : sinon il apparaît à tort dès
     le chargement, tant que le CTA du hero n'a pas encore atteint le viewport
     (juste sous le pli sur petit écran). Indépendant de GSAP, comme le menu
     mobile, pour continuer à marcher même si les animations plantent. */
  const stickyCta = document.querySelector('.mobile-sticky-cta');
  const stickyHideZones = document.querySelectorAll('#offres, .hero-cta');
  if (stickyCta && stickyHideZones.length && 'IntersectionObserver' in window) {
    const visibleZones = new Set();
    const seenZones = new Set();
    const stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleZones.add(entry.target);
          seenZones.add(entry.target);
        } else {
          visibleZones.delete(entry.target);
        }
      });
      const shouldShow = seenZones.size > 0 && visibleZones.size === 0;
      stickyCta.classList.toggle('is-hidden', !shouldShow);
    }, { threshold: 0.2 });
    stickyHideZones.forEach((zone) => stickyObserver.observe(zone));
  }

  /* -------------------- Formulaire de contact (Netlify Forms, sans rechargement) --------------------
     Indépendant de GSAP, comme le menu mobile et le CTA sticky, pour continuer
     à marcher même si les animations plantent. Validation 100% custom (form en
     novalidate) pour remplacer les bulles génériques du navigateur par des
     messages dans le ton du site. En cas d'échec du fetch (offline, CDN, etc.),
     on retombe sur un submit natif classique. */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const fields = {
      prenom: {
        input: document.getElementById('cf-name'),
        error: document.getElementById('err-prenom'),
        validate: (v) => (v.trim() ? '' : "Oups, comment je t'appelle sans prénom ?"),
      },
      email: {
        input: document.getElementById('cf-email'),
        error: document.getElementById('err-email'),
        validate: (v) => {
          if (!v.trim()) return "Il me faut ton email, sinon comment je te réponds ?";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Cet email a pas l'air correct, tu peux vérifier ?";
          return '';
        },
      },
      message: {
        input: document.getElementById('cf-message'),
        error: document.getElementById('err-message'),
        validate: (v) => (v.trim() ? '' : "Écris-moi un mot, même court, je veux savoir ce qui t'amène !"),
      },
    };

    const clearFieldError = (field) => {
      field.error.textContent = '';
      field.input.closest('.form-group').classList.remove('has-error');
    };
    const setFieldError = (field, message) => {
      field.error.textContent = message;
      field.input.closest('.form-group').classList.add('has-error');
    };

    Object.values(fields).forEach((field) => {
      if (!field.input) return;
      field.input.addEventListener('input', () => clearFieldError(field));
    });

    const modalOverlay = document.getElementById('contact-modal-overlay');
    const modalClose = document.getElementById('contact-modal-close');
    const modalOk = document.getElementById('contact-modal-ok');
    const openModal = () => {
      if (!modalOverlay) return;
      modalOverlay.hidden = false;
      // Un frame pour laisser le navigateur peindre hidden -> block avant la transition d'opacité.
      requestAnimationFrame(() => modalOverlay.classList.add('is-visible'));
      document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      if (!modalOverlay) return;
      modalOverlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      setTimeout(() => { modalOverlay.hidden = true; }, 250);
    };
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOk) modalOk.addEventListener('click', closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay && !modalOverlay.hidden) closeModal();
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;
      Object.values(fields).forEach((field) => {
        if (!field.input) return;
        const message = field.validate(field.input.value);
        if (message) {
          setFieldError(field, message);
          if (!firstInvalid) firstInvalid = field.input;
        } else {
          clearFieldError(field);
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      /* Formspree (plus Netlify) : on poste en FormData brut (pas de Content-Type
         manuel, le navigateur pose lui-même le bon boundary multipart), avec
         Accept: application/json pour recevoir une réponse JSON plutôt qu'une
         redirection vers la page de remerciement par défaut de Formspree. */
      fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Réponse non OK');
          contactForm.reset();
          if (submitBtn) submitBtn.disabled = false;
          openModal();
        })
        .catch(() => {
          if (submitBtn) submitBtn.disabled = false;
          contactForm.submit();
        });
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduced-motion');
    return;
  }

  /* Filet de sécurité : si GSAP/ScrollTrigger ne sont pas chargés (CDN en
     panne, coupure réseau) ou qu'une erreur survient plus bas, on retire
     .js-anim pour que le contenu (caché en opacity:0 en attendant l'animation)
     redevienne visible, plutôt que de rester invisible indéfiniment. */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.documentElement.classList.remove('js-anim');
    return;
  }

  try {

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ force3D: true }); // compositing GPU, évite les reflows coûteux au scroll

  /* Les logos presse et autres visuels plus bas dans la page (souvent en
     lazy-load) arrivent après le calcul initial des positions de déclenchement
     ScrollTrigger. Sans recalcul, les triggers situés après ces images
     (compteurs Instagram, etc.) se retrouvent décalés et peuvent ne jamais
     se déclencher au bon moment. On force un refresh une fois tout chargé. */
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* Scroll natif du navigateur (pas de librairie de smooth-scroll type Lenis) :
     c'est ce qui donne la sensation la plus fluide et la plus réactive au
     trackpad, sans le temps de latence/résistance qu'un scroll "virtuel"
     ajoute quand on change de sens. Les animations ci-dessous se déclenchent
     simplement sur le scroll natif via ScrollTrigger. */

  /* -------------------- Header : ombre au scroll -------------------- */
  const header = document.querySelector('[data-header]');
  if (header) {
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => {
        header.classList.toggle('is-scrolled', self.scroll() > 80);
      },
    });
  }

  /* -------------------- Reveal simple : [data-reveal] --------------------
     toggleActions "play none none none" : l'animation ne se joue qu'une fois,
     elle ne se rejoue pas en boucle quand on remonte/redescend.
     will-change n'est posé que juste avant l'animation (pas sur les dizaines
     d'éléments dès le chargement) pour éviter de créer trop de calques GPU
     d'un coup, une autre cause classique de ralentissement au scroll. */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.set(el, { willChange: 'opacity, transform' });
        /* Le badge "Sur candidature" a sa propre rotation de repos (-11deg,
           voir .candidature-badge). L'état caché [data-reveal] ne connaît
           que translateY, donc sans ça le badge apparaît bien droit puis
           saute d'un coup à -11deg à la fin de l'animation. On demande à
           GSAP d'animer la rotation en même temps que le slide pour que le
           badge se penche progressivement au lieu de sauter. */
        const tweenVars = {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          /* On nettoie aussi opacity/transform (pas juste willChange) : sinon
             GSAP laisse un style inline après l'animation, qui gagne toujours
             face aux règles CSS classiques (ex: :hover) même une fois l'entrée
             terminée. La classe is-revealed prend le relais côté CSS pour
             garder l'état final visible sans ce style inline. */
          clearProps: 'willChange,opacity,transform',
          onComplete: () => el.classList.add('is-revealed'),
        };
        if (el.classList.contains('candidature-badge')) tweenVars.rotation = -11;
        gsap.to(el, tweenVars);
      },
    });
  });

  /* -------------------- Reveal en cascade : [data-reveal-stagger] -------------------- */
  const staggerGroups = new Map();
  document.querySelectorAll('[data-reveal-stagger]').forEach((el) => {
    const parent = el.parentElement;
    if (!staggerGroups.has(parent)) staggerGroups.set(parent, []);
    staggerGroups.get(parent).push(el);
  });
  staggerGroups.forEach((items) => {
    ScrollTrigger.create({
      trigger: items[0].parentElement,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.12,
        });
      },
    });
  });

  /* -------------------- Hero : titre qui claque, mot par mot --------------------
     Travaille uniquement sur le texte des .split-line (pas d'innerHTML brut),
     jamais de risque de casser une balise existante. */
  document.querySelectorAll('[data-reveal-split]').forEach((el) => {
    const lines = el.querySelectorAll(':scope > .split-line');
    const targets = lines.length ? Array.from(lines) : [el];
    const accentPhrase = el.dataset.accentWord || '';
    const accentWords = new Set(accentPhrase.split(' ').filter(Boolean));

    targets.forEach((line) => {
      const words = line.textContent
        .split(' ')
        .filter(Boolean)
        .map((word) => {
          const normalized = word.replace(/\u00a0/g, ' ');
          const isAccent = accentWords.has(normalized) || normalized === accentPhrase;
          const cls = isAccent ? 'split-word split-word-accent' : 'split-word';
          return `<span class="${cls}">${word}</span>`;
        })
        .join(' ');
      line.innerHTML = words;
    });

    const wordEls = el.querySelectorAll('.split-word');
    gsap.set(wordEls, { display: 'inline-block' });
    gsap.set(el, { opacity: 1 });
    gsap.from(wordEls, {
      opacity: 0,
      y: 30,
      rotate: 3,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.05,
      delay: 0.1,
    });
  });

  /* -------------------- Compteurs animés : [data-counter] -------------------- */
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const isDecimal = String(target).includes('.');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const counter = { value: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          value: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            const formatted = isDecimal
              ? counter.value.toFixed(1).replace('.', ',')
              : Math.round(counter.value).toLocaleString('fr-FR');
            el.textContent = prefix + formatted + suffix;
          },
        });
      },
    });
  });

  /* -------------------- Slider avis : boutons précédent/suivant -------------------- */
  const commentsWrap = document.querySelector('.comments-grid-wrap');
  const commentsSlider = document.querySelector('.comments-grid');
  const commentsBtnNext = document.querySelector('.comments-scroll-btn.is-next');
  const commentsBtnPrev = document.querySelector('.comments-scroll-btn.is-prev');
  if (commentsWrap && commentsSlider && commentsBtnNext && commentsBtnPrev) {
    commentsBtnNext.addEventListener('click', () => {
      commentsSlider.scrollBy({ left: 280, behavior: 'smooth' });
    });
    commentsBtnPrev.addEventListener('click', () => {
      commentsSlider.scrollBy({ left: -280, behavior: 'smooth' });
    });
    const updateCommentsBtns = () => {
      const maxScroll = commentsSlider.scrollWidth - commentsSlider.clientWidth;
      const atStart = commentsSlider.scrollLeft <= 4;
      const atEnd = commentsSlider.scrollLeft >= maxScroll - 4;
      commentsBtnNext.style.opacity = atEnd ? '0' : '1';
      commentsBtnNext.style.pointerEvents = atEnd ? 'none' : 'auto';
      commentsBtnPrev.style.opacity = atStart ? '0' : '1';
      commentsBtnPrev.style.pointerEvents = atStart ? 'none' : 'auto';
      commentsWrap.classList.toggle('is-end', atEnd);
      commentsWrap.classList.toggle('is-scrolled', !atStart);
    };
    commentsSlider.addEventListener('scroll', updateCommentsBtns);
    updateCommentsBtns();
  }

  } catch (err) {
    // Si une erreur survient dans l'init des animations, on ne laisse pas
    // le contenu caché : on retire .js-anim pour tout réafficher direct.
    document.documentElement.classList.remove('js-anim');
    console.error('Animation init failed, contenu affiché sans animation :', err);
  }

  /* -------------------- Témoignages : "Voir plus" synchro + hauteur des cartes --------------------
     Sur desktop (cartes côte à côte), un clic sur "Voir plus" déplie TOUTES les
     cartes de la grille ensemble et on remesure la hauteur naturelle de chaque
     bloc .temoignage-preview-top pour garder les pastilles alignées. Sur mobile
     (cartes empilées), chaque carte se déplie indépendamment : pas besoin de
     synchroniser puisqu'il n'y a plus d'alignement horizontal à préserver. */
  const isDesktopQuotes = () => window.matchMedia('(min-width: 701px)').matches;
  document.querySelectorAll('.temoignage-preview-grid').forEach((grid) => {
    const tops = grid.querySelectorAll('.temoignage-preview-top');
    if (!tops.length) return;
    const syncHeights = () => {
      tops.forEach((t) => { t.style.minHeight = ''; });
      if (!isDesktopQuotes()) return;
      const max = Math.max(...[...tops].map((t) => t.offsetHeight));
      tops.forEach((t) => { t.style.minHeight = `${max}px`; });
    };
    grid.addEventListener('click', (e) => {
      const toggle = e.target.closest('.js-quote-toggle');
      if (!toggle) return;
      if (isDesktopQuotes()) {
        grid.classList.toggle('quotes-expanded');
      } else {
        toggle.closest('.temoignage-preview-card').classList.toggle('quotes-expanded');
      }
      syncHeights();
    });
    window.addEventListener('resize', syncHeights);
    syncHeights();
  });

});
