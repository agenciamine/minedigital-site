/* ===================================================================
   MINE — interações do site
   =================================================================== */
(function () {
  "use strict";

  /* ---------- Ano no rodapé ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header muda ao rolar ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (window.scrollY > 20) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  if (toggle && mobileMenu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      mobileMenu.hidden = !open;
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Animações de entrada (reveal) ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revObserver.observe(el); });
  }

  /* ---------- Botão de som da vinheta do hero ---------- */
  var soundBtn = document.querySelector(".hero-video__sound");
  var heroVideo = document.querySelector(".hero-video__el");
  if (soundBtn && heroVideo) {
    var label = soundBtn.querySelector(".hero-video__sound-label");
    soundBtn.addEventListener("click", function () {
      heroVideo.muted = !heroVideo.muted;
      var on = !heroVideo.muted;
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.setAttribute("aria-label", on ? "Desativar som" : "Ativar som");
      if (label) label.textContent = on ? "Som ligado" : "Som";
      if (on) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }

  /* ---------- Contadores animados (estatísticas) ---------- */
  var counters = document.querySelectorAll(".stat__num[data-count]");
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1700;
      var start = null;
      var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = prefix + Math.round(easeOutCubic(p) * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target + suffix;
      };
      requestAnimationFrame(step);
    };

    if (!reduceMotion && "IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) {
        // começa do zero (mantendo prefixo/sufixo) e anima ao aparecer
        el.textContent = (el.getAttribute("data-prefix") || "") + "0" + (el.getAttribute("data-suffix") || "");
        countObserver.observe(el);
      });
    }
  }

  /* ---------- Mural: aplica posters e abre o reel no modal ---------- */
  var tiles = document.querySelectorAll(".tile");
  var modal = document.getElementById("reel-modal");

  // Capa (poster) nas tiles de mídia que tiverem data-poster
  tiles.forEach(function (tile) {
    var poster = tile.getAttribute("data-poster");
    if (poster && tile.classList.contains("tile--media")) {
      tile.style.setProperty("--tile-bg", 'url("' + poster + '")');
      tile.classList.add("has-poster");
    }
  });

  if (modal) {
    var mVideo = modal.querySelector(".reel-modal__video");
    var mPh    = modal.querySelector(".reel-modal__ph");
    var mCat   = modal.querySelector(".reel-modal__cat");
    var mTitle = modal.querySelector(".reel-modal__title");
    var mSub   = modal.querySelector(".reel-modal__sub");
    var lastFocus = null;

    function openModal(tile) {
      lastFocus = tile;
      var cat = tile.getAttribute("data-cat") || "";
      var video = tile.getAttribute("data-video");
      var poster = tile.getAttribute("data-poster") || "";

      mCat.textContent = cat;
      mCat.style.display = cat ? "" : "none";
      mTitle.textContent = tile.getAttribute("data-title") || "";
      mSub.textContent = tile.getAttribute("data-sub") || "";

      if (video) {
        mVideo.src = video;
        if (poster) mVideo.setAttribute("poster", poster);
        mVideo.hidden = false;
        mPh.hidden = true;
        mVideo.muted = false; // clique é gesto do usuário → pode ter som
        var p = mVideo.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        mVideo.hidden = true;
        mPh.hidden = false;
      }

      modal.hidden = false;
      document.body.classList.add("modal-open");
      var closeBtn = modal.querySelector(".reel-modal__close");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      try { mVideo.pause(); } catch (e) {}
      mVideo.removeAttribute("src");
      mVideo.load();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () { openModal(tile); });
      tile.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          openModal(tile);
        }
      });
    });

    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }
})();
