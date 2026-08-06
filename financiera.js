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

    renderKPIs();
    renderTablaObrasFin();
    renderRankingFin();
    renderSuccessList();
    populateSelectorObra();

    var initialId = getSelectedObraId();
    document.getElementById("selector-obra-fin").value = initialId;
    renderTrazabilidad(initialId);

    document.getElementById("selector-obra-fin").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) { /* noop */ }
      renderTrazabilidad(e.target.value);
    });

    document.getElementById("btn-descargar-reporte").addEventListener("click", function () {
      var obraId = document.getElementById("selector-obra-fin").value;
      buildReporteImprimible(obraId);
      window.print();
    });
  });

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
    setText("k-obras", data.obras.length);
    setText("k-equipos", data.equipos.length);
    setText("k-avance", promedio + "%");
    setText("k-riesgo", riesgoAlto);
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

    document.getElementById("trazabilidad-resumen").innerHTML =
      '<div class="flex-between" style="margin-bottom:8px"><strong>' + obra.codigo + " — " + obra.tipoVivienda + "</strong>" +
      window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) + "</div>" +
      '<p class="text-sm text-mid mb-0">Equipo asignado: ' + (equipo ? equipo.nombre : "—") + " · Etapa actual: " + obra.etapaActual + " · Avance: " + obra.porcentajeAvance + "%</p>" +
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
      "<h3>Criterios de éxito del piloto (objetivo a validar)</h3>" +
      "<ul>" + window.CANTERA.CRITERIOS_EXITO_PILOTO.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
})();
