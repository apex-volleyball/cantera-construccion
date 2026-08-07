(function () {
  "use strict";
  var SELECTED_KEY = "cantera_ui_selected_tutor";
  var buzonFiltroActual = "todo";
  var seguimientoAbierto = {};

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CANTERA.loadData();
    populateSelector(data);
    bindTabs();

    document.getElementById("form-nueva-tarea").addEventListener("submit", function (e) {
      e.preventDefault();
      var freshData = window.CANTERA.loadData();
      var tutorId = getSelectedId(freshData);
      var texto = document.getElementById("input-nueva-tarea").value.trim();
      var alumnoId = document.getElementById("select-tarea-alumno").value || null;
      var fecha = document.getElementById("input-tarea-fecha").value || null;
      if (!texto) return;
      window.CANTERA.crearTareaTutor(freshData, tutorId, alumnoId, texto, fecha);
      document.getElementById("input-nueva-tarea").value = "";
      document.getElementById("input-tarea-fecha").value = "";
      var t = window.CANTERA.getTutor(freshData, tutorId);
      renderTareas(freshData, t);
      actualizarBadgeHerramientas(freshData, t);
    });

    var initialId = getSelectedId(data);
    document.getElementById("selector-tutor").value = initialId;
    render(initialId);

    document.getElementById("selector-tutor").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) {}
      buzonFiltroActual = "todo";
      render(e.target.value);
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

  function getSelectedId(data) {
    var stored = null;
    try { stored = localStorage.getItem(SELECTED_KEY); } catch (e) { stored = null; }
    if (stored && window.CANTERA.getTutor(data, stored)) return stored;
    return data.tutores[0].id;
  }

  function populateSelector(data) {
    var select = document.getElementById("selector-tutor");
    select.innerHTML = data.tutores.map(function (t) {
      var n = window.CANTERA.getAlumnosDeTutor(data, t.id).length;
      return '<option value="' + t.id + '">' + t.nombre + " — " + t.especialidad + " (" + n + " alumnos)</option>";
    }).join("");
  }

  function render(tutorId) {
    var data = window.CANTERA.loadData();
    var tutor = window.CANTERA.getTutor(data, tutorId);
    if (!tutor) return;

    renderPerfil(data, tutor);
    renderResumen(data, tutor);
    renderAlumnos(data, tutor);
    renderHerramientas(data, tutor);
    renderBuzonFiltros(data, tutor);
    renderBuzon(data, tutor);
  }

  function renderPerfil(data, tutor) {
    var alumnos = window.CANTERA.getAlumnosDeTutor(data, tutor.id);
    var iniciales = window.CANTERA_UI.initialsFromName(tutor.nombre);
    var pct = Math.min(100, Math.round((alumnos.length / tutor.capacidadMaxima) * 100));
    document.getElementById("tutor-perfil-card").innerHTML =
      '<div class="tutor-card mt-16">' +
        '<div class="avatar">' + iniciales + "</div>" +
        '<div class="tutor-card-info">' +
          "<h3>" + tutor.nombre + "</h3>" +
          '<div class="tutor-card-especialidad">' + tutor.especialidad + "</div>" +
          '<p class="tutor-card-bio">' + tutor.bio + "</p>" +
          '<div class="capacidad-meter">' +
            "<span>" + alumnos.length + "/" + tutor.capacidadMaxima + " alumnos asignados</span>" +
            '<div class="progress"><span style="width:' + pct + '%"></span></div>' +
          "</div>" +
        "</div>" +
      "</div>";
  }

  function renderResumen(data, tutor) {
    var alumnos = window.CANTERA.getAlumnosDeTutor(data, tutor.id);
    var dudas = window.CANTERA.getDudasPendientesTutor(data, tutor.id);
    var certificados = alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; }).length;

    document.getElementById("tutor-resumen-stats").innerHTML =
      metricCard(alumnos.length, "Alumnos asignados") +
      metricCard(dudas.length, "Dudas pendientes") +
      metricCard(certificados, "Certificados");

    var notifEl = document.getElementById("tutor-notificaciones");
    var notifs = window.CANTERA.getNotificacionesTutor(data, tutor.id);
    var dirMsgs = window.CANTERA.getMensajesDirectivos(data, tutor.id);
    var items = [];
    notifs.forEach(function (n) {
      items.push('<div class="alert-item ' + (n.clase === "yellow" ? "medium" : "low") + '"><span>' + n.texto + "</span></div>");
    });
    dirMsgs.forEach(function (m) {
      items.push('<div class="alert-item medium"><span><strong>' + m.de + ":</strong> " + m.asunto + "</span></div>");
    });
    notifEl.innerHTML = items.length ? items.join("") : '<p class="text-sm text-mid mb-0">No tienes notificaciones nuevas.</p>';
  }

  function metricCard(num, label) {
    return '<div class="metric-card"><div class="num">' + num + '</div><div class="label">' + label + "</div></div>";
  }

  function renderAlumnos(data, tutor) {
    var alumnos = window.CANTERA.getAlumnosDeTutor(data, tutor.id);
    var el = document.getElementById("tutor-lista-alumnos");
    if (!alumnos.length) {
      el.innerHTML = '<div class="card"><p class="text-sm text-mid mb-0">Aún no tienes alumnos asignados.</p></div>';
      return;
    }
    el.innerHTML = alumnos.map(function (al) {
      var pct = window.CANTERA.progresoFormativoPct(al);
      var cert = window.CANTERA.certificacionBadge(al.estadoCertificacion);
      var equipo = al.equipoId ? window.CANTERA.getEquipo(data, al.equipoId) : null;
      var obra = equipo && equipo.obraId ? window.CANTERA.getObra(data, equipo.obraId) : null;
      var promedio = window.CANTERA.promedioNotas(al);
      var iniciales = window.CANTERA_UI.initialsFromName(al.nombre);
      return (
        '<div class="alumno-tutor-card" data-alumno-card="' + al.id + '">' +
          '<div class="alumno-tutor-card-head">' +
            '<div class="avatar sm">' + iniciales + "</div>" +
            '<div style="flex:1"><h4>' + al.nombre + '</h4><p class="text-sm text-mid mb-0">' + al.municipio + (equipo ? " · " + equipo.nombre + " (" + window.CANTERA.rolEquipoLabel(al.rolEnEquipo) + ")" : " · Sin equipo asignado") + "</p></div>" +
            window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) +
          "</div>" +
          (obra ? '<p class="text-sm text-mid mb-4">Obra: ' + obra.ubicacion + " — " + obra.etapaActual + " (" + obra.porcentajeAvance + "% de avance)</p>" : "") +
          window.CANTERA_UI.progressRowHTML(pct, pct === 100 ? "green" : "") +
          '<p class="text-sm text-mid mt-8 mb-0">Nota promedio: ' + (promedio !== null ? promedio : "—") + ' · <a href="#" data-ver-buzon="' + al.id + '">Ver dudas pendientes →</a></p>' +
          '<button type="button" class="btn-seguimiento-toggle" data-toggle-seguimiento="' + al.id + '">' + (seguimientoAbierto[al.id] ? "Ocultar seguimiento ↑" : "Ver seguimiento →") + "</button>" +
          (seguimientoAbierto[al.id] ? renderSeguimientoPanelHTML(data, al) : "") +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("[data-ver-buzon]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var buzonBtn = document.querySelector('.tab-btn[data-tab="tab-buzon"]');
        if (buzonBtn) buzonBtn.click();
        buzonFiltroActual = "dudas";
        var freshData = window.CANTERA.loadData();
        renderBuzonFiltros(freshData, tutor);
        renderBuzon(freshData, tutor);
      });
    });

    el.querySelectorAll("[data-toggle-seguimiento]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-toggle-seguimiento");
        seguimientoAbierto[id] = !seguimientoAbierto[id];
        renderAlumnos(window.CANTERA.loadData(), tutor);
      });
    });

    el.querySelectorAll("[data-seguimiento-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var alumnoId = form.getAttribute("data-seguimiento-form");
        var tipo = form.querySelector('select[name="tipo"]').value;
        var nota = form.querySelector('input[name="nota"]').value.trim();
        if (!nota) return;
        var freshData = window.CANTERA.loadData();
        window.CANTERA.agregarSeguimiento(freshData, tutor.id, alumnoId, nota, tipo);
        seguimientoAbierto[alumnoId] = true;
        renderAlumnos(freshData, tutor);
        renderHerramientas(freshData, window.CANTERA.getTutor(freshData, tutor.id));
      });
    });
  }

  function renderBuzonFiltros(data, tutor) {
    var el = document.getElementById("buzon-filtros");
    var opciones = [
      { key: "todo", label: "Todo" },
      { key: "dudas", label: "Dudas de alumnos" },
      { key: "directivos", label: "Directivos" },
      { key: "notificaciones", label: "Notificaciones" }
    ];
    el.innerHTML = opciones.map(function (o) {
      return '<button type="button" class="buzon-filtro-btn' + (o.key === buzonFiltroActual ? " active" : "") + '" data-filtro="' + o.key + '">' + o.label + "</button>";
    }).join("");
    el.querySelectorAll("[data-filtro]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        buzonFiltroActual = btn.getAttribute("data-filtro");
        var freshData = window.CANTERA.loadData();
        renderBuzonFiltros(freshData, tutor);
        renderBuzon(freshData, tutor);
      });
    });
  }

  function renderBuzon(data, tutor) {
    var el = document.getElementById("tutor-buzon-lista");
    var partes = [];

    if (buzonFiltroActual === "todo" || buzonFiltroActual === "dudas") {
      var dudas = window.CANTERA.getDudasPendientesTutor(data, tutor.id);
      dudas.forEach(function (d) {
        partes.push(dudaItemHTML(d.alumno, d.ultimoMensaje));
      });
    }
    if (buzonFiltroActual === "todo" || buzonFiltroActual === "directivos") {
      var dirMsgs = window.CANTERA.getMensajesDirectivos(data, tutor.id);
      dirMsgs.forEach(function (m) {
        partes.push(
          '<div class="buzon-item' + (m.leido ? "" : " no-leido") + '">' +
            '<div class="buzon-item-head"><span class="buzon-item-titulo">' + m.asunto + '</span><span class="buzon-item-meta">' + m.de + " · " + window.CANTERA.formatFecha(m.fecha) + "</span></div>" +
            '<p class="buzon-item-cuerpo">' + m.texto + "</p>" +
          "</div>"
        );
      });
    }
    if (buzonFiltroActual === "todo" || buzonFiltroActual === "notificaciones") {
      var notifs = window.CANTERA.getNotificacionesTutor(data, tutor.id);
      notifs.forEach(function (n) {
        partes.push(
          '<div class="buzon-item">' +
            '<div class="buzon-item-head"><span class="buzon-item-titulo">Notificación</span></div>' +
            '<p class="buzon-item-cuerpo mb-0">' + n.texto + "</p>" +
          "</div>"
        );
      });
    }

    el.innerHTML = partes.length ? partes.join("") : '<p class="buzon-empty">No hay elementos en este filtro.</p>';

    el.querySelectorAll("form[data-responder]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var alumnoId = form.getAttribute("data-responder");
        var textarea = form.querySelector("textarea");
        var texto = textarea.value.trim();
        if (!texto) return;
        var freshData = window.CANTERA.loadData();
        window.CANTERA.enviarMensajeTutoria(freshData, alumnoId, tutor.id, "tutor", texto);
        window.CANTERA.marcarHiloLeido(freshData, alumnoId, "tutor");
        render(tutor.id);
      });
    });

    updateTutorBadge(data, tutor);
  }

  function dudaItemHTML(alumno, ultimoMensaje) {
    return (
      '<div class="buzon-item no-leido">' +
        '<div class="buzon-item-head">' +
          '<span class="buzon-item-titulo">' + alumno.nombre + "</span>" +
          '<span class="buzon-item-meta">' + window.CANTERA.formatFecha(ultimoMensaje.fecha) + "</span>" +
        "</div>" +
        '<p class="buzon-item-cuerpo">' + ultimoMensaje.texto + "</p>" +
        '<form class="buzon-reply-box" data-responder="' + alumno.id + '">' +
          '<textarea placeholder="Responder a ' + alumno.nombre.split(" ")[0] + '..." required></textarea>' +
          '<button type="submit" class="btn btn-primary btn-sm">Responder</button>' +
        "</form>" +
      "</div>"
    );
  }

  function renderSeguimientoPanelHTML(data, alumno) {
    var timeline = window.CANTERA.getSeguimientosDeAlumno(data, alumno.id);
    var lista = timeline.length
      ? '<ul class="seguimiento-timeline">' + timeline.map(function (s) {
          return '<li class="seguimiento-item"><div class="fecha">' + s.fecha + " · " + (s.tipo.charAt(0).toUpperCase() + s.tipo.slice(1)) + '</div><p class="nota">' + s.nota + "</p></li>";
        }).join("") + "</ul>"
      : '<p class="seguimiento-empty">Todavía no hay seguimiento registrado para este alumno.</p>';
    return (
      '<div class="seguimiento-panel">' +
        lista +
        '<form class="seguimiento-form" data-seguimiento-form="' + alumno.id + '">' +
          '<select name="tipo"><option value="llamada">Llamada</option><option value="visita">Visita</option><option value="nota">Nota</option></select>' +
          '<input type="text" name="nota" placeholder="Agregar nota de seguimiento..." required maxlength="200">' +
          '<button type="submit" class="btn btn-secondary btn-sm">Guardar</button>' +
        "</form>" +
      "</div>"
    );
  }

  function renderHerramientas(data, tutor) {
    renderPrioridades(data, tutor);
    renderTareas(data, tutor);
    populateSelectTareaAlumno(data, tutor);
    actualizarBadgeHerramientas(data, tutor);
  }

  function renderPrioridades(data, tutor) {
    var lista = window.CANTERA.getAlumnosPrioridad(data, tutor.id);
    var el = document.getElementById("tutor-prioridades");
    if (!lista.length) {
      el.innerHTML = '<p class="prioridad-empty">Todo al día. Ningún alumno requiere atención urgente en este momento.</p>';
      return;
    }
    el.innerHTML = lista.map(function (r) {
      var nivel = r.prioridad >= 2 ? "" : "nivel-medio";
      return (
        '<div class="prioridad-card ' + nivel + '">' +
          '<div class="prioridad-card-head"><h4>' + r.alumno.nombre + "</h4>" +
          '<button type="button" class="btn-seguimiento-toggle" data-ver-alumno="' + r.alumno.id + '" style="margin-top:0">Ver en Mis alumnos →</button></div>' +
          '<div class="prioridad-razones">' + r.razones.map(function (rz) { return '<span class="razon-tag">' + rz + "</span>"; }).join("") + "</div>" +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("[data-ver-alumno]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var alumnosBtn = document.querySelector('.tab-btn[data-tab="tab-alumnos"]');
        if (alumnosBtn) alumnosBtn.click();
        var alumnoId = btn.getAttribute("data-ver-alumno");
        setTimeout(function () {
          var card = document.querySelector('[data-alumno-card="' + alumnoId + '"]');
          if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      });
    });
  }

  function renderTareas(data, tutor) {
    var tareas = window.CANTERA.getTareasTutor(data, tutor.id).slice().sort(function (a, b) {
      if (a.hecha !== b.hecha) return a.hecha ? 1 : -1;
      return (a.fechaLimite || "9999-99-99") < (b.fechaLimite || "9999-99-99") ? -1 : 1;
    });
    var el = document.getElementById("tutor-tareas-lista");
    if (!tareas.length) {
      el.innerHTML = '<p class="prioridad-empty">No tienes tareas pendientes.</p>';
      return;
    }
    el.innerHTML = '<ul class="tareas-lista">' + tareas.map(function (t) {
      var al = t.alumnoId ? window.CANTERA.getAlumno(data, t.alumnoId) : null;
      var meta = (al ? al.nombre : "General") + (t.fechaLimite ? " · Vence " + t.fechaLimite : "");
      return (
        '<li class="tarea-item' + (t.hecha ? " hecha" : "") + '">' +
          '<input type="checkbox" data-tarea-id="' + t.id + '"' + (t.hecha ? " checked" : "") + ">" +
          '<div><div class="tarea-texto">' + t.texto + '</div><div class="tarea-meta">' + meta + "</div></div>" +
        "</li>"
      );
    }).join("") + "</ul>";

    el.querySelectorAll("[data-tarea-id]").forEach(function (chk) {
      chk.addEventListener("change", function () {
        var freshData = window.CANTERA.loadData();
        window.CANTERA.marcarTareaTutor(freshData, chk.getAttribute("data-tarea-id"), chk.checked);
        var t = window.CANTERA.getTutor(freshData, tutor.id);
        renderTareas(freshData, t);
        actualizarBadgeHerramientas(freshData, t);
      });
    });
  }

  function populateSelectTareaAlumno(data, tutor) {
    var select = document.getElementById("select-tarea-alumno");
    var alumnos = window.CANTERA.getAlumnosDeTutor(data, tutor.id);
    select.innerHTML = '<option value="">General (sin alumno)</option>' + alumnos.map(function (a) {
      return '<option value="' + a.id + '">' + a.nombre + "</option>";
    }).join("");
  }

  function actualizarBadgeHerramientas(data, tutor) {
    var badge = document.getElementById("tutor-herramientas-badge");
    if (!badge) return;
    var prioridades = window.CANTERA.getAlumnosPrioridad(data, tutor.id).length;
    var tareasPendientes = window.CANTERA.getTareasTutor(data, tutor.id).filter(function (t) { return !t.hecha; }).length;
    var total = prioridades + tareasPendientes;
    badge.innerHTML = total > 0 ? '<span class="nav-badge">' + (total > 9 ? "9+" : total) + "</span>" : "";
  }

  function updateTutorBadge(data, tutor) {
    var badge = document.getElementById("tutor-buzon-badge");
    if (!badge) return;
    var count = window.CANTERA.getDudasPendientesTutor(data, tutor.id).length;
    badge.innerHTML = count > 0 ? '<span class="nav-badge">' + (count > 9 ? "9+" : count) + "</span>" : "";
  }
})();
