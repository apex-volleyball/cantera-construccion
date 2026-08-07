(function () {
  "use strict";
  var SELECTED_KEY = "cantera_ui_selected_tutor";
  var buzonFiltroActual = "todo";

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CANTERA.loadData();
    populateSelector(data);
    bindTabs();

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
        '<div class="alumno-tutor-card">' +
          '<div class="alumno-tutor-card-head">' +
            '<div class="avatar sm">' + iniciales + "</div>" +
            '<div style="flex:1"><h4>' + al.nombre + '</h4><p class="text-sm text-mid mb-0">' + al.municipio + (equipo ? " · " + equipo.nombre + " (" + window.CANTERA.rolEquipoLabel(al.rolEnEquipo) + ")" : " · Sin equipo asignado") + "</p></div>" +
            window.CANTERA_UI.badgeHTML(cert.texto, cert.clase) +
          "</div>" +
          (obra ? '<p class="text-sm text-mid mb-4">Obra: ' + obra.ubicacion + " — " + obra.etapaActual + " (" + obra.porcentajeAvance + "% de avance)</p>" : "") +
          window.CANTERA_UI.progressRowHTML(pct, pct === 100 ? "green" : "") +
          '<p class="text-sm text-mid mt-8 mb-0">Nota promedio: ' + (promedio !== null ? promedio : "—") + ' · <a href="#" data-ver-buzon="' + al.id + '">Ver dudas pendientes →</a></p>' +
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

  function updateTutorBadge(data, tutor) {
    var badge = document.getElementById("tutor-buzon-badge");
    if (!badge) return;
    var count = window.CANTERA.getDudasPendientesTutor(data, tutor.id).length;
    badge.innerHTML = count > 0 ? '<span class="nav-badge">' + (count > 9 ? "9+" : count) + "</span>" : "";
  }
})();
