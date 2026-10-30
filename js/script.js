document.addEventListener('DOMContentLoaded', function () {
  // 1. Navbar background change on scroll & Up-Arrow button toggle
  const navbar = document.querySelector('.navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  function handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (navbar) {
      if (scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    if (scrollTopBtn) {
      if (scrollY > 280) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Scroll to top button action
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Auto close mobile navbar collapse upon menu item click
  const navCollapse = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link, .navbar .btn');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navCollapse && navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });

  // 2. WhatsApp Mini Chatbox Interactions
  const waCornerBtn = document.getElementById('waCornerBtn');
  const waChatbox = document.getElementById('waChatbox');
  const waCloseBtn = document.getElementById('waCloseBtn');
  const waSendMsgBtn = document.getElementById('waSendMsgBtn');
  const waChatInput = document.getElementById('waChatInput');
  const waChips = document.querySelectorAll('.wa-preset-chip');

  if (waCornerBtn && waChatbox) {
    waCornerBtn.addEventListener('click', function (e) {
      e.preventDefault();
      waChatbox.classList.toggle('open');
      if (waChatbox.classList.contains('open') && waChatInput) {
        waChatInput.focus();
      }
    });
  }

  if (waCloseBtn && waChatbox) {
    waCloseBtn.addEventListener('click', function () {
      waChatbox.classList.remove('open');
    });
  }

  // Quick preset chips inside mini chatbox
  waChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const text = this.getAttribute('data-msg');
      if (waChatInput && text) {
        waChatInput.value = text;
        waChatInput.focus();
      }
    });
  });

  function sendMiniChatWhatsApp() {
    if (!waChatInput) return;
    const msg = waChatInput.value.trim() || 'Hello ALLTOS, I would like to enquire about OEM bottled water for our event.';
    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/6593850165?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener');
    if (waChatbox) {
      waChatbox.classList.remove('open');
    }
  }

  if (waSendMsgBtn) {
    waSendMsgBtn.addEventListener('click', sendMiniChatWhatsApp);
  }

  if (waChatInput) {
    waChatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMiniChatWhatsApp();
      }
    });
  }

  // Close mini chatbox if user clicks outside
  document.addEventListener('click', function (e) {
    if (waChatbox && waChatbox.classList.contains('open')) {
      if (!waChatbox.contains(e.target) && !waCornerBtn.contains(e.target)) {
        waChatbox.classList.remove('open');
      }
    }
  });

  // 3. Client marquee auto-population
  const marqContainer = document.getElementById('marq');
  if (marqContainer) {
    const clientList = [
      'Joyalukkas', 'Animani', 'Royal', 'Isthara', 'DMY', 'Arthesdam',
      'GRT', 'Akshaya', 'Kuberan', 'Selvasegara', 'Alka', 'Minora',
      'Taste of India', 'A2B (Adyar Ananda Bhavan)', 'Nalan', 'Cali',
      'Casuarina Curry', 'Kailash Parbat', 'Anjappar', 'Dindigul Thalappakatti',
      'Swaadhisth', 'Brazil Kitchen', 'Saravanaa Bhavan', 'Kalam'
    ];
    const marqueeHtml = clientList.map(name => `${name}<i>&#9679;</i>`).join('');
    marqContainer.innerHTML = marqueeHtml + marqueeHtml;
  }

  // 4. Scroll Reveal and Counter Animation with Intersection Observer
  const revealElements = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);

          // Animate stat counters if present
          const counters = entry.target.querySelectorAll('.count');
          counters.forEach(counter => {
            const targetVal = parseInt(counter.getAttribute('data-to'), 10) || 0;
            animateCount(counter, 0, targetVal, 1500);
          });
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach((el, index) => {
      el.style.transitionDelay = `${(index % 4) * 80}ms`;
      observer.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver not available
    revealElements.forEach(el => el.classList.add('in'));
  }

  function animateCount(el, start, end, duration) {
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * easeOutQuad);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = end;
      }
    }
    requestAnimationFrame(update);
  }

  // 5. Advanced Quote Form Submission directly to WhatsApp
  const sendBtn = document.getElementById('send');
  const msgFeedback = document.getElementById('msg');
  if (sendBtn) {
    sendBtn.addEventListener('click', function () {
      const name = (document.getElementById('fn') ? document.getElementById('fn').value.trim() : '');
      const business = (document.getElementById('fb') ? document.getElementById('fb').value.trim() : 'N/A');
      const serviceType = (document.getElementById('ft') ? document.getElementById('ft').value : 'All Types of Events');
      const waterType = (document.getElementById('fw') ? document.getElementById('fw').value : 'Alkaline Drinking Water');
      const details = (document.getElementById('fm') ? document.getElementById('fm').value.trim() : 'N/A');

      if (!name) {
        if (msgFeedback) {
          msgFeedback.textContent = '⚠️ Please enter your name first.';
          msgFeedback.style.color = '#dc3545';
        }
        document.getElementById('fn').focus();
        return;
      }

      const textMessage = `Hello ALLTOS Private Limited,\n\nI would like to request an official quotation:\n\n👤 Name: ${name}\n🏢 Organization / Event: ${business}\n🎉 Event Category: ${serviceType}\n💧 Water Choice: ${waterType}\n📋 Quantity & Requirements: ${details}\n\nLooking forward to hearing from you!`;
      
      if (msgFeedback) {
        msgFeedback.textContent = '✅ Connecting to WhatsApp...';
        msgFeedback.style.color = '#198754';
      }

      const whatsappUrl = `https://wa.me/6593850165?text=${encodeURIComponent(textMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener');
    });
  }

  // 6. Interactive Floating Bubbles Canvas in Hero Background
  const canvas = document.getElementById('bubbles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    const bubbles = [];

    function resizeCanvas() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bubbleCount = window.innerWidth < 600 ? 18 : 35;
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random(),
        y: Math.random(),
        r: 2 + Math.random() * 7,
        speed: 0.0003 + Math.random() * 0.0007,
        drift: Math.random() * 6
      });
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      function drawBubbles(timestamp) {
        ctx.clearRect(0, 0, width, height);
        bubbles.forEach(b => {
          b.y -= b.speed * 16;
          if (b.y < -0.05) {
            b.y = 1.05;
            b.x = Math.random();
          }

          const currentX = b.x * width + Math.sin(timestamp / 900 + b.drift) * 14;
          const currentY = b.y * height;

          ctx.beginPath();
          ctx.arc(currentX, currentY, b.r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(160, 230, 245, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(currentX - b.r / 3, currentY - b.r / 3, b.r / 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fill();
        });
        requestAnimationFrame(drawBubbles);
      }
      requestAnimationFrame(drawBubbles);
    }
  }
});
