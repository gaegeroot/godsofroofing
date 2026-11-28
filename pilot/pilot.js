/* Gods of Roofing — Lead Leak Pilot page */

/* =====================================================================
   CONFIG: every editable value lives here.
   Anything left as "" keeps its yellow [PLACEHOLDER] on the page.
   ===================================================================== */
const CONFIG = {
    offerName: "Lead Leak Pilot",
    price: "$599",
    priceTerm: "",          // e.g. "one-time" or "/month"   [CONFIRM]
    pilotLength: "30",      // days                         [CONFIRM]
    spots: 3,
    spotsRemaining: 3,      // update as spots fill

    vsl: {
        // The video's EMBED url, not the watch page. Captions:
        //   YouTube: https://www.youtube-nocookie.com/embed/VIDEO_ID?cc_load_policy=1&rel=0
        //   Vimeo:   https://player.vimeo.com/video/VIDEO_ID?texttrack=en
        //   Wistia:  turn captions on in the Wistia player settings
        embedUrl: "",       // [VSL EMBED URL]
        poster: "",         // [VSL POSTER IMAGE] 1280x720 jpg, e.g. "vsl-poster.jpg"
    },

    calendar: {
        // Booking page URL (Calendly, Cal.com, GoHighLevel...). Loaded in an iframe, with any
        // utm_* parameters from the ad click passed through.
        url: "",            // [CALENDAR EMBED URL]
    },

    privacyUrl: "",         // [PRIVACY POLICY URL]
    metaPixelId: "",        // [PIXEL ID]
    ga4Id: "",              // [ANALYTICS ID]  e.g. "G-XXXXXXX"
};

(() => {
    "use strict";

    /* ---------- Fill CONFIG values into the page ---------- */
    document.querySelectorAll("[data-cfg]").forEach((el) => {
        const value = CONFIG[el.dataset.cfg];
        if (value === "" || value === undefined || value === null) return;
        el.textContent = String(value);
        el.classList.remove("ph");
    });
    if (CONFIG.offerName) document.title = `${CONFIG.offerName} | Gods of Roofing`;

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    const privacy = document.querySelector("[data-privacy-link]");
    if (privacy) {
        if (CONFIG.privacyUrl) privacy.href = CONFIG.privacyUrl;
        else privacy.textContent = "Privacy policy [URL]";
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

    /* ---------- VSL: click to load ---------- */
    const vsl = document.querySelector("[data-vsl]");
    const vslPlay = document.querySelector("[data-vsl-play]");
    const poster = document.querySelector("[data-vsl-poster]");

    if (CONFIG.vsl.poster) {
        poster.src = CONFIG.vsl.poster;
        poster.hidden = false;
    }
    if (CONFIG.vsl.embedUrl) {
        document.querySelector("[data-vsl-missing]").remove();
    }

    vslPlay.addEventListener("click", () => {
        if (!CONFIG.vsl.embedUrl) return;
        const url = new URL(CONFIG.vsl.embedUrl, location.href);
        // Start playing right away (the visitor already pressed play), with sound.
        // Wistia uses autoPlay=true instead; add it to embedUrl if that's the host.
        url.searchParams.set("autoplay", "1");
        const iframe = document.createElement("iframe");
        iframe.src = url.toString();
        iframe.title = `${CONFIG.offerName} video`;
        iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
        iframe.allowFullscreen = true;
        vsl.replaceChildren(iframe);
        iframe.focus();
        track("ViewContent", { content_name: CONFIG.offerName });
    });

    /* ---------- Calendar: load when it's close to the screen ---------- */
    const calendar = document.querySelector("[data-calendar]");
    const calendarLink = document.querySelector("[data-calendar-link]");

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

        const loadCalendar = () => {
            const iframe = document.createElement("iframe");
            iframe.src = calendarUrl;
            iframe.title = "Book a call";
            iframe.loading = "lazy";
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
        calendarLink.closest("p").hidden = true;
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

    /* ---------- Sticky CTA: hide once the booking section is on screen ---------- */
    const sticky = document.querySelector("[data-sticky-cta]");
    const book = document.getElementById("book");
    if (sticky && book && "IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            sticky.classList.toggle("is-hidden", entries[0].isIntersecting);
        }, { threshold: 0.05 }).observe(book);
    }

    /* ---------- FAQ: one open at a time (for browsers without <details name>) ---------- */
    const faqs = Array.from(document.querySelectorAll(".faq-list details"));
    faqs.forEach((d) => d.addEventListener("toggle", () => {
        if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
    }));
})();
