/* =========================================================
   CANTERA CONSTRUCCIÓN — COMPONENTES UI COMPARTIDOS
   Prototipo v1 — Fase 1
   Se carga DESPUÉS de data.js en cada página. Provee piezas
   visuales reutilizables (badges, barras de progreso, score
   circular, etapas) y el comportamiento del botón "Reiniciar
   demo" que aparece en el header de todas las vistas internas.

   Índice:
   1. ÍCONOS SVG (inline, sin librerías externas)
   2. COMPONENTES DE MARCADO (badge, progreso, score ring, etapas)
   3. COMPORTAMIENTO DE HEADER (reiniciar demo)
   ========================================================= */

window.CANTERA_UI = window.CANTERA_UI || {};

(function () {
  "use strict";

  /* 1. ÍCONOS SVG =========================================== */
  var ICONS = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12l5 5L20 6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>',
    tool: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 7a4 4 0 0 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5l-3-3z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
    building: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V6l8-3 8 3v15"/><path d="M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>',
    bank: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10l9-6 9 6"/><path d="M4 10v9M9 10v9M15 10v9M20 10v9M2 21h20"/></svg>',
    route: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 7l8 10M8 6h6a4 4 0 0 1 4 4v0"/></svg>',
    ai: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="7" width="14" height="11" rx="2"/><path d="M12 3v4M8 11h.01M16 11h.01M9 15h6"/></svg>',
    camera: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 11A8 8 0 1 0 19 15"/><path d="M20 4v7h-7"/></svg>'
  };

  /* 2. COMPONENTES DE MARCADO =============================== */

  function badgeHTML(text, clase) {
    return '<span class="badge badge-' + clase + '">' + text + '</span>';
  }

  function progressRowHTML(pct, colorClass) {
    pct = Math.max(0, Math.min(100, pct));
    return (
      '<div class="progress-row">' +
        '<div class="progress ' + (colorClass || "") + '"><span style="width:' + pct + '%"></span></div>' +
        '<div class="pct">' + pct + '%</div>' +
      "</div>"
    );
  }

  var RING_RADIUS = 41;
  var RING_CIRC = 2 * Math.PI * RING_RADIUS;

  function scoreRingHTML(score, opts) {
    opts = opts || {};
    var size = opts.small ? "sm" : "";
    var cat = window.CANTERA.scoreCategoria(score);
    var colorVar = "var(--" + (cat.clase === "sky" ? "sky" : cat.clase) + ")";
    var dash = (Math.max(0, Math.min(100, score)) / 100) * RING_CIRC;
    return (
      '<div class="score-ring ' + size + '">' +
        '<svg width="92" height="92" viewBox="0 0 92 92">' +
          '<circle class="track" cx="46" cy="46" r="' + RING_RADIUS + '"></circle>' +
          '<circle class="value" cx="46" cy="46" r="' + RING_RADIUS + '" stroke="' + colorVar + '" ' +
            'stroke-dasharray="' + dash.toFixed(1) + ' ' + RING_CIRC.toFixed(1) + '"></circle>' +
        "</svg>" +
        '<div class="num">' + Math.round(score) + "<small>/100</small></div>" +
      "</div>"
    );
  }

  function stageTrackerHTML(etapaActual) {
    var idx = window.CANTERA.etapaIndex(etapaActual);
    return (
      '<div class="stage-tracker">' +
      window.CANTERA.ETAPAS_OBRA.map(function (etapa, i) {
        var cls = i < idx ? "done" : (i === idx ? "current" : "");
        return '<span class="stage-pill ' + cls + '">' + (i + 1) + ". " + etapa + "</span>";
      }).join("") +
      "</div>"
    );
  }

  function initialsFromName(nombre) {
    var parts = nombre.trim().split(/\s+/);
    var first = parts[0] ? parts[0][0] : "";
    var second = parts[1] ? parts[1][0] : "";
    return (first + second).toUpperCase();
  }

  /* 3. COMPORTAMIENTO DE HEADER ============================= */

  function bindResetButtons() {
    var buttons = document.querySelectorAll(".reset-demo-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ok = window.confirm(
          "¿Reiniciar la demo? Esto borrará cualquier cambio hecho en esta sesión (bitácoras, avances, etc.) y volverá a los datos de ejemplo originales."
        );
        if (ok) window.CANTERA.resetDemo();
      });
    });
  }

  function checkStorageWarning() {
    if (window.CANTERA.storageAvailable()) return;
    var container = document.querySelector(".app-main .wrap") || document.querySelector(".wrap");
    if (!container) return;
    var banner = document.createElement("div");
    banner.className = "card mt-8";
    banner.style.background = "var(--yellow-bg)";
    banner.style.border = "1px solid var(--yellow)";
    banner.style.color = "var(--yellow)";
    banner.style.marginBottom = "16px";
    banner.innerHTML =
      "<strong>Aviso:</strong> este navegador no permite guardar datos localmente en este modo " +
      "(esto puede pasar al abrir el archivo directamente con doble clic). Los cambios que hagas " +
      "no se guardarán al cambiar de página. Para la demo completa, abre el sitio publicado en " +
      "Netlify o sírvelo con un servidor local.";
    container.insertBefore(banner, container.firstChild);
  }

  document.addEventListener("DOMContentLoaded", bindResetButtons);
  document.addEventListener("DOMContentLoaded", checkStorageWarning);

  /* API PÚBLICA ============================================ */
  window.CANTERA_UI = {
    ICONS: ICONS,
    badgeHTML: badgeHTML,
    progressRowHTML: progressRowHTML,
    scoreRingHTML: scoreRingHTML,
    stageTrackerHTML: stageTrackerHTML,
    initialsFromName: initialsFromName
  };
})();
