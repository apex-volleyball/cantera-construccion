/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA JEFE DE GRUPO (jefe.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan alumno/admin/financiera.
   ========================================================= */

(function () {
  "use strict";

  var SELECTED_KEY = "cantera_ui_selected_equipo";
  var evidenciasTemp = [];

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CANTERA.loadData();
    populateSelectorEquipo(data);

    var initialId = getSelectedEquipoId(data);
    document.getElementById("selector-equipo").value = initialId;
    render(initialId);

    document.getElementById("selector-equipo").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) { /* noop */ }
      evidenciasTemp = [];
      render(e.target.value);
    });

    document.getElementById("b-incidencia-check").addEventListener("change", function (e) {
      document.getElementById("b-incidencia-campos").style.display = e.target.checked ? "block" : "none";
    });

    document.getElementById("b-evidencia-btn").addEventListener("click", function () {
      var n = evidenciasTemp.length + 1;
      evidenciasTemp.push({ tipo: "foto", descripcion: "Evidencia " + n + " (simulada)" });
      renderEvidenciasTemp();
    });

    document.getElementById("bitacora-form").addEventListener("submit", handleBitacoraSubmit);
  });

  function getSelectedEquipoId(data) {
    var stored = null;
    try { stored = localStorage.getItem(SELECTED_KEY); } catch (e) { stored = null; }
    if (stored && window.CANTERA.getEquipo(data, stored)) return stored;
    return window.CANTERA.getEquipoDestacado(data).id;
  }

  function populateSelectorEquipo(data) {
    var select = document.getElementById("selector-equipo");
    select.innerHTML = data.equipos.map(function (eq) {
      return '<option value="' + eq.id + '">' + eq.nombre + " (" + eq.codigo + ")</option>";
    }).join("");
  }

  function render(equipoId) {
    var data = window.CANTERA.loadData();
    var equipo = window.CANTERA.getEquipo(data, equipoId);
    if (!equipo) return;
    var obra = window.CANTERA.getObra(data, equipo.obraId);

    renderEquipo(data, equipo);
    renderObra(data, equipo, obra);
    renderIncidencias(data, obra);
    renderBitacoraForm(obra);
    renderBitacoraHistorial(data, obra);
    renderEvaluacion(equipo);
  }

  function renderEquipo(data, equipo) {
    document.getElementById("equipo-nombre").textContent = equipo.nombre + " (" + equipo.codigo + ")";
    document.getElementById("equipo-meta").textContent = equipo.ubicacion + " · " + equipo.integrantes.length + " integrantes · Disponibilidad: " + equipo.disponibilidad;
    document.getElementById("equipo-score").innerHTML = window.CANTERA_UI.scoreRingHTML(equipo.calificacionActual, { small: true });

    var integrantes = window.CANTERA.getAlumnosPorEquipo(data, equipo.id);
    var lista = document.getElementById("lista-integrantes");
    lista.innerHTML = integrantes.map(function (al) {
      var cert = window.CANTERA.certificacionBadge(al.estadoCertificacion);
      return (
        '<div class="module-item">' +
          '<div class="avatar sm">' + window.CANTERA_UI.initialsFromName(al.nombre) + "</div>" +
          '<div class="info"><h4>' + al.nombre + "</h4><p>" + capitalize(al.rolEnEquipoActual) + " · " + al.municipio + "</p></div>" +
          "<div>" + window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) + "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderObra(data, equipo, obra) {
    var entidad = window.CANTERA.getEntidad(data, obra.entidadFinancieraId);
    var riesgo = window.CANTERA.riesgoBadge(obra.estadoRiesgo);
    document.getElementById("obra-info").innerHTML =
      '<div class="flex-between" style="margin-bottom:10px">' +
        "<div><strong>" + obra.codigo + "</strong> · " + obra.tipoVivienda + "</div>" +
        window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) +
      "</div>" +
      '<p class="text-sm text-mid mb-0">Propietario: ' + obra.propietario + " · Ubicación: " + obra.ubicacion + "</p>" +
      '<p class="text-sm text-mid mb-0">Supervisor: ' + obra.supervisor + " · Entidad financiera: " + (entidad ? entidad.nombre : "—") + "</p>" +
      '<p class="text-sm text-mid mb-0">Inicio: ' + window.CANTERA.formatFecha(obra.fechaInicio) + " · Entrega estimada: " + window.CANTERA.formatFecha(obra.fechaEstimadaEntrega) + "</p>";

    document.getElementById("obra-stage-tracker").innerHTML = window.CANTERA_UI.stageTrackerHTML(obra.etapaActual);
    document.getElementById("obra-progress-bar").querySelector("span").style.width = obra.porcentajeAvance + "%";
    document.getElementById("obra-progress-pct").textContent = obra.porcentajeAvance + "%";
  }

  function renderIncidencias(data, obra) {
    var incidencias = window.CANTERA.getIncidenciasPorObra(data, obra.id);
    var el = document.getElementById("lista-incidencias");
    if (!incidencias.length) {
      el.innerHTML = '<p class="text-sm text-mid mb-0">Sin incidencias registradas.</p>';
      return;
    }
    el.innerHTML = incidencias.map(function (inc) {
      var estadoBadge = inc.estado === "abierta" ? window.CANTERA_UI.badgeHTML("Abierta", "red") : window.CANTERA_UI.badgeHTML("Resuelta", "green");
      return (
        '<div class="alert-item ' + (inc.severidad === "alta" ? "high" : "medium") + '" style="align-items:flex-start;flex-direction:column;gap:6px">' +
          '<div class="flex-between" style="width:100%"><strong>' + inc.tipo + "</strong>" + estadoBadge + "</div>" +
          "<div>" + inc.descripcion + "</div>" +
          (inc.resolucion ? '<div class="text-sm" style="color:var(--green)">Resolución: ' + inc.resolucion + "</div>" : "") +
        "</div>"
      );
    }).join("");
  }

  function renderBitacoraForm(obra) {
    var select = document.getElementById("b-etapa");
    select.innerHTML = window.CANTERA.ETAPAS_OBRA.map(function (etapa) {
      return '<option value="' + etapa + '"' + (etapa === obra.etapaActual ? " selected" : "") + ">" + etapa + "</option>";
    }).join("");
    document.getElementById("b-avance").value = obra.porcentajeAvance;
    document.getElementById("b-desc").value = "";
    document.getElementById("b-materiales").value = "";
    document.getElementById("b-herramientas").value = "";
    document.getElementById("b-incidencia-check").checked = false;
    document.getElementById("b-incidencia-campos").style.display = "none";
    document.getElementById("b-inc-tipo").value = "";
    document.getElementById("b-inc-desc").value = "";
    document.getElementById("b-revision-check").checked = false;
    evidenciasTemp = [];
    renderEvidenciasTemp();
  }

  function renderEvidenciasTemp() {
    var el = document.getElementById("b-evidencia-lista");
    el.innerHTML = evidenciasTemp.map(function (ev) {
      return window.CANTERA_UI.badgeHTML(ev.descripcion, "sky");
    }).join("");
  }

  function renderBitacoraHistorial(data, obra) {
    var entradas = window.CANTERA.getBitacoraPorObra(data, obra.id);
    var el = document.getElementById("lista-bitacora");
    if (!entradas.length) {
      el.innerHTML = '<p class="text-sm text-mid mb-0">Todavía no hay entradas de bitácora para esta obra.</p>';
      return;
    }
    el.innerHTML = entradas.map(function (b) {
      return (
        '<div class="log-entry">' +
          '<div class="log-date">' + window.CANTERA.formatFecha(b.fecha) + "</div>" +
          '<div class="log-stage">' + b.etapa + " · " + b.porcentajeAvanceReportado + "% de avance</div>" +
          "<p>" + b.descripcion + "</p>" +
          '<div class="log-meta">' +
            "<span>Materiales: " + (b.materiales || "—") + "</span>" +
            "<span>Herramientas: " + (b.herramientas || "—") + "</span>" +
            "<span>Evidencias: " + b.evidencias.length + "</span>" +
            (b.solicitudRevision ? "<span>Solicitó revisión de supervisor</span>" : "") +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderEvaluacion(equipo) {
    var cat = window.CANTERA.scoreCategoria(equipo.calificacionActual);
    var el = document.getElementById("evaluacion-equipo");
    var criteriosHTML = window.CANTERA.CRITERIOS_EVALUACION.map(function (c) {
      var valor = equipo.evaluacion[c.key] || 0;
      var pct = Math.round((valor / c.max) * 100);
      return (
        '<div class="mt-8">' +
          '<div class="flex-between text-sm" style="margin-bottom:4px"><span>' + c.label + "</span><span class=\"text-mid\">" + valor + "/" + c.max + "</span></div>" +
          window.CANTERA_UI.progressRowHTML(pct, cat.clase === "red" ? "red" : (cat.clase === "yellow" ? "yellow" : "green")) +
        "</div>"
      );
    }).join("");
    el.innerHTML =
      '<div class="flex gap-16" style="align-items:center;margin-bottom:10px">' +
        window.CANTERA_UI.scoreRingHTML(equipo.calificacionActual) +
        "<div>" + window.CANTERA_UI.badgeHTML(cat.label, cat.clase) + '<p class="text-sm text-mid mt-8 mb-0">' + cat.desc + "</p></div>" +
      "</div>" +
      criteriosHTML;
  }

  function handleBitacoraSubmit(e) {
    e.preventDefault();
    var data = window.CANTERA.loadData();
    var equipoId = document.getElementById("selector-equipo").value;
    var equipo = window.CANTERA.getEquipo(data, equipoId);
    var obra = window.CANTERA.getObra(data, equipo.obraId);

    var etapa = document.getElementById("b-etapa").value;
    var avance = parseInt(document.getElementById("b-avance").value, 10) || 0;
    var descripcion = document.getElementById("b-desc").value.trim();
    var materiales = document.getElementById("b-materiales").value.trim();
    var herramientas = document.getElementById("b-herramientas").value.trim();
    var solicitudRevision = document.getElementById("b-revision-check").checked;
    var reportarIncidencia = document.getElementById("b-incidencia-check").checked;

    if (!descripcion) { alert("Describe el avance antes de guardar."); return; }

    var nuevaId = "bt-" + Date.now();
    var incidenciaId = null;

    if (reportarIncidencia) {
      var incTipo = document.getElementById("b-inc-tipo").value.trim() || "Sin especificar";
      var incDesc = document.getElementById("b-inc-desc").value.trim() || "Sin descripción";
      var incSeveridad = document.getElementById("b-inc-severidad").value;
      var nuevaIncidencia = {
        id: "inc-" + Date.now(),
        obraId: obra.id, equipoId: equipo.id,
        fecha: new Date().toISOString().slice(0, 10),
        tipo: incTipo, descripcion: incDesc, severidad: incSeveridad,
        estado: "abierta", resolucion: null
      };
      data.incidencias.push(nuevaIncidencia);
      incidenciaId = nuevaIncidencia.id;
    }

    var nuevaEntrada = {
      id: nuevaId, obraId: obra.id, equipoId: equipo.id,
      fecha: new Date().toISOString().slice(0, 10), etapa: etapa,
      descripcion: descripcion, materiales: materiales, herramientas: herramientas,
      evidencias: evidenciasTemp.slice(),
      incidenciaId: incidenciaId, porcentajeAvanceReportado: avance,
      solicitudRevision: solicitudRevision
    };
    data.bitacora.push(nuevaEntrada);

    obra.porcentajeAvance = avance;
    obra.etapaActual = etapa;

    window.CANTERA.saveData(data);
    render(equipoId);
  }

  function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();
