/*
  Small JavaScript helpers only.
  No frameworks or build tools are required for GitHub Pages.

  Includes:
  - Mobile navigation
  - Scroll reveal animations
  - Active nav highlighting
  - QA terminal highlight loop
  - Floating Bug Hunt mini game
*/

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');
const revealElements = document.querySelectorAll('.reveal');
const yearElement = document.querySelector('#year');
const testLogItems = document.querySelectorAll('#test-log li');

// Set footer year automatically.
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Mobile navigation toggle.
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  });
}

// Close mobile menu after a navigation link is selected.
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    navMenu?.classList.remove('open');
    document.body.classList.remove('menu-open');
  });
});

// Reveal sections as the user scrolls.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => revealObserver.observe(element));

// Highlight the active navigation item based on scroll position.
const sections = document.querySelectorAll('main section[id]');

const activeSectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const isActive = link.getAttribute('href') === `#${activeId}`;
          link.classList.toggle('active', isActive);
        });
      }
    });
  },
  {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0
  }
);

sections.forEach((section) => activeSectionObserver.observe(section));

// Hero terminal effect: gently highlights one completed check at a time.
let activeLogIndex = 0;

function cycleTestLog() {
  if (!testLogItems.length) return;

  testLogItems.forEach((item) => item.classList.remove('highlight'));
  testLogItems[activeLogIndex].classList.add('highlight');
  activeLogIndex = (activeLogIndex + 1) % testLogItems.length;
}

cycleTestLog();
window.setInterval(cycleTestLog, 1400);

// Floating Bug Hunt game.
const arcade = document.querySelector('.floating-arcade');
const arcadeTab = document.querySelector('.arcade-tab');
const arcadeClose = document.querySelector('.arcade-close');
const canvas = document.querySelector('#bug-game');
const scoreElement = document.querySelector('#bug-score');
const escapedElement = document.querySelector('#bug-escaped');
const startButton = document.querySelector('#bug-start');
const resetButton = document.querySelector('#bug-reset');
const moveButtons = document.querySelectorAll('[data-move]');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (arcade && arcadeTab && arcadeClose) {
  arcadeTab.addEventListener('click', () => {
    arcade.classList.remove('collapsed');
    arcadeTab.setAttribute('aria-expanded', 'true');
  });

  arcadeClose.addEventListener('click', () => {
    arcade.classList.add('collapsed');
    arcadeTab.setAttribute('aria-expanded', 'false');
  });
}

if (canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const game = {
    running: false,
    score: 0,
    escaped: 0,
    frame: 0,
    tester: {
      x: width / 2 - 22,
      y: height - 34,
      width: 44,
      height: 18,
      speed: 22
    },
    bugs: [],
    keys: new Set(),
    animationId: null
  };

  function updateScoreboard() {
    if (scoreElement) scoreElement.textContent = String(game.score);
    if (escapedElement) escapedElement.textContent = String(game.escaped);
  }

  function createBug() {
    const size = 16 + Math.random() * 10;
    game.bugs.push({
      x: Math.random() * (width - size - 12) + 6,
      y: -size,
      size,
      speed: 0.65 + Math.random() * 1.2 + Math.min(game.score, 20) * 0.025,
      wobble: Math.random() * Math.PI * 2
    });
  }

  function drawBackground() {
    ctx.fillStyle = '#050712';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(124, 247, 212, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 204, 77, 0.9)';
    ctx.font = '12px monospace';
    ctx.fillText('BUILD: QA-LAB', 12, 19);
  }

  function drawTester() {
    const { x, y } = game.tester;

    // Platform.
    ctx.fillStyle = '#7cf7d4';
    ctx.fillRect(x, y + 10, game.tester.width, 8);

    // Tester head/body, drawn in a pixel-art style.
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(x + 16, y, 12, 12);
    ctx.fillStyle = '#ffcc4d';
    ctx.fillRect(x + 11, y + 12, 22, 6);

    // Magnifying glass.
    ctx.strokeStyle = '#ff6bd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 35, y + 4, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 39, y + 8);
    ctx.lineTo(x + 45, y + 14);
    ctx.stroke();
  }

  function drawBug(bug) {
    ctx.save();
    ctx.translate(bug.x + bug.size / 2, bug.y + bug.size / 2);

    ctx.fillStyle = '#ff5d73';
    ctx.fillRect(-bug.size / 2, -bug.size / 2, bug.size, bug.size);

    ctx.fillStyle = '#050712';
    ctx.fillRect(-bug.size / 4, -bug.size / 5, 3, 3);
    ctx.fillRect(bug.size / 5, -bug.size / 5, 3, 3);

    ctx.strokeStyle = '#ffcc4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-bug.size / 2, -2);
    ctx.lineTo(-bug.size / 2 - 5, -7);
    ctx.moveTo(bug.size / 2, -2);
    ctx.lineTo(bug.size / 2 + 5, -7);
    ctx.moveTo(-bug.size / 2, 4);
    ctx.lineTo(-bug.size / 2 - 5, 9);
    ctx.moveTo(bug.size / 2, 4);
    ctx.lineTo(bug.size / 2 + 5, 9);
    ctx.stroke();

    ctx.restore();
  }

  function drawIntro() {
    drawBackground();
    drawTester();
    ctx.fillStyle = '#f8fbff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Bug Hunt', 117, 82);
    ctx.fillStyle = 'rgba(170, 183, 216, 0.95)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Press Start Scan, arrows, or A/D.', 73, 106);
  }

  function clampTester() {
    game.tester.x = Math.max(6, Math.min(width - game.tester.width - 6, game.tester.x));
  }

  function moveTester(direction) {
    game.tester.x += direction === 'left' ? -game.tester.speed : game.tester.speed;
    clampTester();
    if (!game.running) drawIntro();
  }

  function resetGame() {
    game.running = false;
    game.score = 0;
    game.escaped = 0;
    game.frame = 0;
    game.bugs = [];
    game.tester.x = width / 2 - game.tester.width / 2;
    updateScoreboard();
    if (game.animationId) window.cancelAnimationFrame(game.animationId);
    drawIntro();
  }

  function updateGame() {
    if (!game.running) return;

    if (game.keys.has('ArrowLeft') || game.keys.has('a')) {
      game.tester.x -= 3.3;
    }
    if (game.keys.has('ArrowRight') || game.keys.has('d')) {
      game.tester.x += 3.3;
    }
    clampTester();

    game.frame += 1;
    const spawnEvery = Math.max(38, 92 - game.score * 2);
    if (game.frame % spawnEvery === 0) {
      createBug();
    }

    game.bugs.forEach((bug) => {
      bug.y += prefersReducedMotion ? 0.35 : bug.speed;
      bug.x += Math.sin(game.frame * 0.035 + bug.wobble) * 0.35;
    });

    game.bugs = game.bugs.filter((bug) => {
      const bugCenterX = bug.x + bug.size / 2;
      const bugBottom = bug.y + bug.size;
      const caught =
        bugBottom >= game.tester.y &&
        bugCenterX >= game.tester.x - 4 &&
        bugCenterX <= game.tester.x + game.tester.width + 4;

      if (caught) {
        game.score += 1;
        updateScoreboard();
        return false;
      }

      if (bug.y > height + 12) {
        game.escaped += 1;
        updateScoreboard();
        return false;
      }

      return true;
    });
  }

  function renderGame() {
    drawBackground();
    game.bugs.forEach(drawBug);
    drawTester();

    if (game.escaped >= 5) {
      ctx.fillStyle = 'rgba(5, 7, 18, 0.78)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffcc4d';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Regression found.', 103, 84);
      ctx.fillStyle = '#f8fbff';
      ctx.font = '12px sans-serif';
      ctx.fillText('Reset and run the scan again.', 83, 108);
      game.running = false;
      return;
    }

    game.animationId = window.requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    updateGame();
    renderGame();
  }

  function startGame() {
    if (game.running) return;
    game.running = true;
    if (!game.bugs.length) createBug();
    gameLoop();
  }

  startButton?.addEventListener('click', startGame);
  resetButton?.addEventListener('click', resetGame);

  moveButtons.forEach((button) => {
    button.addEventListener('click', () => {
      moveTester(button.dataset.move);
    });
  });

  // Click/tap a bug to remove it. Helpful on touch devices.
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const index = game.bugs.findIndex((bug) => {
      return x >= bug.x && x <= bug.x + bug.size && y >= bug.y && y <= bug.y + bug.size;
    });

    if (index >= 0) {
      game.bugs.splice(index, 1);
      game.score += 1;
      updateScoreboard();
    }
  });

  document.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'a', 'd', ' '];
    if (!keys.includes(event.key)) return;

    const focusIsInArcade = arcade?.contains(document.activeElement);
    if (!focusIsInArcade) return;

    event.preventDefault();

    if (event.key === ' ') {
      startGame();
      return;
    }

    game.keys.add(event.key);
  });

  document.addEventListener('keyup', (event) => {
    game.keys.delete(event.key);
  });

  // Open the game only after the user has scrolled a little, so the first view stays clean.
  let gameIntroduced = false;
  window.addEventListener('scroll', () => {
    if (gameIntroduced || !arcade) return;

    if (window.scrollY > 450) {
      arcade.classList.remove('collapsed');
      arcadeTab?.setAttribute('aria-expanded', 'true');
      gameIntroduced = true;
      drawIntro();
    }
  }, { passive: true });

  resetGame();
}
