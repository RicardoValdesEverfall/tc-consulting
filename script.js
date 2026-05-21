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
    // TODO after Vercel deploy: replace with actual API origin (e.g. https://tc-consulting-api.vercel.app)
    const API_BASE = "https://tc-consulting-api.vercel.app";

    const SLOTS = [
      { label: "9:00 AM",  start: "09:00", end: "09:30" },
      { label: "11:30 AM", start: "11:30", end: "12:00" },
      { label: "2:00 PM",  start: "14:00", end: "14:30" },
      { label: "4:30 PM",  start: "16:30", end: "17:00" },
    ];

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

    // Taken slots loaded from API: "YYYY-MM-DD:HH:MM"
    let takenSlots = new Set();

    const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
    const ymd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const isSlotTaken = (d, slotStart) => takenSlots.has(`${ymd(d)}:${slotStart}`);
    const allSlotsTaken = (d) => SLOTS.every((s) => isSlotTaken(d, s.start));
    const isAvailable = (d) =>
      d.getTime() >= earliestBookable.getTime() &&
      !isWeekend(d) &&
      !allSlotsTaken(d);
    const formatDate = (d) => d.toLocaleDateString("en-CA", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    let activeCell = null;
    let pendingBooking = null; // { date, slot }

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
        if (isSlotTaken(date, slot.start)) {
          btn.classList.add("booker__slot--taken");
          btn.disabled = true;
          btn.textContent = `${slot.label} (booked)`;
        } else {
          btn.textContent = slot.label;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeSlots();
            openBookingModal(date, slot);
          });
        }
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

    // ── Modal wiring ────────────────────────────────────────────────────
    const modal = document.getElementById("bookmodal");
    const modalForm = modal ? modal.querySelector("[data-bm-form]") : null;
    const modalWhen = modal ? modal.querySelector("[data-bm-when]") : null;
    const modalError = modal ? modal.querySelector("[data-bm-error]") : null;
    const modalSubmit = modal ? modal.querySelector("[data-bm-submit]") : null;
    const modalSuccess = modal ? modal.querySelector("[data-bm-success]") : null;

    function openBookingModal(date, slot) {
      if (!modal) return;
      pendingBooking = { date, slot };
      modalWhen.textContent = `${formatDate(date)} at ${slot.label} Eastern`;
      modalForm.hidden = false;
      modalSuccess.hidden = true;
      modalError.hidden = true;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const firstInput = modalForm.querySelector("input[name='name']");
        if (firstInput) firstInput.focus();
      }, 50);
    }

    function closeBookingModal() {
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      pendingBooking = null;
      if (modalForm) {
        modalForm.reset();
        modalForm.hidden = false;
      }
      if (modalSuccess) modalSuccess.hidden = true;
      if (modalError) modalError.hidden = true;
      if (modalSubmit) {
        modalSubmit.disabled = false;
        modalSubmit.textContent = "Confirm booking";
      }
    }

    function errorMessage(code) {
      switch (code) {
        case "slot_taken":         return "That slot was just booked by someone else. Please pick another time.";
        case "missing_fields":     return "Please fill in all fields.";
        case "invalid_email":      return "That email address doesn't look valid.";
        case "invalid_date":       return "Invalid date selected.";
        case "invalid_slot":       return "Invalid time slot.";
        case "too_soon":           return "Bookings need to be at least one week ahead.";
        case "weekend_not_allowed":return "Weekends aren't available.";
        case "email_send_failed":  return "Saved your booking, but the confirmation email failed to send. Ricardo will reach out directly.";
        default:                   return "Something went wrong. Please try again, or email info@tccgroup.ca.";
      }
    }

    if (modal) {
      modal.querySelectorAll("[data-bm-close]").forEach((el) => {
        el.addEventListener("click", closeBookingModal);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.hidden) closeBookingModal();
      });
    }

    if (modalForm) {
      modalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!pendingBooking) return;

        modalError.hidden = true;
        modalSubmit.disabled = true;
        modalSubmit.textContent = "Sending…";

        const fd = new FormData(modalForm);
        const payload = {
          name: (fd.get("name") || "").toString().trim(),
          business: (fd.get("business") || "").toString().trim(),
          email: (fd.get("email") || "").toString().trim(),
          phone: (fd.get("phone") || "").toString().trim(),
          description: (fd.get("description") || "").toString().trim(),
          date: ymd(pendingBooking.date),
          slot: pendingBooking.slot.start,
        };

        try {
          const r = await fetch(`${API_BASE}/api/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await r.json().catch(() => ({}));

          if (r.ok) {
            takenSlots.add(`${payload.date}:${payload.slot}`);
            modalForm.hidden = true;
            modalSuccess.hidden = false;
            render();
          } else {
            modalError.textContent = errorMessage(data.error);
            modalError.hidden = false;
            modalSubmit.disabled = false;
            modalSubmit.textContent = "Confirm booking";
            if (data.error === "slot_taken") {
              takenSlots.add(`${payload.date}:${payload.slot}`);
              render();
            }
          }
        } catch (err) {
          modalError.textContent = "Couldn't reach the booking server. Please email info@tccgroup.ca and we'll book by hand.";
          modalError.hidden = false;
          modalSubmit.disabled = false;
          modalSubmit.textContent = "Confirm booking";
        }
      });
    }

    // ── Availability fetch ──────────────────────────────────────────────
    async function loadAvailability() {
      try {
        const r = await fetch(`${API_BASE}/api/availability`, { method: "GET" });
        if (!r.ok) return;
        const data = await r.json();
        takenSlots = new Set(data.taken || []);
        render();
      } catch (e) {
        // Network/CORS error: proceed without availability info (open slots
        // will still be validated server-side before booking)
      }
    }

    render();
    loadAvailability();
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
