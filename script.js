/* Gods of Roofing — site interactions */
(() => {
    "use strict";

    /* ---------- Nav: border on scroll ---------- */
    const nav = document.querySelector(".nav");
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- Mobile menu ---------- */
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("nav-menu");

    const setMenu = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.classList.toggle("menu-open", open);
    };

    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
            setMenu(false);
            toggle.focus();
        }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

    /* ---------- Tabs (with arrow-key support) ---------- */
    document.querySelectorAll("[data-tabs]").forEach((root) => {
        const tabs = Array.from(root.querySelectorAll('[role="tab"]'));

        const select = (tab, focus) => {
            tabs.forEach((t) => {
                const on = t === tab;
                t.setAttribute("aria-selected", String(on));
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
            });
            if (focus) tab.focus();
        };

        tabs.forEach((tab, i) => {
            tab.addEventListener("click", () => select(tab));
            tab.addEventListener("keydown", (e) => {
                let next = null;
                if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
                if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
                if (e.key === "Home") next = tabs[0];
                if (e.key === "End") next = tabs[tabs.length - 1];
                if (next) { e.preventDefault(); select(next, true); }
            });
        });
    });

    /* ---------- Pricing: monthly / annual ---------- */
    // Skipped when the pricing section is absent (it's currently commented out in index.html).
    const pricing = document.getElementById("pricing");
    const billingSwitch = document.querySelector("[data-billing]");

    if (pricing && billingSwitch) {
        const setPeriod = (period) => {
            pricing.dataset.period = period;
            billingSwitch.setAttribute("aria-checked", String(period === "annual"));
            pricing.querySelectorAll("[data-monthly][data-annual]").forEach((el) => {
                el.textContent = el.dataset[period];
            });
        };

        billingSwitch.addEventListener("click", () => {
            setPeriod(pricing.dataset.period === "annual" ? "monthly" : "annual");
        });
        pricing.querySelectorAll(".billing-opt").forEach((opt) => {
            opt.addEventListener("click", () => setPeriod(opt.dataset.for));
        });
    }

    /* ---------- Hero intro video ---------- */
    // Picks the vertical cut on desktop and the horizontal cut below 1025px, swapping (and keeping
    // the playback position) if the viewport crosses that line. Hides itself if a file is missing.
    const heroVideo = document.querySelector("[data-hero-video]");
    if (heroVideo) {
        const grid = heroVideo.closest(".hero-grid");
        const video = heroVideo.querySelector("video");
        const soundBtn = heroVideo.querySelector("[data-video-sound]");
        const desktop = window.matchMedia("(min-width: 1025px)");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        const loadCut = () => {
            const cut = desktop.matches ? "vertical" : "horizontal";
            if (video.dataset.cut === cut) return;

            // First load: autoplay muted unless the visitor prefers reduced motion.
            // Later swaps: keep playing only if it was already playing.
            const isSwap = Boolean(video.dataset.cut);
            const shouldPlay = isSwap ? !video.paused : !reduceMotion.matches;
            const resumeAt = isSwap ? video.currentTime : 0;

            heroVideo.hidden = false;
            grid.classList.add("has-video");
            video.dataset.cut = cut;
            video.poster = cut === "vertical" ? video.dataset.posterVertical : video.dataset.posterHorizontal;
            video.src = video.dataset[cut];
            video.addEventListener("loadedmetadata", () => {
                if (resumeAt) video.currentTime = resumeAt;
                if (shouldPlay) video.play().catch(() => { /* autoplay blocked; poster + button remain */ });
            }, { once: true });
        };

        // If the video can't play (e.g. the host ignores byte-range requests, which iOS requires),
        // fall back to the poster frame as a still image. Only hide the block if the poster is missing too.
        let still = null;
        video.addEventListener("error", () => {
            const hide = () => {
                heroVideo.hidden = true;
                grid.classList.remove("has-video");
            };
            if (!video.poster) return hide();
            if (!still) {
                still = new Image();
                still.alt = video.getAttribute("aria-label") || "";
                still.addEventListener("error", hide);
                video.after(still);
            }
            still.src = video.poster;
            video.hidden = true;
            soundBtn.hidden = true;
        });

        soundBtn.addEventListener("click", () => {
            video.muted = false;
            video.loop = false;
            video.controls = true;
            video.currentTime = 0;
            video.play().catch(() => {});
            soundBtn.hidden = true;
            video.focus();
        });

        desktop.addEventListener("change", loadCut);
        loadCut();
    }

    /* ---------- FAQ: one open at a time (fallback for browsers without <details name>) ---------- */
    const faqs = Array.from(document.querySelectorAll(".faq-list details"));
    faqs.forEach((d) => {
        d.addEventListener("toggle", () => {
            if (d.open) faqs.forEach((other) => { if (other !== d) other.open = false; });
        });
    });

    /* ---------- Contact form ---------- */
    const form = document.getElementById("contact-form");
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    const setStatus = (msg, type) => {
        status.textContent = msg;
        status.classList.remove("is-error", "is-success");
        if (type) status.classList.add(`is-${type}`);
    };

    form.querySelectorAll("input, select").forEach((field) => {
        field.addEventListener("input", () => field.classList.remove("is-invalid"));
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fields = Array.from(form.querySelectorAll("input, select"));
        const invalid = fields.filter((f) => !f.checkValidity());
        fields.forEach((f) => f.classList.toggle("is-invalid", invalid.includes(f)));
        if (invalid.length) {
            setStatus("Please fill in the highlighted fields.", "error");
            invalid[0].focus();
            return;
        }

        const data = Object.fromEntries(new FormData(form).entries());
        const endpoint = form.dataset.endpoint.trim();

        // Option A: post to a form service / CRM webhook
        if (endpoint) {
            submitBtn.disabled = true;
            setStatus("Sending…");
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error(String(res.status));
                form.reset();
                setStatus("Thanks! We'll reach out within one business day to set up your call.", "success");
            } catch (err) {
                setStatus(`Something went wrong sending your request. Email us at ${form.dataset.email} instead.`, "error");
            } finally {
                submitBtn.disabled = false;
            }
            return;
        }

        // Option B (default): open the visitor's email app with the details filled in
        const body = [
            `Name: ${data.name}`,
            `Company: ${data.company}`,
            `Email: ${data.email}`,
            `Phone: ${data.phone || "-"}`,
            `Service area: ${data.area}`,
            `Annual revenue: ${data.revenue}`,
        ].join("\n");
        const subject = `Strategy call request: ${data.company}`;
        window.location.href =
            `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus("Your email app should open with your details filled in. Just hit send.", "success");
    });

    /* ---------- Footer year ---------- */
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
})();