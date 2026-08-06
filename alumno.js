/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA ALUMNO (alumno.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan jefe/admin/financiera.
   ========================================================= */

(function () {
  "use strict";

  var SELECTED_KEY = "cantera_ui_selected_alumno";
  var CRITERIOS_ALUMNO = [
    "Asistencia", "Prueba teórica", "Prueba práctica", "Uso de herramientas",
    "Seguridad", "Documentación digital", "Actitud", "Puntualidad", "Trabajo en equipo"
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CANTERA.loadData();
    populateSelector(data);

    var initialId = getSelectedId(data);
    document.getElementById("selector-alumno").value = initialId;
    render(initialId);

    document.getElementById("selector-alumno").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) { /* noop */ }
      render(e.target.value);
    });
  });

  function getSelectedId(data) {
    var stored = null;
    try { stored = localStorage.getItem(SELECTED_KEY); } catch (e) { stored = null; }
    if (stored && window.CANTERA.getAlumno(data, stored)) return stored;
    return window.CANTERA.getAlumnoDestacado(data).id;
  }

  function populateSelector(data) {
    var select = document.getElementById("selector-alumno");
    select.innerHTML = data.alumnos.map(function (a) {
      var equipo = a.equipoId ? window.CANTERA.getEquipo(data, a.equipoId) : null;
      var suffix = equipo ? " — " + equipo.nombre : " — sin equipo";
      return '<option value="' + a.id + '">' + a.nombre + suffix + "</option>";
    }).join("");
  }

  function render(alumnoId) {
    var data = window.CANTERA.loadData();
    var alumno = window.CANTERA.getAlumno(data, alumnoId);
    if (!alumno) return;

    renderPerfil(alumno);
    renderEstadoEquipo(data, alumno);
    renderRutaFormativa(data, alumno);
    renderEvaluacion(alumno);
  }

  function renderPerfil(alumno) {
    document.getElementById("perfil-avatar").textContent = window.CANTERA_UI.initialsFromName(alumno.nombre);
    document.getElementById("perfil-nombre").textContent = alumno.nombre;
    document.getElementById("perfil-meta").textContent =
      alumno.municipio + " · " + alumno.edad + " años · Disponibilidad " + alumno.disponibilidad + " · Interés en construcción: " + alumno.interesConstruccion;
    var cert = window.CANTERA.certificacionBadge(alumno.estadoCertificacion);
    document.getElementById("perfil-cert-badge").innerHTML = window.CANTERA_UI.badgeHTML(cert.texto, cert.clase);
  }

  function renderEstadoEquipo(data, alumno) {
    var el = document.getElementById("estado-equipo-card");
    if (alumno.equipoId) {
      var equipo = window.CANTERA.getEquipo(data, alumno.equipoId);
      var obra = equipo ? window.CANTERA.getObra(data, equipo.obraId) : null;
      el.innerHTML =
        '<div class="card-title">Mi equipo</div>' +
        "<p>Ya formas parte de <strong>" + equipo.nombre + "</strong> (" + equipo.codigo + ") como <strong>" + (alumno.rolEnEquipo || "integrante") + "</strong>.</p>" +
        (obra
          ? "<p class=\"text-sm text-mid mb-0\">Obra asignada: " + obra.codigo + " — etapa actual: " + obra.etapaActual + " (" + obra.porcentajeAvance + "% de avance).</p>"
          : "");
    } else if (alumno.estadoCertificacion === "certificado") {
      el.innerHTML =
        '<div class="card-title">Estado</div>' +
        '<p class="mb-0">Estás certificado y disponible para asignación a un equipo. En cuanto Cantera confirme un equipo, aparecerá aquí.</p>';
    } else {
      var pct = window.CANTERA.progresoFormativoPct(alumno);
      var faltantes = alumno.progresoModulos.filter(function (p) { return p.estado !== "completado"; }).length;
      el.innerHTML =
        '<div class="card-title">Estado</div>' +
        "<p class=\"mb-0\">Aún estás en formación (" + pct + "% completado). Te faltan " + faltantes + " módulo(s) para completar tu ruta formativa y quedar disponible para un equipo.</p>";
    }
  }

  function renderRutaFormativa(data, alumno) {
    var pct = window.CANTERA.progresoFormativoPct(alumno);
    document.getElementById("progreso-general-bar").querySelector("span").style.width = pct + "%";
    document.getElementById("progreso-general-pct").textContent = pct + "%";

    var lista = document.getElementById("lista-modulos");
    lista.innerHTML = "";

    window.CANTERA.MODULOS_FORMATIVOS.forEach(function (modulo, idx) {
      var progreso = alumno.progresoModulos.filter(function (p) { return p.moduloId === modulo.id; })[0];
      var estado = progreso ? progreso.estado : "pendiente";
      var prevCompletado = idx === 0 || alumno.progresoModulos[idx - 1].estado === "completado";

      var dot = estado === "completado" ? "✓" : String(modulo.orden);
      var item = document.createElement("div");
      item.className = "module-item";

      var accionHTML = "";
      if (estado === "completado") {
        accionHTML = '<span class="badge badge-green">Completado</span>';
      } else if (estado === "en_curso") {
        accionHTML = '<button class="btn btn-secondary btn-sm" data-modulo="' + modulo.id + '" data-accion="completar">Marcar completado</button>';
      } else if (prevCompletado) {
        accionHTML = '<button class="btn btn-secondary btn-sm" data-modulo="' + modulo.id + '" data-accion="iniciar">Iniciar módulo</button>';
      } else {
        accionHTML = '<span class="text-sm text-mid">Bloqueado</span>';
      }

      item.innerHTML =
        '<div class="status-dot ' + estado + '">' + dot + "</div>" +
        '<div class="info"><h4>' + modulo.nombre + "</h4><p>" + window.CANTERA.moduloEstadoLabel(estado) + " · " + modulo.tipo + " · " + modulo.horas + "h</p></div>" +
        '<div>' + accionHTML + "</div>";
      lista.appendChild(item);
    });

    lista.querySelectorAll("button[data-accion]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var moduloId = btn.getAttribute("data-modulo");
        var accion = btn.getAttribute("data-accion");
        var entry = alumno.progresoModulos.filter(function (p) { return p.moduloId === moduloId; })[0];
        if (!entry) return;
        if (accion === "iniciar") entry.estado = "en_curso";
        if (accion === "completar") { entry.estado = "completado"; entry.fecha = new Date().toISOString().slice(0, 10); }
        window.CANTERA.saveData(data);
        render(alumno.id);
      });
    });
  }

  function renderEvaluacion(alumno) {
    var pct = window.CANTERA.progresoFormativoPct(alumno);
    var numAprobados = Math.round((pct / 100) * CRITERIOS_ALUMNO.length);
    var ul = document.getElementById("lista-evaluacion");
    ul.innerHTML = CRITERIOS_ALUMNO.map(function (criterio, i) {
      var aprobado = i < numAprobados;
      var iconHTML = aprobado ? window.CANTERA_UI.ICONS.check : "";
      return (
        '<li><span class="check" style="background:' + (aprobado ? "var(--green-bg)" : "var(--gray-bg)") +
        ";color:" + (aprobado ? "var(--green)" : "var(--gray-mid)") + '">' + iconHTML + "</span>" +
        criterio + '<span class="text-sm text-mid" style="margin-left:auto">' + (aprobado ? "Aprobado" : "Pendiente") + "</span></li>"
      );
    }).join("");
  }
})();
