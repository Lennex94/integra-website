const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#navigation');function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus()}});document.addEventListener('click',e=>{if(!e.target.closest('header'))closeMenu()});matchMedia('(min-width:721px)').addEventListener('change',e=>{if(e.matches)closeMenu()});

// Store only the visitor's acknowledgment, never analytics or marketing consent.
const privacyDialog = document.querySelector('.privacy-dialog');
const noticeKey = 'integra-privacy-notice';
const noticeVersion = 1;
const noticeLifetime = 183 * 24 * 60 * 60 * 1000;
let lastPrivacyTrigger = null;
let experienceStarted = false;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  document.body.classList.add('experience-ready');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) return;
  const reveals = [...document.querySelectorAll('.section-heading, .service, .process-intro, .step, .company-preview>div, .contact-strip>*, .values article, .detail-content>div, .related a, .contact-primary, .contact-info')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-in');
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * .92) return;
    el.classList.add('reveal-pending');
    if (el.classList.contains('service')) {
      const siblings = [...el.parentElement.children];
      const columns = innerWidth > 720 ? 3 : 1;
      el.style.setProperty('--reveal-delay', `${siblings.indexOf(el) % columns * 90}ms`);
    }
    observer.observe(el);
  });
  reduceMotion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      reveals.forEach(el => el.classList.remove('reveal-pending'));
    }
  });
}
function openPrivacy(trigger) {
  if (!privacyDialog || privacyDialog.open) return;
  lastPrivacyTrigger = trigger || null;
  privacyDialog.showModal();
  document.body.classList.add('privacy-active');
}
// file:// pages can have separate storage areas. Carry the original receipt
// across internal links as a fallback, including links opened in another tab.
function validReceipt(timestamp) {
  const age = Date.now() - timestamp;
  return Number.isSafeInteger(timestamp) && age >= 0 && age < noticeLifetime;
}
function saveReceipt(timestamp) {
  try {
    localStorage.setItem(noticeKey, JSON.stringify({version: noticeVersion, acknowledgedAt: timestamp}));
    return true;
  } catch (_) { return false; }
}
function carryReceipt(timestamp) {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!/^[a-z-]+\.html(?:[?#]|$)/.test(href)) return;
    const url = new URL(href, location.href);
    url.searchParams.set('hinweis', String(timestamp));
    link.href = url.href;
  });
  try {
    const current = new URL(location.href);
    current.searchParams.set('hinweis', String(timestamp));
    history.replaceState(history.state, '', current.href);
  } catch (_) { /* Internal links still carry the receipt. */ }
}
function rememberNotice(timestamp) {
  const saved = saveReceipt(timestamp);
  if (!saved || location.protocol === 'file:') carryReceipt(timestamp);
}
function acknowledgePrivacy() {
  rememberNotice(Date.now());
  privacyDialog.close();
}
privacyDialog?.addEventListener('cancel', event => {
  event.preventDefault();
  acknowledgePrivacy();
});
privacyDialog?.querySelector('.privacy-confirm').addEventListener('click', acknowledgePrivacy);
privacyDialog?.addEventListener('close', () => {
  document.body.classList.remove('privacy-active');
  startExperience();
  if (lastPrivacyTrigger) lastPrivacyTrigger.focus();
});
document.querySelectorAll('.privacy-open').forEach(button => button.addEventListener('click', () => openPrivacy(button)));
let acknowledged = false;
try {
  const stored = JSON.parse(localStorage.getItem(noticeKey));
  const age = Date.now() - stored?.acknowledgedAt;
  acknowledged = stored?.version === noticeVersion && Number.isFinite(age) && age >= 0 && age < noticeLifetime;
} catch (_) { /* Fall back to displaying the notice. */ }
// Keep the legal information readable even before the notice is acknowledged.
const carried = Number(new URL(location.href).searchParams.get('hinweis'));
if (validReceipt(carried)) {
  acknowledged = true;
  rememberNotice(carried);
} else if (acknowledged && location.protocol === 'file:') {
  carryReceipt(JSON.parse(localStorage.getItem(noticeKey)).acknowledgedAt);
}
const legalPage = /(?:datenschutz|impressum)\.html$/.test(location.pathname);
if (acknowledged || legalPage) startExperience(); else openPrivacy();
const siteHeader = document.querySelector('header');
const progress = document.querySelector('.reading-progress span');
let scrollFrame = false;
function updateScroll() {
  const y = window.scrollY;
  siteHeader.classList.toggle('is-scrolled', y > 45);
  const available = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, y / available)) : 0})`;
  scrollFrame = false;
}
addEventListener('scroll', () => { if (!scrollFrame) { scrollFrame = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll, { passive: true });
updateScroll();
if ('IntersectionObserver' in window) {
  const stepObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-current', entry.isIntersecting)), { rootMargin: '-20% 0px -30% 0px', threshold: .3 });
  document.querySelectorAll('.step').forEach(step => stepObserver.observe(step));
}
