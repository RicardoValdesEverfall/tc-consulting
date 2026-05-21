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

  // ── Booking calendar ─────────────────────────────────────────────────
  const calRoot = document.querySelector("[data-calendar]");
  if (calRoot) {
    const SLOTS = [
      { label: "9:00 AM",  start: "09:00", end: "09:30" },
      { label: "11:30 AM", start: "11:30", end: "12:00" },
      { label: "2:00 PM",  start: "14:00", end: "14:30" },
      { label: "4:30 PM",  start: "16:30", end: "17:00" },
    ];
    const BOOKING_EMAIL = "info@tccgroup.ca";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const earliestBookable = new Date(today);
    earliestBookable.setDate(today.getDate() + 7);

    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();

    const daysEl = calRoot.querySelector("[data-cal-days]");
    const monthEl = calRoot.querySelector("[data-cal-month]");
    const prevBtn = calRoot.querySelector("[data-cal-prev]");
    const nextBtn = calRoot.querySelector("[data-cal-next]");

    const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
    const isAvailable = (d) => d.getTime() >= earliestBookable.getTime() && !isWeekend(d);
    const formatDate = (d) => d.toLocaleDateString("en-CA", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    function bookSlot(date, slot) {
      const subject = `Discovery call request: ${formatDate(date)} at ${slot.label}`;
      const body =
        `Hi Ricardo,\n\n` +
        `I'd like to book a free 30-minute discovery call on ${formatDate(date)} at ${slot.label} Eastern (${slot.start}-${slot.end}).\n\n` +
        `A bit about my business and what I'd like to discuss:\n\n\n` +
        `Thanks,\n`;
      window.location.href =
        `mailto:${BOOKING_EMAIL}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
    }

    let activeCell = null;

    function closeSlots() {
      if (!activeCell) return;
      activeCell.classList.remove("booker__day--active");
      const popover = activeCell.querySelector(".booker__slots");
      if (popover) popover.remove();
      activeCell = null;
    }

    function openSlots(cell, date) {
      if (activeCell === cell) return;
      closeSlots();
      activeCell = cell;
      cell.classList.add("booker__day--active");

      const popover = document.createElement("div");
      popover.className = "booker__slots";
      popover.setAttribute("role", "menu");
      popover.addEventListener("click", (e) => e.stopPropagation());

      SLOTS.forEach((slot) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "booker__slot";
        btn.setAttribute("role", "menuitem");
        btn.textContent = slot.label;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          bookSlot(date, slot);
        });
        popover.appendChild(btn);
      });
      cell.appendChild(popover);
    }

    function render() {
      daysEl.innerHTML = "";

      const firstOfMonth = new Date(viewYear, viewMonth, 1);
      const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);

      monthEl.textContent = firstOfMonth.toLocaleDateString("en-CA", {
        month: "long", year: "numeric",
      });

      // Disable prev navigation past current month
      const atOrBeforeCurrent =
        viewYear < today.getFullYear() ||
        (viewYear === today.getFullYear() && viewMonth <= today.getMonth());
      prevBtn.disabled = atOrBeforeCurrent;

      // Layout starts Monday; getDay returns 0=Sun..6=Sat
      const startOffset = (firstOfMonth.getDay() + 6) % 7;

      for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement("div");
        empty.className = "booker__day booker__day--empty";
        daysEl.appendChild(empty);
      }

      for (let dayNum = 1; dayNum <= lastOfMonth.getDate(); dayNum++) {
        const d = new Date(viewYear, viewMonth, dayNum);
        const cell = document.createElement("div");
        cell.className = "booker__day";
        cell.textContent = String(dayNum);
        cell.setAttribute("role", "gridcell");

        if (isAvailable(d)) {
          cell.classList.add("booker__day--available");
          cell.setAttribute("tabindex", "0");
          cell.setAttribute("aria-label", `${formatDate(d)}, see available times`);

          cell.addEventListener("mouseenter", () => openSlots(cell, d));
          cell.addEventListener("click", (e) => {
            e.stopPropagation();
            if (activeCell === cell) closeSlots();
            else openSlots(cell, d);
          });
          cell.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (activeCell === cell) closeSlots();
              else openSlots(cell, d);
            }
            if (e.key === "Escape") closeSlots();
          });
        } else {
          cell.classList.add("booker__day--disabled");
          cell.setAttribute("aria-disabled", "true");
        }
        daysEl.appendChild(cell);
      }
    }

    prevBtn.addEventListener("click", () => {
      closeSlots();
      if (viewMonth === 0) { viewMonth = 11; viewYear -= 1; }
      else { viewMonth -= 1; }
      render();
    });

    nextBtn.addEventListener("click", () => {
      closeSlots();
      if (viewMonth === 11) { viewMonth = 0; viewYear += 1; }
      else { viewMonth += 1; }
      render();
    });

    // Close popover when leaving the calendar area or clicking outside
    calRoot.addEventListener("mouseleave", closeSlots);
    document.addEventListener("click", (e) => {
      if (!calRoot.contains(e.target)) closeSlots();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSlots();
    });

    render();
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
