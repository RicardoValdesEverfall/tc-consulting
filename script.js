(() => {
  "use strict";

  // ── Sticky nav: add hairline once scrolled past hero top ─────────────
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ── Mobile menu toggle ───────────────────────────────────────────────
  const menuBtn = document.querySelector("[data-menu-toggle]");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    // Close on link tap
    nav.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      })
    );
  }

  // ── Footer year ──────────────────────────────────────────────────────
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  // ── Hero card stack: click anywhere on it to swap (for touch users) ──
  const stack = document.querySelector("[data-stack]");
  if (stack) {
    stack.addEventListener("click", () => {
      stack.classList.toggle("is-flipped");
    });
  }

  // ── Reveal on scroll: opt-in via [data-reveal] attribute ─────────────
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.05 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
})();
