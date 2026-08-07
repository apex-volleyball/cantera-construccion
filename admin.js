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
    renderMapa();
    renderAsignacionProyectos();

    document.getElementById("buscador-alumnos").addEventListener("input", function (e) {
      renderTablaAlumnos(e.target.value.toLowerCase());
    });

    document.getElementById("btn-descargar-reporte").addEventListener("click", function () {
      buildReporteImprimible();
      window.print();
    });

    document.getElementById("input-nombre-equipo").addEventListener("input", actualizarBotonCrearEquipo);

    document.getElementById("btn-crear-equipo").addEventListener("click", function () {
      var nombre = document.getElementById("input-nombre-equipo").value.trim();
      if (!nombre || equipoRoster.jefe.length !== 1) return;
      var integrantes = [];
      ROLES_EQUIPO_ADMIN.forEach(function (r) {
        equipoRoster[r.valor].forEach(function (id) {
          integrantes.push({ alumnoId: id, rol: r.valor });
        });
      });
      window.CANTERA.crearEquipo(data, nombre, integrantes);
      equipoRoster = { jefe: [], asistente: [], ayudante: [] };
      document.getElementById("input-nombre-equipo").value = "";
      renderAsignacionProyectos();
      actualizarBotonCrearEquipo();
    });

    document.getElementById("btn-asignar-obra").addEventListener("click", function () {
      if (!asignacionSeleccion.obraId || !asignacionSeleccion.equipoId) return;
      window.CANTERA.asignarObraAEquipo(data, asignacionSeleccion.obraId, asignacionSeleccion.equipoId);
      asignacionSeleccion = { obraId: null, equipoId: null };
      renderAsignacionProyectos();
      renderTablaEquipos();
      renderTablaObras();
      renderMetricas();
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
    var ordenado = data.equipos.filter(function (eq) { return eq.calificacionActual != null; }).sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var items = ordenado.map(function (eq) {
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return { label: eq.codigo, value: eq.calificacionActual, max: 100, clase: cat.clase === "sky" ? "" : cat.clase };
    });
    document.getElementById("comparativa-equipos").innerHTML =
      '<p class="text-sm text-mid" style="margin-bottom:4px">Calificación actual (0–100) de cada equipo certificado.</p>' +
      window.CANTERA_UI.barChartHTML(items);
  }

  function renderRanking() {
    var ordenado = data.equipos.filter(function (eq) { return eq.calificacionActual != null; }).sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
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
        '<td data-label="Categoría">' + window.CANTERA_UI.badgeHTML(cat.label + (eq.calificacionActual != null ? " · " + eq.calificacionActual : ""), cat.clase) + "</td>" +
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


  function renderMapa() {
    var conteo = window.CANTERA.getConteoPorDepartamento(data);
    var valores = Object.keys(conteo).map(function (k) { return conteo[k]; });
    var maxCount = valores.length ? Math.max.apply(null, valores) : 0;

    document.querySelectorAll(".gt-dep").forEach(function (path) {
      var count = conteo[path.id] || 0;
      path.classList.remove("nivel-1", "nivel-2", "nivel-3", "nivel-4", "nivel-5", "sin-datos");
      if (count === 0) {
        path.classList.add("sin-datos");
      } else {
        path.classList.add("nivel-" + nivelDeConteo(count, maxCount));
      }
    });

    bindMapaEventos(conteo);
    renderPanelVacio();
  }

  function nivelDeConteo(count, max) {
    if (max <= 1) return count > 0 ? 3 : 0;
    var pct = count / max;
    if (pct <= 0.2) return 1;
    if (pct <= 0.45) return 2;
    if (pct <= 0.7) return 3;
    if (pct <= 0.9) return 4;
    return 5;
  }

  function bindMapaEventos(conteo) {
    var tooltip = document.getElementById("mapa-tooltip");
    document.querySelectorAll(".gt-dep").forEach(function (path) {
      path.addEventListener("mouseenter", function () {
        var nombre = path.getAttribute("data-dep");
        var count = conteo[path.id] || 0;
        tooltip.innerHTML = "<strong>" + nombre + "</strong><span>" + count + (count === 1 ? " persona" : " personas") + "</span>";
        tooltip.classList.add("visible");
      });
      path.addEventListener("mousemove", function (e) {
        tooltip.style.left = (e.clientX + 16) + "px";
        tooltip.style.top = (e.clientY + 16) + "px";
      });
      path.addEventListener("mouseleave", function () {
        tooltip.classList.remove("visible");
      });
      path.addEventListener("click", function () {
        document.querySelectorAll(".gt-dep").forEach(function (p) { p.classList.remove("is-selected"); });
        path.classList.add("is-selected");
        renderPanelDepartamento(path.id, path.getAttribute("data-dep"));
      });
    });
  }

  function renderPanelVacio() {
    document.getElementById("mapa-panel").innerHTML =
      '<div class="mapa-panel-empty">' +
        window.CANTERA_UI.ICONS.mapPin +
        "<p>Selecciona una región del mapa para ver las personas de Cantera registradas ahí.</p>" +
      "</div>";
  }

  function renderPanelDepartamento(depId, nombre) {
    var personas = window.CANTERA.getPersonasPorDepartamento(data, depId);
    var panel = document.getElementById("mapa-panel");
    if (!personas.length) {
      panel.innerHTML =
        '<div class="mapa-panel-header"><h3>' + nombre + '</h3><div class="mapa-panel-count">Sin personas registradas todavía</div></div>' +
        '<div class="mapa-panel-empty">' + window.CANTERA_UI.ICONS.mapPin + "<p>Cantera todavía no tiene alumnos activos en " + nombre + ". Este departamento está listo para su próxima expansión.</p></div>";
      return;
    }
    panel.innerHTML =
      '<div class="mapa-panel-header"><h3>' + nombre + '</h3><div class="mapa-panel-count">' + personas.length + (personas.length === 1 ? " persona registrada" : " personas registradas") + "</div></div>" +
      '<div class="mapa-panel-list">' +
        personas.map(function (p) {
          var iniciales = window.CANTERA_UI.initialsFromName(p.nombre);
          var cert = window.CANTERA.certificacionBadge(p.estadoCertificacion);
          return (
            '<div class="mapa-persona-card">' +
              '<div class="avatar sm">' + iniciales + "</div>" +
              '<div class="info">' +
                "<h4>" + p.nombre + "</h4>" +
                "<p>" + p.municipio + " · " + (p.rolDeseado || "sin rol definido") + "</p>" +
              "</div>" +
              window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) +
            "</div>"
          );
        }).join("") +
      "</div>";
  }

  /* ===========================================================================
     9. ASIGNACIÓN DE PROYECTOS
     =========================================================================== */

  var ROLES_EQUIPO_ADMIN = [
    { valor: "jefe", etiqueta: "Jefe de grupo", max: 1 },
    { valor: "asistente", etiqueta: "Asistente", max: 2 },
    { valor: "ayudante", etiqueta: "Ayudante", max: 3 }
  ];

  var equipoRoster = { jefe: [], asistente: [], ayudante: [] };
  var asignacionSeleccion = { obraId: null, equipoId: null };
  var obraSeleccionadaId = null;
  var ESTADO_OBRA_LABEL = { planificada: "Planificada", en_curso: "En marcha", finalizada: "Finalizada" };

  function escapeHtmlAsig(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatQ(n) {
    return Number(n || 0).toLocaleString("es-GT");
  }

  function idsEnRoster() {
    return equipoRoster.jefe.concat(equipoRoster.asistente, equipoRoster.ayudante);
  }

  function renderAsignacionProyectos() {
    renderDisponiblesStrip();
    renderRolesGrid();
    renderEquiposGrid();
    renderAsignacionListas();
    renderMapaObras();
    actualizarBotonCrearEquipo();
  }

  function renderDisponiblesStrip() {
    var cont = document.getElementById("disponibles-strip");
    var enRoster = idsEnRoster();
    var disponibles = window.CANTERA.getAlumnosSinEquipo(data).filter(function (a) {
      return enRoster.indexOf(a.id) === -1;
    });
    if (!disponibles.length) {
      cont.innerHTML = '<p class="disponibles-empty">No hay alumnos sin equipo disponibles en este momento.</p>';
      return;
    }
    cont.innerHTML = disponibles.map(function (a) {
      var iniciales = window.CANTERA_UI.initialsFromName(a.nombre);
      var botones = ROLES_EQUIPO_ADMIN.map(function (r) {
        var lleno = equipoRoster[r.valor].length >= r.max;
        return '<button type="button" data-alumno="' + a.id + '" data-rol="' + r.valor + '"' + (lleno ? " disabled" : "") + ' title="Sumar como ' + r.etiqueta + '">' + r.etiqueta.split(" ")[0] + "</button>";
      }).join("");
      return (
        '<div class="persona-chip">' +
          '<div class="avatar xs">' + iniciales + "</div>" +
          '<div><div class="nombre">' + escapeHtmlAsig(a.nombre) + '</div><div class="muni">' + escapeHtmlAsig(a.municipio) + "</div></div>" +
          '<div class="persona-chip-roles">' + botones + "</div>" +
        "</div>"
      );
    }).join("");

    cont.querySelectorAll("button[data-alumno]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        agregarAlRoster(btn.getAttribute("data-alumno"), btn.getAttribute("data-rol"));
      });
    });
  }

  function agregarAlRoster(alumnoId, rol) {
    var r = ROLES_EQUIPO_ADMIN.filter(function (x) { return x.valor === rol; })[0];
    if (!r) return;
    if (equipoRoster[rol].length >= r.max) return;
    equipoRoster[rol].push(alumnoId);
    renderDisponiblesStrip();
    renderRolesGrid();
    actualizarBotonCrearEquipo();
  }

  function quitarDelRoster(alumnoId, rol) {
    equipoRoster[rol] = equipoRoster[rol].filter(function (id) { return id !== alumnoId; });
    renderDisponiblesStrip();
    renderRolesGrid();
    actualizarBotonCrearEquipo();
  }

  function renderRolesGrid() {
    var cont = document.getElementById("roles-grid");
    cont.innerHTML = ROLES_EQUIPO_ADMIN.map(function (r) {
      var ids = equipoRoster[r.valor];
      var pills = ids.length
        ? ids.map(function (id) {
            var al = window.CANTERA.getAlumno(data, id);
            var nombre = al ? al.nombre : id;
            return (
              '<div class="integrante-pill"><span>' + escapeHtmlAsig(nombre) + "</span>" +
              '<button type="button" data-quitar="' + id + '" data-rol="' + r.valor + '" aria-label="Quitar">&times;</button></div>'
            );
          }).join("")
        : '<p class="rol-grupo-empty">Sin asignar</p>';
      return (
        '<div class="rol-grupo">' +
          '<div class="rol-grupo-header"><h5>' + r.etiqueta + '</h5><span class="rol-grupo-count">' + ids.length + " / " + r.max + "</span></div>" +
          pills +
        "</div>"
      );
    }).join("");

    cont.querySelectorAll("button[data-quitar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        quitarDelRoster(btn.getAttribute("data-quitar"), btn.getAttribute("data-rol"));
      });
    });
  }

  function actualizarBotonCrearEquipo() {
    var nombre = document.getElementById("input-nombre-equipo").value.trim();
    var btn = document.getElementById("btn-crear-equipo");
    btn.disabled = !(nombre.length > 0 && equipoRoster.jefe.length === 1);
  }

  function renderEquiposGrid() {
    var cont = document.getElementById("equipos-grid");
    if (!data.equipos.length) {
      cont.innerHTML = '<p class="disponibles-empty">Todavía no hay equipos formados.</p>';
      return;
    }
    cont.innerHTML = data.equipos.map(function (eq) {
      var obra = window.CANTERA.getObra(data, eq.obraId);
      var miembros = eq.integrantes.map(function (it) {
        var al = window.CANTERA.getAlumno(data, it.alumnoId);
        return '<li><span>' + (al ? escapeHtmlAsig(al.nombre) : it.alumnoId) + '</span><span class="rol-tag">' + window.CANTERA.rolEquipoLabel(it.rol) + "</span></li>";
      }).join("");
      var obraHtml = obra
        ? '<div class="equipo-card-obra">' + obra.codigo + " · " + obra.ubicacion + "</div>"
        : '<div class="equipo-card-sin-obra">Sin obra asignada — disponible</div>';
      var dispClase = eq.disponibilidad === "disponible" ? "green" : "yellow";
      return (
        '<div class="equipo-card">' +
          '<div class="equipo-card-head"><div><h4>' + escapeHtmlAsig(eq.nombre) + '</h4><div class="codigo">' + eq.codigo + " · " + eq.ubicacion + "</div></div>" +
          window.CANTERA_UI.badgeHTML(capitalize(eq.disponibilidad), dispClase) +
          "</div>" +
          '<ul class="equipo-card-miembros">' + miembros + "</ul>" +
          obraHtml +
        "</div>"
      );
    }).join("");
  }

  function renderAsignacionListas() {
    var obrasCol = document.getElementById("lista-obras-planificadas");
    var equiposCol = document.getElementById("lista-equipos-disponibles");

    var planificadas = window.CANTERA.getObrasPorEstado(data, "planificada");
    var disponibles = window.CANTERA.getEquiposDisponibles(data);

    if (asignacionSeleccion.obraId && !planificadas.some(function (o) { return o.id === asignacionSeleccion.obraId; })) {
      asignacionSeleccion.obraId = null;
    }
    if (asignacionSeleccion.equipoId && !disponibles.some(function (e) { return e.id === asignacionSeleccion.equipoId; })) {
      asignacionSeleccion.equipoId = null;
    }

    obrasCol.innerHTML = planificadas.length
      ? planificadas.map(function (o) {
          var sel = o.id === asignacionSeleccion.obraId;
          return (
            '<div class="pick-card' + (sel ? " selected" : "") + '" data-obra="' + o.id + '">' +
              "<h5>" + o.codigo + " · " + o.ubicacion + "</h5>" +
              "<p>" + o.tipoVivienda + " — Q " + formatQ(o.montoTotalFinanciadoQ) + "</p>" +
            "</div>"
          );
        }).join("")
      : '<p class="pick-empty">No hay obras planificadas esperando equipo.</p>';

    equiposCol.innerHTML = disponibles.length
      ? disponibles.map(function (e) {
          var sel = e.id === asignacionSeleccion.equipoId;
          return (
            '<div class="pick-card' + (sel ? " selected" : "") + '" data-equipo="' + e.id + '">' +
              "<h5>" + escapeHtmlAsig(e.nombre) + " · " + e.codigo + "</h5>" +
              "<p>" + e.integrantes.length + " integrantes — " + e.ubicacion + "</p>" +
            "</div>"
          );
        }).join("")
      : '<p class="pick-empty">No hay equipos disponibles en este momento.</p>';

    obrasCol.querySelectorAll("[data-obra]").forEach(function (card) {
      card.addEventListener("click", function () {
        asignacionSeleccion.obraId = card.getAttribute("data-obra");
        renderAsignacionListas();
      });
    });
    equiposCol.querySelectorAll("[data-equipo]").forEach(function (card) {
      card.addEventListener("click", function () {
        asignacionSeleccion.equipoId = card.getAttribute("data-equipo");
        renderAsignacionListas();
      });
    });

    document.getElementById("btn-asignar-obra").disabled = !(asignacionSeleccion.obraId && asignacionSeleccion.equipoId);
  }

  function renderMapaObras() {
    var g = document.getElementById("obra-markers");
    var items = window.CANTERA.getMapaObras(data);

    if (obraSeleccionadaId && !items.some(function (it) { return it.obra.id === obraSeleccionadaId; })) {
      obraSeleccionadaId = null;
    }

    g.innerHTML = items.map(function (it) {
      var o = it.obra;
      var sel = o.id === obraSeleccionadaId ? " is-selected" : "";
      return '<circle class="obra-marker obra-marker-' + o.estado + sel + '" data-obra="' + o.id + '" cx="' + o.mapaX + '" cy="' + o.mapaY + '" r="7"></circle>';
    }).join("");

    g.querySelectorAll("[data-obra]").forEach(function (marker) {
      marker.addEventListener("click", function () {
        obraSeleccionadaId = marker.getAttribute("data-obra");
        renderMapaObras();
      });
    });

    if (obraSeleccionadaId) {
      renderPanelObra(obraSeleccionadaId);
    } else {
      renderPanelObrasVacio();
    }
  }

  function renderPanelObrasVacio() {
    document.getElementById("mapa-obras-panel").innerHTML =
      '<div class="mapa-panel-empty">' +
        window.CANTERA_UI.ICONS.mapPin +
        "<p>Selecciona una obra en el mapa para ver su detalle: equipo asignado, avance y fecha estimada de entrega.</p>" +
      "</div>";
  }

  function renderPanelObra(obraId) {
    var obra = window.CANTERA.getObra(data, obraId);
    if (!obra) { renderPanelObrasVacio(); return; }
    var equipo = window.CANTERA.getEquipo(data, obra.equipoId);
    var panel = document.getElementById("mapa-obras-panel");
    panel.innerHTML =
      '<div class="mapa-panel-header"><h3>' + obra.codigo + '</h3><div class="mapa-panel-count">' + obra.ubicacion + "</div></div>" +
      '<div class="obra-detail-row"><span class="label">Estado</span><span class="value">' + (ESTADO_OBRA_LABEL[obra.estado] || obra.estado) + "</span></div>" +
      '<div class="obra-detail-row"><span class="label">Propietario</span><span class="value">' + escapeHtmlAsig(obra.propietario) + "</span></div>" +
      '<div class="obra-detail-row"><span class="label">Equipo asignado</span><span class="value">' + (equipo ? escapeHtmlAsig(equipo.nombre) : "Sin equipo asignado") + "</span></div>" +
      '<div class="obra-detail-row"><span class="label">Etapa actual</span><span class="value">' + obra.etapaActual + "</span></div>" +
      '<div class="obra-detail-row"><span class="label">Avance</span><span class="value">' + obra.porcentajeAvance + "%</span></div>" +
      '<div class="obra-detail-row"><span class="label">Entrega estimada</span><span class="value">' + (obra.fechaEstimadaEntrega || "Por definir") + "</span></div>" +
      '<div class="obra-detail-row"><span class="label">Monto financiado</span><span class="value">Q ' + formatQ(obra.montoTotalFinanciadoQ) + "</span></div>";
  }

})();
