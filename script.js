document.documentElement.classList.add('js');

// Header: background once the page scrolls
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Full-screen menu
const menuBtn = document.querySelector('.menu-btn');
const overlay = document.getElementById('menu-overlay');
function setMenu(open) {
  overlay.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(overlay.hidden));
overlay.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) setMenu(false); });

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Active nav link
const links = [...document.querySelectorAll('.nav a')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navIo = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => navIo.observe(s));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form: no backend, so open the visitor's mail client with the details filled in
const form = document.querySelector('.contact-form');
const status = form.querySelector('.form-status');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('input[required]').forEach((input) => {
    const valid = input.value.trim() !== '' && input.checkValidity();
    input.closest('label').classList.toggle('invalid', !valid);
    if (!valid) ok = false;
  });
  if (!ok) { status.textContent = 'Please fill in your name and a valid email.'; return; }
  const d = Object.fromEntries(new FormData(form));
  const body = `Name: ${d.name}\nCompany: ${d.company}\nEmail: ${d.email}\nPhone: ${d.phone}`;
  window.location.href = `mailto:74ayalam@gmail.com?subject=${encodeURIComponent('New project – ' + d.name)}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Opening your email app…';
});
