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
   3. GRÁFICAS (barra CSS, línea SVG — cero dependencias)
   4. NOTIFICACIONES DE NAVEGACIÓN (badges cruzados entre roles)
   5. COMPORTAMIENTO DE HEADER (reiniciar demo)
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
    refresh: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 11A8 8 0 1 0 19 15"/><path d="M20 4v7h-7"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
    pipe: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V5h4v4"/><path d="M6 9h9a3 3 0 0 1 3 3v2"/><path d="M18 17v-3"/><path d="M9 9v11"/><path d="M6 20h6"/></svg>',
    paintRoller: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="12" height="6" rx="2"/><path d="M15 8h3"/><path d="M18 8v9"/><path d="M15 17h6"/></svg>',
    cinturon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h6"/><path d="M16 12h6"/><rect x="8" y="8" width="8" height="8" rx="1.5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
    taladro: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="10" height="5" rx="1"/><path d="M13 10.5h4"/><path d="M17 9.5l3 1-3 1z"/><path d="M6 13v3"/><rect x="4" y="16" width="4" height="3" rx="0.5"/></svg>',
    sierraCircular: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="14" r="6"/><path d="M9 8v12M3 14h12"/><rect x="13" y="6" width="8" height="5" rx="1"/><path d="M15 11v3"/></svg>',
    esmeriladora: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="9" width="9" height="5" rx="1"/><path d="M13 11.5h3"/><circle cx="18" cy="15" r="4"/></svg>',
    clavadora: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h9v5H4z"/><path d="M13 10h4v3h-4z"/><path d="M8 14v6"/><path d="M6 20h4"/></svg>',
    nivelLaser: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="10" width="6" height="6" rx="1"/><path d="M15 13h6" stroke-dasharray="2 2"/><path d="M9 13H3" stroke-dasharray="2 2"/><path d="M12 16v5"/><path d="M9 21h6"/></svg>',
    multiherramienta: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="9" width="10" height="5" rx="1"/><path d="M13 11.5h6"/><path d="M15 10l1 1.5-1 1.5"/><path d="M18 10l1 1.5-1 1.5"/></svg>'
  };

  function caratulaHTML(iconKey, colorKey) {
    var icon = ICONS[iconKey] || ICONS.tool;
    var color = colorKey || "sky";
    return (
      '<div class="course-caratula course-caratula-' + color + '">' +
        '<div class="course-caratula-icon">' + icon + "</div>" +
      "</div>"
    );
  }

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

  /* 3. GRÁFICAS ============================================== */

  function barChartHTML(items) {
    if (!items || !items.length) {
      return '<p class="line-chart-empty">Sin datos disponibles todavía.</p>';
    }
    return (
      '<div class="bar-chart">' +
      items.map(function (it) {
        var max = it.max || 100;
        var pct = Math.max(0, Math.min(100, Math.round(((it.value || 0) / max) * 100)));
        var cls = it.clase ? " " + it.clase : "";
        return (
          '<div class="bar-col">' +
            '<div class="bar' + cls + '" style="height:' + pct + '%">' +
              '<span class="bar-value">' + it.value + "</span>" +
            "</div>" +
            '<div class="bar-label">' + it.label + "</div>" +
          "</div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function lineChartHTML(points) {
    if (!points || points.length < 2) {
      return '<div class="line-chart-wrap"><p class="line-chart-empty">Todavía no hay suficientes datos para mostrar la evolución.</p></div>';
    }
    var w = 640, h = 200, pad = 30;
    var maxY = Math.max.apply(null, points.map(function (p) { return p.y; })) || 100;
    var stepX = (w - pad * 2) / (points.length - 1);
    var coords = points.map(function (p, i) {
      var x = pad + i * stepX;
      var y = h - pad - (Math.max(0, p.y) / maxY) * (h - pad * 2);
      return { x: x, y: y, label: p.x };
    });
    var linePath = coords.map(function (c, i) { return (i === 0 ? "M" : "L") + c.x.toFixed(1) + " " + c.y.toFixed(1); }).join(" ");
    var areaPath = linePath + " L " + coords[coords.length - 1].x.toFixed(1) + " " + (h - pad) +
      " L " + coords[0].x.toFixed(1) + " " + (h - pad) + " Z";
    var dots = coords.map(function (c) {
      return '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="3.5" fill="var(--sky)"></circle>';
    }).join("");
    var labels = coords.map(function (c) {
      return '<text x="' + c.x.toFixed(1) + '" y="' + (h - 8) + '" font-size="10" fill="var(--gray-mid)" text-anchor="middle">' + c.label + "</text>";
    }).join("");
    return (
      '<div class="line-chart-wrap">' +
        '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="200" preserveAspectRatio="none">' +
          '<line x1="' + pad + '" y1="' + (h - pad) + '" x2="' + (w - pad) + '" y2="' + (h - pad) + '" stroke="var(--gray-border)" stroke-width="1"></line>' +
          '<path d="' + areaPath + '" fill="var(--sky-light)" stroke="none"></path>' +
          '<path d="' + linePath + '" fill="none" stroke="var(--sky)" stroke-width="2.5"></path>' +
          dots +
          labels +
        "</svg>" +
      "</div>"
    );
  }

  /* 4. NOTIFICACIONES DE NAVEGACIÓN ========================== */

  function computeNavCounts(data) {
    var solicitudesPendientes = 0;
    data.alumnos.forEach(function (a) {
      (a.solicitudesFormacion || []).forEach(function (s) {
        if (s.estado === "solicitada") solicitudesPendientes++;
      });
    });
    var incidenciasAbiertas = data.incidencias.filter(function (i) { return i.estado === "abierta"; }).length;
    var desembolsosPendientes = window.CANTERA.getDesembolsosPendientes(data).length;
    return {
      "admin.html": solicitudesPendientes + incidenciasAbiertas,
      "jefe.html": incidenciasAbiertas,
      "financiera.html": desembolsosPendientes
    };
  }

  function renderNavBadges() {
    if (!window.CANTERA || !document.querySelector(".role-switch")) return;
    var data = window.CANTERA.loadData();
    var counts = computeNavCounts(data);
    document.querySelectorAll(".role-switch a").forEach(function (a) {
      var existing = a.querySelector(".nav-badge");
      if (existing) existing.remove();
      var href = a.getAttribute("href");
      var count = counts[href] || 0;
      if (count > 0) {
        var span = document.createElement("span");
        span.className = "nav-badge";
        span.textContent = count > 9 ? "9+" : String(count);
        a.appendChild(span);
      }
    });
  }

  /* 5. COMPORTAMIENTO DE HEADER ============================= */

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
  document.addEventListener("DOMContentLoaded", renderNavBadges);

  /* API PÚBLICA ============================================ */
  window.CANTERA_UI = {
    ICONS: ICONS,
    badgeHTML: badgeHTML,
    progressRowHTML: progressRowHTML,
    scoreRingHTML: scoreRingHTML,
    stageTrackerHTML: stageTrackerHTML,
    initialsFromName: initialsFromName,
    barChartHTML: barChartHTML,
    lineChartHTML: lineChartHTML,
    renderNavBadges: renderNavBadges,
    caratulaHTML: caratulaHTML
  };
})();
