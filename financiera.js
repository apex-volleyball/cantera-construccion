/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA ENTIDAD FINANCIERA (financiera.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan alumno/jefe/admin.
   Regla de privacidad: esta vista solo muestra datos agregados por
   equipo y obra — nunca datos personales individuales de alumnos
   (teléfono, dirección, etc.).
   ========================================================= */

(function () {
  "use strict";

  var data;
  var SELECTED_KEY = "cantera_ui_selected_obra_fin";

  document.addEventListener("DOMContentLoaded", function () {
    data = window.CANTERA.loadData();

    bindTabs();
    renderKPIs();
    renderTablaObrasFin();
    renderComparativaEquipos();
    renderRankingFin();
    renderEntidades();
    renderDesembolsos();
    renderSuccessList();
    populateSelectorObra();

    var initialId = getSelectedObraId();
    document.getElementById("selector-obra-fin").value = initialId;
    renderTrazabilidad(initialId);
    renderAvanceHistorico(initialId);

    document.getElementById("selector-obra-fin").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) { /* noop */ }
      renderTrazabilidad(e.target.value);
      renderAvanceHistorico(e.target.value);
    });

    document.getElementById("btn-descargar-reporte").addEventListener("click", function () {
      var obraId = document.getElementById("selector-obra-fin").value;
      buildReporteImprimible(obraId);
      window.print();
    });
  });

  function bindTabs() {
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
      });
    });
  }

  function getSelectedObraId() {
    var stored = null;
    try { stored = localStorage.getItem(SELECTED_KEY); } catch (e) { stored = null; }
    if (stored && window.CANTERA.getObra(data, stored)) return stored;
    var destacado = data.obras.filter(function (o) { return o.destacada; })[0];
    return (destacado || data.obras[0]).id;
  }

  function renderKPIs() {
    var promedio = Math.round(
      data.obras.reduce(function (sum, o) { return sum + o.porcentajeAvance; }, 0) / data.obras.length
    );
    var riesgoAlto = data.obras.filter(function (o) { return o.estadoRiesgo === "alto"; }).length;
    var montoTotal = data.obras.reduce(function (sum, o) { return sum + (o.montoTotalFinanciadoQ || 0); }, 0);
    var montoLiberado = data.obras.reduce(function (sum, o) { return sum + window.CANTERA.montoLiberado(o); }, 0);
    setText("k-obras", data.obras.length);
    setText("k-equipos", data.equipos.length);
    setText("k-avance", promedio + "%");
    setText("k-riesgo", riesgoAlto);
    setText("k-monto-total", window.CANTERA.formatQ(montoTotal));
    setText("k-monto-liberado", window.CANTERA.formatQ(montoLiberado));
    var resumenCuentas = window.CANTERA.getResumenCuentasBanRural(data);
    var totalAlumnosCuentas = data.alumnos.length;
    var pctCuentasAbiertas = totalAlumnosCuentas ? Math.round((resumenCuentas.abierta / totalAlumnosCuentas) * 100) : 0;
    setText("k-cuentas-banrural", resumenCuentas.abierta);
    setText("k-cuentas-banrural-pct", pctCuentasAbiertas + "% de los alumnos activos");
  }

  function renderComparativaEquipos() {
    var ordenado = data.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var items = ordenado.map(function (eq) {
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return { label: eq.codigo, value: eq.calificacionActual, max: 100, clase: cat.clase === "sky" ? "" : cat.clase };
    });
    document.getElementById("comparativa-equipos-fin").innerHTML =
      '<p class="text-sm text-mid" style="margin-bottom:4px">Calificación actual (0–100) de cada equipo financiado.</p>' +
      window.CANTERA_UI.barChartHTML(items);
  }

  function renderDesembolsos() {
    var el = document.getElementById("lista-desembolsos");
    el.innerHTML = data.obras.map(function (obra) {
      var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
      var liberado = window.CANTERA.montoLiberado(obra);
      var pct = obra.montoTotalFinanciadoQ ? Math.round((liberado / obra.montoTotalFinanciadoQ) * 100) : 0;
      var tramosHTML = window.CANTERA.getTramosDesembolso().map(function (t) {
        var d = window.CANTERA.getDesembolso(obra, t.id);
        var estado = d ? d.estado : "pendiente";
        var badge = window.CANTERA.desembolsoEstadoBadge(estado);
        var monto = window.CANTERA.montoTramo(obra, t.id);
        var accion = estado === "disponible"
          ? '<button class="btn btn-primary btn-sm" data-liberar-obra="' + obra.id + '" data-liberar-tramo="' + t.id + '">Liberar desembolso</button>'
          : (estado === "liberado" && d.fechaLiberacion ? '<span class="text-sm text-mid">Liberado ' + window.CANTERA.formatFecha(d.fechaLiberacion) + "</span>" : "");
        return (
          '<div class="module-item">' +
            '<div class="info"><h4>' + t.nombre + "</h4><p>Etapa requerida: " + t.etapaRequerida + " · " + t.pct + "% · " + window.CANTERA.formatQ(monto) + "</p></div>" +
            '<div class="flex gap-12" style="align-items:center">' + window.CANTERA_UI.badgeHTML(badge.texto, badge.clase) + accion + "</div>" +
          "</div>"
        );
      }).join("");

      return (
        '<div class="card mt-16">' +
          '<div class="flex-between" style="margin-bottom:10px">' +
            "<div><strong>" + obra.codigo + "</strong> · " + (equipo ? equipo.nombre : "—") + "</div>" +
            "<div class=\"text-sm text-mid\">Financiado: " + window.CANTERA.formatQ(obra.montoTotalFinanciadoQ) + "</div>" +
          "</div>" +
          window.CANTERA_UI.progressRowHTML(pct) +
          '<p class="text-sm text-mid mt-8" style="margin-bottom:12px">' + window.CANTERA.formatQ(liberado) + " liberados de " + window.CANTERA.formatQ(obra.montoTotalFinanciadoQ) + "</p>" +
          tramosHTML +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("button[data-liberar-obra]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var obraId = btn.getAttribute("data-liberar-obra");
        var tramoId = btn.getAttribute("data-liberar-tramo");
        window.CANTERA.liberarDesembolso(data, obraId, tramoId);
        data = window.CANTERA.loadData();
        renderDesembolsos();
        renderKPIs();
        if (window.CANTERA_UI.renderNavBadges) window.CANTERA_UI.renderNavBadges();
      });
    });
  }

  function renderAvanceHistorico(obraId) {
    var entradas = window.CANTERA.getBitacoraPorObra(data, obraId).slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    var points = entradas.map(function (b) {
      return { x: window.CANTERA.formatFecha(b.fecha), y: b.porcentajeAvanceReportado };
    });
    document.getElementById("avance-historico").innerHTML = window.CANTERA_UI.lineChartHTML(points);
  }

  function renderTablaObrasFin() {
    var tbody = document.getElementById("tabla-obras-fin");
    tbody.innerHTML = data.obras.map(function (obra) {
      var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
      var riesgo = window.CANTERA.riesgoBadge(obra.estadoRiesgo);
      var cat = equipo ? window.CANTERA.scoreCategoria(equipo.calificacionActual) : null;
      return (
        '<tr><td data-label="Código">' + obra.codigo + '</td><td data-label="Ubicación">' + obra.ubicacion + '</td><td data-label="Tipo de vivienda">' + obra.tipoVivienda + "</td>" +
        '<td data-label="Etapa">' + obra.etapaActual + "</td>" +
        '<td data-label="Avance" style="min-width:140px">' + window.CANTERA_UI.progressRowHTML(obra.porcentajeAvance) + "</td>" +
        '<td data-label="Riesgo">' + window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) + "</td>" +
        '<td data-label="Equipo">' + (equipo ? equipo.nombre : "—") + "</td>" +
        '<td data-label="Categoría">' + (cat ? window.CANTERA_UI.badgeHTML(cat.label, cat.clase) : "—") + "</td></tr>"
      );
    }).join("");
  }

  function renderRankingFin() {
    var ordenado = data.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    document.getElementById("ranking-fin").innerHTML = ordenado.map(function (eq) {
      var obra = window.CANTERA.getObra(data, eq.obraId);
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return (
        '<div class="card team-rank-card">' +
          window.CANTERA_UI.scoreRingHTML(eq.calificacionActual, { small: true }) +
          '<div class="info">' +
            "<h4>" + eq.nombre + "</h4>" +
            "<p>" + (obra ? obra.codigo : "Sin obra") + " · " + eq.integrantes.length + " integrantes</p>" +
            window.CANTERA_UI.badgeHTML(cat.label, cat.clase) +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderEntidades() {
    var el = document.getElementById("entidades-grid");
    el.innerHTML = data.entidadesFinancieras.map(function (ent) {
      var obras = data.obras.filter(function (o) { return o.entidadFinancieraId === ent.id; });
      var avance = obras.length
        ? Math.round(obras.reduce(function (sum, o) { return sum + o.porcentajeAvance; }, 0) / obras.length)
        : 0;
      var bajo = obras.filter(function (o) { return o.estadoRiesgo === "bajo"; }).length;
      var medio = obras.filter(function (o) { return o.estadoRiesgo === "medio"; }).length;
      var alto = obras.filter(function (o) { return o.estadoRiesgo === "alto"; }).length;

      var obrasHTML = obras.map(function (o) {
        var riesgo = window.CANTERA.riesgoBadge(o.estadoRiesgo);
        return (
          '<div class="module-item">' +
            '<div class="info"><h4>' + o.codigo + '</h4><p>' + o.ubicacion + " · Avance: " + o.porcentajeAvance + "%</p></div>" +
            "<div>" + window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) + "</div>" +
          "</div>"
        );
      }).join("") || '<p class="text-sm text-mid mb-0">Sin obras asignadas todavía.</p>';

      return (
        '<div class="card">' +
          '<div class="flex-between" style="margin-bottom:6px">' +
            "<h3 style=\"color:var(--navy);margin-bottom:0\">" + ent.nombre + "</h3>" +
            window.CANTERA_UI.badgeHTML(capitalize(ent.tipo), "sky") +
          "</div>" +
          '<p class="text-sm text-mid" style="margin-bottom:14px">' + ent.contacto + " · Aliado desde " + window.CANTERA.formatFecha(ent.fechaAlianza) + "</p>" +
          '<div class="grid grid-3" style="margin-bottom:14px">' +
            '<div><span class="text-sm text-mid">Obras</span><br><strong style="font-size:20px;color:var(--navy)">' + obras.length + "</strong></div>" +
            '<div><span class="text-sm text-mid">Avance promedio</span><br><strong style="font-size:20px;color:var(--navy)">' + avance + "%</strong></div>" +
            '<div><span class="text-sm text-mid">Riesgo</span><br>' +
              '<span class="text-sm">' + bajo + " bajo · " + medio + " medio · " + alto + " alto</span>" +
            "</div>" +
          "</div>" +
          obrasHTML +
        "</div>"
      );
    }).join("");
  }

  function populateSelectorObra() {
    document.getElementById("selector-obra-fin").innerHTML = data.obras.map(function (o) {
      return '<option value="' + o.id + '">' + o.codigo + " — " + o.ubicacion + "</option>";
    }).join("");
  }

  function renderTrazabilidad(obraId) {
    var obra = window.CANTERA.getObra(data, obraId);
    var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
    var entradas = window.CANTERA.getBitacoraPorObra(data, obraId);
    var riesgo = window.CANTERA.riesgoBadge(obra.estadoRiesgo);
    var integrantesEquipo = equipo ? window.CANTERA.getAlumnosPorEquipo(data, equipo.id) : [];

    document.getElementById("trazabilidad-resumen").innerHTML =
      '<div class="flex-between" style="margin-bottom:8px"><strong>' + obra.codigo + " — " + obra.tipoVivienda + "</strong>" +
      window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) + "</div>" +
      '<p class="text-sm text-mid mb-0">Equipo asignado: ' + (equipo ? equipo.nombre : "—") + " · Etapa actual: " + obra.etapaActual + " · Avance: " + obra.porcentajeAvance + "%</p>" +
      (integrantesEquipo.length
        ? '<ul class="equipo-card-miembros" style="margin-bottom:8px">' + integrantesEquipo.map(function (al) {
            return '<li><span>' + al.nombre + '</span><span class="rol-tag">' + window.CANTERA.rolEquipoLabel(al.rolEnEquipoActual) + '</span></li>';
          }).join("") + "</ul>"
        : "") +
      '<p class="text-sm text-mid mb-0">' + entradas.length + " entrada(s) de bitácora registradas para esta obra.</p>";

    document.getElementById("trazabilidad-bitacora").innerHTML = entradas.map(function (b) {
      return (
        '<div class="log-entry">' +
          '<div class="log-date">' + window.CANTERA.formatFecha(b.fecha) + "</div>" +
          '<div class="log-stage">' + b.etapa + " · " + b.porcentajeAvanceReportado + "% de avance</div>" +
          "<p>" + b.descripcion + "</p>" +
          '<div class="log-meta"><span>Evidencias adjuntas: ' + b.evidencias.length + "</span></div>" +
        "</div>"
      );
    }).join("") || '<p class="text-sm text-mid">Sin entradas de bitácora todavía.</p>';
  }

  function renderSuccessList() {
    document.getElementById("success-list-fin").innerHTML = window.CANTERA.CRITERIOS_EXITO_PILOTO.map(function (c) {
      return '<li><span class="check">' + window.CANTERA_UI.ICONS.check + "</span>" + c + "</li>";
    }).join("");
  }

  function buildReporteImprimible(obraId) {
    var obra = window.CANTERA.getObra(data, obraId);
    var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
    var entidad = window.CANTERA.getEntidad(data, obra.entidadFinancieraId);
    var entradas = window.CANTERA.getBitacoraPorObra(data, obraId);
    var cat = window.CANTERA.scoreCategoria(equipo.calificacionActual);
    var hoy = new Date();
    var fechaGeneracion = hoy.getDate() + "/" + (hoy.getMonth() + 1) + "/" + hoy.getFullYear();

    var criteriosHTML = window.CANTERA.CRITERIOS_EVALUACION.map(function (c) {
      return "<li>" + c.label + ": " + (equipo.evaluacion[c.key] || 0) + "/" + c.max + "</li>";
    }).join("");

    var entidadesHTML = data.entidadesFinancieras.map(function (ent) {
      var obras = data.obras.filter(function (o) { return o.entidadFinancieraId === ent.id; });
      var avance = obras.length
        ? Math.round(obras.reduce(function (sum, o) { return sum + o.porcentajeAvance; }, 0) / obras.length)
        : 0;
      return "<li>" + ent.nombre + ": " + obras.length + " obra(s), avance promedio " + avance + "%</li>";
    }).join("");

    var montoLiberado = window.CANTERA.montoLiberado(obra);
    var desembolsosHTML = window.CANTERA.getTramosDesembolso().map(function (t) {
      var d = window.CANTERA.getDesembolso(obra, t.id);
      var estado = d ? d.estado : "pendiente";
      var badge = window.CANTERA.desembolsoEstadoBadge(estado);
      return "<li>" + t.nombre + " (" + t.pct + "% — " + window.CANTERA.formatQ(window.CANTERA.montoTramo(obra, t.id)) + "): " + badge.texto + "</li>";
    }).join("");

    document.getElementById("reporte-imprimible").innerHTML =
      "<h1>Reporte ejecutivo — Cantera Construcción</h1>" +
      "<p>Generado: " + fechaGeneracion + " · Prototipo v1, Fase 1 (datos de ejemplo)</p>" +
      "<h3>Obra: " + obra.codigo + "</h3>" +
      "<p>Ubicación: " + obra.ubicacion + " · Tipo: " + obra.tipoVivienda + " · Entidad financiera: " + (entidad ? entidad.nombre : "—") + "</p>" +
      "<p>Etapa actual: " + obra.etapaActual + " · Avance: " + obra.porcentajeAvance + "% · Riesgo: " + obra.estadoRiesgo + "</p>" +
      "<h3>Equipo asignado: " + equipo.nombre + " (" + equipo.codigo + ")</h3>" +
      "<p>Calificación: " + equipo.calificacionActual + "/100 — " + cat.label + " (" + cat.desc + ")</p>" +
      "<ul>" + criteriosHTML + "</ul>" +
      "<h3>Bitácora</h3>" +
      "<p>" + entradas.length + " entrada(s) registradas. Última: " + (entradas[0] ? window.CANTERA.formatFecha(entradas[0].fecha) + " — " + entradas[0].descripcion : "sin registros") + "</p>" +
      "<h3>Financiamiento y desembolsos</h3>" +
      "<p>Monto total financiado: " + window.CANTERA.formatQ(obra.montoTotalFinanciadoQ) + " · Liberado a la fecha: " + window.CANTERA.formatQ(montoLiberado) + "</p>" +
      "<ul>" + desembolsosHTML + "</ul>" +
      "<h3>Desglose por entidad financiera</h3>" +
      "<ul>" + entidadesHTML + "</ul>" +
      "<h3>Criterios de éxito del piloto (objetivo a validar)</h3>" +
      "<ul>" + window.CANTERA.CRITERIOS_EXITO_PILOTO.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();
