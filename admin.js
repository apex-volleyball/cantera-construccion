/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA ADMINISTRADOR (admin.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan alumno/jefe/financiera.
   ========================================================= */

(function () {
  "use strict";

  var data;

  document.addEventListener("DOMContentLoaded", function () {
    data = window.CANTERA.loadData();

    renderMetricas();
    renderAlertas();
    renderRanking();
    renderTablaAlumnos("");
    renderTablaEquipos();
    renderTablaObras();
    renderSuccessList();

    document.getElementById("buscador-alumnos").addEventListener("input", function (e) {
      renderTablaAlumnos(e.target.value.toLowerCase());
    });
  });

  function renderMetricas() {
    var certificados = data.alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; }).length;
    setText("m-alumnos", data.alumnos.length);
    setText("m-certificados", certificados);
    setText("m-equipos", data.equipos.length);
    setText("m-obras", data.obras.length);
  }

  function renderAlertas() {
    var items = [];
    data.incidencias.filter(function (i) { return i.estado === "abierta"; }).forEach(function (inc) {
      var obra = window.CANTERA.getObra(data, inc.obraId);
      items.push({
        nivel: inc.severidad === "alta" ? "high" : "medium",
        texto: "<strong>" + (obra ? obra.codigo : inc.obraId) + "</strong> — " + inc.tipo + ": " + inc.descripcion
      });
    });
    data.obras.filter(function (o) { return o.estadoRiesgo === "alto"; }).forEach(function (obra) {
      items.push({ nivel: "high", texto: "<strong>" + obra.codigo + "</strong> tiene riesgo alto — revisar avance y documentación." });
    });

    var el = document.getElementById("lista-alertas");
    if (!items.length) {
      el.innerHTML = '<p class="text-sm text-mid">Sin alertas activas por el momento.</p>';
      return;
    }
    el.innerHTML = items.map(function (it) {
      return '<div class="alert-item ' + it.nivel + '">' + window.CANTERA_UI.ICONS.alert + "<span>" + it.texto + "</span></div>";
    }).join("");
  }

  function renderRanking() {
    var ordenado = data.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var el = document.getElementById("ranking-equipos");
    el.innerHTML = ordenado.map(function (eq) {
      var obra = window.CANTERA.getObra(data, eq.obraId);
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return (
        '<div class="card team-rank-card">' +
          window.CANTERA_UI.scoreRingHTML(eq.calificacionActual, { small: true }) +
          '<div class="info">' +
            "<h4>" + eq.nombre + " <span class=\"text-sm text-mid\">(" + eq.codigo + ")</span></h4>" +
            "<p>" + (obra ? obra.codigo + " · " + obra.etapaActual : "Sin obra asignada") + "</p>" +
            window.CANTERA_UI.badgeHTML(cat.label, cat.clase) +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderTablaAlumnos(filtro) {
    var filtrados = data.alumnos.filter(function (a) {
      if (!filtro) return true;
      return a.nombre.toLowerCase().indexOf(filtro) !== -1 || a.municipio.toLowerCase().indexOf(filtro) !== -1;
    });
    var tbody = document.getElementById("tabla-alumnos");
    tbody.innerHTML = filtrados.map(function (a) {
      var equipo = a.equipoId ? window.CANTERA.getEquipo(data, a.equipoId) : null;
      var cert = window.CANTERA.certificacionBadge(a.estadoCertificacion);
      return (
        '<tr><td data-label="Nombre">' + a.nombre + (a.destacado ? ' <span class="badge badge-sky">Caso destacado</span>' : "") + "</td>" +
        '<td data-label="Municipio">' + a.municipio + "</td>" +
        '<td data-label="Certificación">' + window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) + "</td>" +
        '<td data-label="Equipo">' + (equipo ? equipo.nombre : "Sin equipo") + "</td>" +
        '<td data-label="Potencial">' + capitalize(a.potencial) + "</td></tr>"
      );
    }).join("");
  }

  function renderTablaEquipos() {
    var tbody = document.getElementById("tabla-equipos");
    tbody.innerHTML = data.equipos.map(function (eq) {
      var obra = window.CANTERA.getObra(data, eq.obraId);
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return (
        '<tr><td data-label="Código">' + eq.codigo + '</td><td data-label="Nombre">' + eq.nombre + "</td>" +
        '<td data-label="Categoría">' + window.CANTERA_UI.badgeHTML(cat.label + " · " + eq.calificacionActual, cat.clase) + "</td>" +
        '<td data-label="Integrantes">' + eq.integrantes.length + '</td><td data-label="Ubicación">' + eq.ubicacion + "</td>" +
        '<td data-label="Obra asignada">' + (obra ? obra.codigo : "—") + '</td><td data-label="Disponibilidad">' + capitalize(eq.disponibilidad) + "</td></tr>"
      );
    }).join("");
  }

  function renderTablaObras() {
    var tbody = document.getElementById("tabla-obras");
    tbody.innerHTML = data.obras.map(function (obra) {
      var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
      var entidad = window.CANTERA.getEntidad(data, obra.entidadFinancieraId);
      var riesgo = window.CANTERA.riesgoBadge(obra.estadoRiesgo);
      return (
        '<tr><td data-label="Código">' + obra.codigo + '</td><td data-label="Propietario">' + obra.propietario + "</td>" +
        '<td data-label="Equipo">' + (equipo ? equipo.nombre : "—") + '</td><td data-label="Etapa">' + obra.etapaActual + "</td>" +
        '<td data-label="Avance" style="min-width:140px">' + window.CANTERA_UI.progressRowHTML(obra.porcentajeAvance) + "</td>" +
        '<td data-label="Riesgo">' + window.CANTERA_UI.badgeHTML(riesgo.texto, riesgo.clase) + "</td>" +
        '<td data-label="Entidad financiera">' + (entidad ? entidad.nombre : "—") + "</td></tr>"
      );
    }).join("");
  }

  function renderSuccessList() {
    document.getElementById("success-list").innerHTML = window.CANTERA.CRITERIOS_EXITO_PILOTO.map(function (c) {
      return '<li><span class="check">' + window.CANTERA_UI.ICONS.check + "</span>" + c + "</li>";
    }).join("");
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
