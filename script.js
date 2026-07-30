//  Shared script for index.html and project.html


document.addEventListener('DOMContentLoaded', () => {

  //  Loader: hide shortly after the page structure is ready, don't wait
  //  for every image/font/CDN request to finish (that caused the loader
  //  to get stuck, especially on slow mobile connections)
  const loader = document.querySelector('.loader');
  if (loader) {
    const hideLoader = () => loader.classList.add('is-hidden');
    setTimeout(hideLoader, 450);
    // absolute safety net in case something above throws before this runs
    window.addEventListener('load', hideLoader);
  }

  // Our Services carousels: JS-driven infinite marquee (2 rows, opposite
  // directions) so the arrow buttons can nudge the same motion smoothly
  // instead of fighting a CSS keyframe animation.
  const servicesRows = [
    { el: document.getElementById('servicesRow1'), reverse: false }, // left to right
    { el: document.getElementById('servicesRow2'), reverse: true },  // right to left
  ];

  servicesRows.forEach(row => {
    if (!row.el) return;
    const track = row.el.querySelector('.services-track');
    if (!track) return;

    const speed = 0.4; // px per frame at ~60fps
    let halfWidth = 0;
    // "offset" always counts up from 0 to halfWidth and wraps, regardless
    // of visual direction, to keep the arrow-nudge math simple.
    let offset = 0;
    let resumeTimeout = null;
    let rafId = null;

    const measure = () => {
      halfWidth = track.scrollWidth / 2;
    };
    measure();
    window.addEventListener('resize', measure);

    const wrap = () => {
      if (halfWidth <= 0) return;
      offset = ((offset % halfWidth) + halfWidth) % halfWidth;
    };

    const render = () => {
      // reverse=false (left to right): track starts fully shifted left and
      // eases back toward 0 as offset grows.
      // reverse=true (right to left): track starts at 0 and shifts left as
      // offset grows (same feel as the testimonials carousel).
      const x = row.reverse ? -offset : -(halfWidth - offset);
      track.style.transform = `translateX(${x}px)`;
    };

    const tick = () => {
      offset += speed;
      wrap();
      render();
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    start();

    row.el.addEventListener('mouseenter', stop);
    row.el.addEventListener('mouseleave', () => {
      if (!resumeTimeout) start();
    });
  });

  // Custom cursor: dot follows instantly, ring follows with a delay
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing && matchMedia('(hover: hover)').matches) {
    let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(animateRing);
    };
    animateRing();

    document.querySelectorAll('a, button, input, textarea, select').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-active'));
    });
  }

  //  Theme toggle, dark mode is the default 
  const root = document.documentElement;
  const themeToggle = document.querySelector('.theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('theme', next);
    });
  }

  //  Header: add a background once the page is scrolled 
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  //  Mobile nav drawer 
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeMenu = document.querySelector('.close-menu');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => mobileNav.classList.add('is-open'));
    if (closeMenu) closeMenu.addEventListener('click', () => mobileNav.classList.remove('is-open'));
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileNav.classList.remove('is-open'));
    });
  }

  //  Scroll reveal animations 
  const revealItems = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));

  // Active nav link highlighting while scrolling 
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach((section) => navObserver.observe(section));
  }

  //  Animated counters in the about stats boxes 
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(progress * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((counter) => counterObserver.observe(counter));

  // FAQ accordion 
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  //  Image lightbox for project thumbnails 
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.project-thumb img').forEach((img) => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('is-open');
        lightbox.scrollTop = 0;
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  //  Contact form: send via Web3Forms so messages actually arrive
  const contactForm = document.querySelector('.contact-form form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const button = contactForm.querySelector('button[type="submit"]');
      const originalText = button.innerHTML;
      button.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
      button.disabled = true;

      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());

      fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.success === false) {
            console.error('Web3Forms error response:', response.status, data);
            throw new Error(data.message || 'Network response was not ok');
          }
          return data;
        })
        .then(() => {
          button.innerHTML = 'Message sent <i class="fa-solid fa-check"></i>';
          contactForm.reset();
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 2500);
        })
        .catch((err) => {
          console.error('Contact form submit failed:', err);
          button.innerHTML = 'Failed, try again <i class="fa-solid fa-triangle-exclamation"></i>';
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 2500);
        });
    });
  }

  // auto-update footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Chat widget
  const chatToggle = document.getElementById('chatToggle');
  const chatPanel = document.getElementById('chatPanel');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  if (chatToggle && chatPanel && chatForm && chatInput && chatMessages) {
    const history = [];

    const scrollToBottom = () => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (text, role) => {
      const el = document.createElement('div');
      el.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;
      el.textContent = text;
      chatMessages.appendChild(el);
      scrollToBottom();
      return el;
    };

    const showTyping = () => {
      const el = document.createElement('div');
      el.className = 'chat-msg bot typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      chatMessages.appendChild(el);
      scrollToBottom();
      return el;
    };

    chatToggle.addEventListener('click', () => {
      const isOpen = chatPanel.classList.toggle('is-open');
      chatToggle.classList.toggle('is-open', isOpen);
      const chatHint = document.getElementById('chatHint');
      if (chatHint) chatHint.classList.add('is-dismissed');
      if (isOpen) chatInput.focus();
    });

    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      history.push({ role: 'user', content: text });
      chatInput.value = '';
      chatInput.disabled = true;

      const typingEl = showTyping();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        typingEl.remove();

        if (!res.ok) {
          addMessage(data.error || "Sorry, something went wrong. Please try again.", 'bot');
        } else {
          addMessage(data.reply, 'bot');
          history.push({ role: 'assistant', content: data.reply });
        }
      } catch (err) {
        typingEl.remove();
        addMessage("I couldn't connect just now. Please check your connection and try again, or email coderameen.ai@gmail.com.", 'bot');
      } finally {
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
  }

});
