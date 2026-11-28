/* Gods of Roofing — Founding Partner Program page */

/* =====================================================================
   CONFIG: every editable value lives here.
   ===================================================================== */
const CONFIG = {
    offerName: "Founding Partner Program",
    price: "$599",
    priceTerm: "one-time",
    spots: 3,
    spotsRemaining: 3,      // update as spots fill; the page's spot markers follow this
    accessDays: "30",       // days of direct access included with the implementation
    avgJobValue: "$8,900",  // average roofing job revenue used in "the math" comparison

    calendar: {
        // Booking page URL (Calendly, Cal.com, GoHighLevel...). Loaded in an iframe, with any
        // utm_* parameters from the ad click passed through.
        // Until this is set, the booking section shows an "Email to book a call" button instead.
        url: "",            // [CALENDAR EMBED URL]
    },

    vsl: {
        // Optional short video in the "Who you'd be working with" section. Hidden until set.
        // Use the EMBED url, not the watch page. Captions:
        //   YouTube: https://www.youtube-nocookie.com/embed/VIDEO_ID?cc_load_policy=1&rel=0
        //   Vimeo:   https://player.vimeo.com/video/VIDEO_ID?texttrack=en
        embedUrl: "",
        poster: "",         // 1280x720 jpg, e.g. "vsl-poster.jpg"
    },

    privacyUrl: "",         // [PRIVACY POLICY URL] the footer link stays hidden until this is set
    metaPixelId: "",        // [PIXEL ID]
    ga4Id: "",              // [ANALYTICS ID]  e.g. "G-XXXXXXX"
};

(() => {
    "use strict";

    /* ---------- Fill CONFIG values into the page ---------- */
    const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const values = { ...CONFIG, spotsWord: WORDS[CONFIG.spots] || String(CONFIG.spots) };

    document.querySelectorAll("[data-cfg]").forEach((el) => {
        const value = values[el.dataset.cfg];
        if (value === "" || value === undefined || value === null) return;
        el.textContent = String(value);
    });

    /* Spot markers: one per spot, filled ones marked as taken */
    const open = Math.max(0, Math.min(CONFIG.spotsRemaining, CONFIG.spots));
    document.querySelectorAll("[data-slots]").forEach((slots) => {
        slots.replaceChildren(...Array.from({ length: CONFIG.spots }, (_, i) => {
            const s = document.createElement("span");
            s.className = `slot ${i < CONFIG.spots - open ? "is-taken" : "is-open"}`;
            s.setAttribute("aria-hidden", "true");
            return s;
        }));
        slots.setAttribute("aria-label", `${open} of ${CONFIG.spots} founding partner spots open`);
    });

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    const privacy = document.querySelector("[data-privacy-link]");
    if (privacy && CONFIG.privacyUrl) {
        privacy.href = CONFIG.privacyUrl;
        privacy.hidden = false;
    }

    /* ---------- Tracking ---------- */
    const track = (event, params) => {
        if (window.fbq) window.fbq("track", event, params);
        if (window.gtag) window.gtag("event", event.toLowerCase(), params);
    };

    if (CONFIG.metaPixelId) {
        /* Standard Meta Pixel loader */
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
            t = b.createElement(e); t.async = !0; t.src = v;
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("init", CONFIG.metaPixelId);
        window.fbq("track", "PageView");
    }

    if (CONFIG.ga4Id) {
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.ga4Id)}`;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", CONFIG.ga4Id);
    }

    /* ---------- Optional video: click to load ---------- */
    const vsl = document.querySelector("[data-vsl]");
    if (vsl && CONFIG.vsl.embedUrl) {
        vsl.hidden = false;
        const poster = vsl.querySelector("[data-vsl-poster]");
        if (CONFIG.vsl.poster) {
            poster.src = CONFIG.vsl.poster;
            poster.hidden = false;
        }
        vsl.querySelector("[data-vsl-play]").addEventListener("click", () => {
            const url = new URL(CONFIG.vsl.embedUrl, location.href);
            // The visitor already pressed play, so start right away.
            // Wistia uses autoPlay=true instead; add it to embedUrl if that's the host.
            url.searchParams.set("autoplay", "1");
            const iframe = document.createElement("iframe");
            iframe.src = url.toString();
            iframe.title = "Video from Gaege, founder of Gods of Roofing";
            iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
            iframe.allowFullscreen = true;
            vsl.replaceChildren(iframe);
            iframe.focus();
            track("ViewContent", { content_name: CONFIG.offerName });
        });
    }

    /* ---------- Booking: calendar embed, or email until one is set ---------- */
    const calendar = document.querySelector("[data-calendar]");
    const calendarLink = document.querySelector("[data-calendar-link]");
    const calendarFallback = document.querySelector("[data-calendar-fallback]");

    const withUtms = (base) => {
        const url = new URL(base, location.href);
        new URLSearchParams(location.search).forEach((value, key) => {
            if (key.startsWith("utm_")) url.searchParams.set(key, value);
        });
        return url.toString();
    };

    if (CONFIG.calendar.url) {
        const calendarUrl = withUtms(CONFIG.calendar.url);
        calendarLink.href = calendarUrl;
        calendarFallback.hidden = false;

        const loadCalendar = () => {
            const iframe = document.createElement("iframe");
            iframe.src = calendarUrl;
            iframe.title = "Book a call to see if you're a good fit";
            calendar.replaceChildren(iframe);
            calendar.classList.add("is-loaded");
        };

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect();
                    loadCalendar();
                }
            }, { rootMargin: "800px 0px" });
            io.observe(calendar);
        } else {
            loadCalendar();
        }
    } else {
        const email = document.querySelector("[data-calendar-email]");
        if (email) email.addEventListener("click", () => track("Contact", { content_name: CONFIG.offerName }));
    }

    /* ---------- "Schedule" event when a booking completes ----------
       Calendly reports bookings to the page automatically (handled below).
       For other tools, call window.pilotBooked() from their completion hook,
       or point their thank-you redirect at a page that fires the event. */
    let booked = false;
    window.pilotBooked = () => {
        if (booked) return;
        booked = true;
        track("Schedule", { content_name: CONFIG.offerName });
    };
    window.addEventListener("message", (e) => {
        if (e.origin === "https://calendly.com" && e.data && e.data.event === "calendly.event_scheduled") {
            window.pilotBooked();
        }
    });

    /* ---------- Nav: border on scroll (same as the main site) ---------- */
    const nav = document.querySelector(".nav");
    if (nav) {
        const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Sticky CTA: only when no other booking button is on screen ---------- */
    const sticky = document.querySelector("[data-sticky-cta]");
    const heroCta = document.querySelector("[data-hero-cta]");
    const book = document.getElementById("book");
    if (sticky && "IntersectionObserver" in window) {
        const visible = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => visible.set(e.target, e.isIntersecting));
            sticky.classList.toggle("is-hidden", [...visible.values()].some(Boolean));
        }, { threshold: 0 });
        [heroCta, book].forEach((el) => el && io.observe(el));
    } else if (sticky) {
        sticky.classList.remove("is-hidden");
    }
})();
