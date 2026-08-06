/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA ADMINISTRADOR (admin.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan alumno/jefe/financiera.
   ========================================================= */

(function () {
  "use strict";

  var data;
  var expandedAlumnos = {};

  document.addEventListener("DOMContentLoaded", function () {
    data = window.CANTERA.loadData();

    bindTabs();
    renderMetricas();
    renderAlertas();
    renderComparativaEquipos();
    renderRanking();
    renderTablaAlumnos("");
    renderTablaEquipos();
    renderTablaObras();
    renderSuccessList();
    renderSolicitudes();
    renderCertificados();

    document.getElementById("buscador-alumnos").addEventListener("input", function (e) {
      renderTablaAlumnos(e.target.value.toLowerCase());
    });

    document.getElementById("btn-descargar-reporte").addEventListener("click", function () {
      buildReporteImprimible();
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

  function renderMetricas() {
    var certificados = data.alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; }).length;
    var solicitudesPendientes = 0;
    data.alumnos.forEach(function (a) {
      (a.solicitudesFormacion || []).forEach(function (s) {
        if (s.estado === "solicitada") solicitudesPendientes++;
      });
    });
    var incidenciasAbiertas = data.incidencias.filter(function (i) { return i.estado === "abierta"; }).length;

    setText("m-alumnos", data.alumnos.length);
    setText("m-certificados", certificados);
    setText("m-equipos", data.equipos.length);
    setText("m-obras", data.obras.length);
    setText("m-solicitudes", solicitudesPendientes);
    setText("m-incidencias", incidenciasAbiertas);
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
    var solicitudesPendientes = [];
    data.alumnos.forEach(function (a) {
      (a.solicitudesFormacion || []).forEach(function (s) {
        if (s.estado === "solicitada") solicitudesPendientes.push({ alumno: a, s: s });
      });
    });
    if (solicitudesPendientes.length) {
      items.push({
        nivel: "medium",
        texto: "<strong>" + solicitudesPendientes.length + " solicitud(es)</strong> de formación adicional esperando aprobación — revisa la pestaña Solicitudes de formación."
      });
    }

    var el = document.getElementById("lista-alertas");
    if (!items.length) {
      el.innerHTML = '<p class="text-sm text-mid">Sin alertas activas por el momento.</p>';
      return;
    }
    el.innerHTML = items.map(function (it) {
      return '<div class="alert-item ' + it.nivel + '">' + window.CANTERA_UI.ICONS.alert + "<span>" + it.texto + "</span></div>";
    }).join("");
  }

  function renderComparativaEquipos() {
    var ordenado = data.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var items = ordenado.map(function (eq) {
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return { label: eq.codigo, value: eq.calificacionActual, max: 100, clase: cat.clase === "sky" ? "" : cat.clase };
    });
    document.getElementById("comparativa-equipos").innerHTML =
      '<p class="text-sm text-mid" style="margin-bottom:4px">Calificación actual (0–100) de cada equipo certificado.</p>' +
      window.CANTERA_UI.barChartHTML(items);
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
      var pct = window.CANTERA.progresoFormativoPct(a);
      var abierto = !!expandedAlumnos[a.id];
      return (
        '<tr><td data-label="Nombre">' + a.nombre + (a.destacado ? ' <span class="badge badge-sky">Caso destacado</span>' : "") + "</td>" +
        '<td data-label="Municipio">' + a.municipio + "</td>" +
        '<td data-label="Certificación">' + window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) + "</td>" +
        '<td data-label="Equipo">' + (equipo ? equipo.nombre : "Sin equipo") + "</td>" +
        '<td data-label="Progreso" style="min-width:130px">' + window.CANTERA_UI.progressRowHTML(pct) + "</td>" +
        '<td data-label="Potencial">' + capitalize(a.potencial) + "</td>" +
        '<td data-label="">' + '<button class="btn btn-secondary btn-sm" data-toggle-alumno="' + a.id + '">' + (abierto ? "Ocultar detalle" : "Ver detalle") + "</button></td></tr>" +
        '<tr class="detail-row" data-detail-of="' + a.id + '" style="' + (abierto ? "" : "display:none") + '">' +
          '<td colspan="7" style="background:var(--gray-bg)">' + alumnoDetalleHTML(a) + "</td></tr>"
      );
    }).join("");

    tbody.querySelectorAll("button[data-toggle-alumno]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-toggle-alumno");
        expandedAlumnos[id] = !expandedAlumnos[id];
        renderTablaAlumnos(document.getElementById("buscador-alumnos").value.toLowerCase());
      });
    });
  }

  function alumnoDetalleHTML(alumno) {
    var promedio = window.CANTERA.promedioNotas(alumno);
    var horas = window.CANTERA.horasCompletadas(alumno);
    var cert = alumno.estadoCertificacion === "certificado";
    var modulosHTML = window.CANTERA.MODULOS_FORMATIVOS.map(function (m) {
      var p = alumno.progresoModulos.filter(function (x) { return x.moduloId === m.id; })[0];
      var estado = p ? p.estado : "pendiente";
      var dot = estado === "completado" ? "✓" : (estado === "en_curso" ? "▶" : "—");
      var notaTxt = p && typeof p.nota === "number" ? " · Nota: " + p.nota : "";
      return (
        '<div class="content-item">' +
          '<span class="tag-tipo">' + (m.orden) + "</span>" +
          '<span>' + m.nombre + notaTxt + "</span>" +
          '<span class="dur">' + window.CANTERA.moduloEstadoLabel(estado) + " " + dot + "</span>" +
        "</div>"
      );
    }).join("");

    var solicitudesHTML = "";
    var solicitudes = alumno.solicitudesFormacion || [];
    if (solicitudes.length) {
      solicitudesHTML = '<div class="mt-16"><strong class="text-sm">Formaciones adicionales solicitadas</strong>' +
        solicitudes.map(function (s) {
          var curso = window.CANTERA.getCatalogoFormaciones().filter(function (c) { return c.id === s.cursoId; })[0];
          var badge = window.CANTERA.solicitudEstadoBadge(s.estado);
          return '<div class="mt-8 text-sm">' + (curso ? curso.nombre : s.cursoId) + " " + window.CANTERA_UI.badgeHTML(badge.texto, badge.clase) + "</div>";
        }).join("") +
      "</div>";
    }

    return (
      '<div style="padding:16px 4px">' +
        '<div class="grid grid-3" style="margin-bottom:14px">' +
          '<div><span class="text-sm text-mid">Progreso formativo</span><br>' + window.CANTERA.progresoFormativoPct(alumno) + "% completado</div>" +
          '<div><span class="text-sm text-mid">Nota promedio</span><br>' + (promedio !== null ? promedio + "/100" : "—") + "</div>" +
          '<div><span class="text-sm text-mid">Horas completadas</span><br>' + horas + " horas</div>" +
        "</div>" +
        (cert ? '<p class="text-sm mb-0" style="margin-bottom:10px"><strong>Certificado:</strong> ' + window.CANTERA.codigoCertificado(alumno) + "</p>" : "") +
        '<div>' + modulosHTML + "</div>" +
        solicitudesHTML +
      "</div>"
    );
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

  function renderSolicitudes() {
    var filas = [];
    data.alumnos.forEach(function (a) {
      (a.solicitudesFormacion || []).forEach(function (s) {
        filas.push({ alumno: a, s: s });
      });
    });

    var el = document.getElementById("lista-solicitudes");
    if (!filas.length) {
      el.innerHTML = '<p class="text-sm text-mid">Todavía no hay solicitudes de formación adicional registradas.</p>';
      return;
    }

    el.innerHTML =
      '<div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Alumno</th><th>Curso</th><th>Estado</th><th>Solicitada</th><th>Última actualización</th><th></th></tr></thead>' +
        '<tbody>' +
        filas.map(function (f) {
          var curso = window.CANTERA.getCatalogoFormaciones().filter(function (c) { return c.id === f.s.cursoId; })[0];
          var badge = window.CANTERA.solicitudEstadoBadge(f.s.estado);
          var accion = "";
          if (f.s.estado === "solicitada") {
            accion = '<button class="btn btn-primary btn-sm" data-avanzar-alumno="' + f.alumno.id + '" data-avanzar-curso="' + f.s.cursoId + '">Aprobar e iniciar</button>';
          } else if (f.s.estado === "en_curso") {
            accion = '<button class="btn btn-secondary btn-sm" data-avanzar-alumno="' + f.alumno.id + '" data-avanzar-curso="' + f.s.cursoId + '">Marcar completada</button>';
          } else {
            accion = '<span class="text-sm text-mid">Nota: ' + (f.s.nota !== null ? f.s.nota : "—") + '</span>';
          }
          return (
            '<tr><td data-label="Alumno">' + f.alumno.nombre + '</td>' +
            '<td data-label="Curso">' + (curso ? curso.nombre : f.s.cursoId) + "</td>" +
            '<td data-label="Estado">' + window.CANTERA_UI.badgeHTML(badge.texto, badge.clase) + "</td>" +
            '<td data-label="Solicitada">' + window.CANTERA.formatFecha(f.s.fechaSolicitud) + "</td>" +
            '<td data-label="Última actualización">' + window.CANTERA.formatFecha(f.s.fechaActualizacion) + "</td>" +
            '<td data-label="">' + accion + "</td></tr>"
          );
        }).join("") +
        "</tbody></table></div>";

    el.querySelectorAll("button[data-avanzar-alumno]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var alumnoId = btn.getAttribute("data-avanzar-alumno");
        var cursoId = btn.getAttribute("data-avanzar-curso");
        window.CANTERA.avanzarSolicitud(data, alumnoId, cursoId);
        data = window.CANTERA.loadData();
        renderSolicitudes();
        renderMetricas();
        renderAlertas();
        renderCertificados();
        if (window.CANTERA_UI.renderNavBadges) window.CANTERA_UI.renderNavBadges();
      });
    });
  }

  function renderCertificados() {
    var certificados = data.alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; });
    var tbodyPrincipal = document.getElementById("tabla-certificados");
    if (!certificados.length) {
      tbodyPrincipal.innerHTML = '<tr><td colspan="5" class="text-sm text-mid">Todavía no hay certificados emitidos.</td></tr>';
    } else {
      tbodyPrincipal.innerHTML = certificados.map(function (a) {
        var promedio = window.CANTERA.promedioNotas(a);
        var horas = window.CANTERA.horasCompletadas(a);
        return (
          '<tr><td data-label="Código de certificado"><strong>' + window.CANTERA.codigoCertificado(a) + "</strong></td>" +
          '<td data-label="Alumno">' + a.nombre + "</td>" +
          '<td data-label="Municipio">' + a.municipio + "</td>" +
          '<td data-label="Nota promedio">' + (promedio !== null ? promedio + "/100" : "—") + "</td>" +
          '<td data-label="Horas completadas">' + horas + " horas</td></tr>"
        );
      }).join("");
    }

    var especializaciones = [];
    data.alumnos.forEach(function (a) {
      (a.solicitudesFormacion || []).forEach(function (s) {
        if (s.estado === "completada") especializaciones.push({ alumno: a, s: s });
      });
    });
    var tbodyEsp = document.getElementById("tabla-certificados-esp");
    if (!especializaciones.length) {
      tbodyEsp.innerHTML = '<tr><td colspan="5" class="text-sm text-mid">Todavía no hay certificaciones de especialización completadas.</td></tr>';
    } else {
      tbodyEsp.innerHTML = especializaciones.map(function (f) {
        var curso = window.CANTERA.getCatalogoFormaciones().filter(function (c) { return c.id === f.s.cursoId; })[0];
        return (
          '<tr><td data-label="Código de certificado"><strong>' + window.CANTERA.codigoCertificadoEspecializacion(f.alumno, f.s.cursoId) + "</strong></td>" +
          '<td data-label="Alumno">' + f.alumno.nombre + "</td>" +
          '<td data-label="Curso">' + (curso ? curso.nombre : f.s.cursoId) + "</td>" +
          '<td data-label="Nota">' + (f.s.nota !== null ? f.s.nota : "—") + "</td>" +
          '<td data-label="Fecha">' + window.CANTERA.formatFecha(f.s.fechaActualizacion) + "</td></tr>"
        );
      }).join("");
    }
  }

  function buildReporteImprimible() {
    var certificados = data.alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; }).length;
    var alertasAbiertas = data.incidencias.filter(function (i) { return i.estado === "abierta"; }).length;
    var ordenado = data.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var hoy = new Date();
    var fechaGeneracion = hoy.getDate() + "/" + (hoy.getMonth() + 1) + "/" + hoy.getFullYear();

    var rankingHTML = ordenado.map(function (eq) {
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return "<li>" + eq.nombre + " (" + eq.codigo + "): " + eq.calificacionActual + "/100 — " + cat.label + "</li>";
    }).join("");

    document.getElementById("reporte-imprimible").innerHTML =
      "<h1>Reporte administrativo — Cantera Construcción</h1>" +
      "<p>Generado: " + fechaGeneracion + " · Prototipo v1, Fase 1 (datos de ejemplo)</p>" +
      "<h3>Resumen general</h3>" +
      "<ul>" +
        "<li>Alumnos registrados: " + data.alumnos.length + "</li>" +
        "<li>Alumnos certificados: " + certificados + "</li>" +
        "<li>Equipos activos: " + data.equipos.length + "</li>" +
        "<li>Obras en ejecución: " + data.obras.length + "</li>" +
        "<li>Incidencias abiertas: " + alertasAbiertas + "</li>" +
      "</ul>" +
      "<h3>Ranking de equipos</h3>" +
      "<ul>" + rankingHTML + "</ul>" +
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
