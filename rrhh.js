/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA RECURSOS HUMANOS (rrhh.html)
   Prototipo v1 — Fase 1
   Admisión, apertura de cuentas BanRural y expedientes de
   los alumnos. Solo afecta esta página.
   ========================================================= */

(function () {
  "use strict";

  var data;

  var ETAPA_ADMISION_INFO = {
    diagnosticado: { label: "Diagnosticado", clase: "gray" },
    en_formacion: { label: "En formación", clase: "sky" },
    formacion_completa: { label: "Formación completa", clase: "yellow" },
    certificado: { label: "Certificado", clase: "green" }
  };
  var ETAPA_ADMISION_ORDEN = ["diagnosticado", "en_formacion", "formacion_completa", "certificado"];

  document.addEventListener("DOMContentLoaded", function () {
    data = window.CANTERA.loadData();

    bindTabs();
    renderKPIs();
    renderEmbudo("rrhh-embudo");
    renderEmbudo("rrhh-embudo-detalle");
    renderEquiposResumen();
    renderAdmisionLista();
    renderCuentasLista();
    renderExpedientesLista();
    updateCuentasBadge();
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

  function avatarHTML(nombre) {
    return '<div class="avatar sm">' + window.CANTERA_UI.initialsFromName(nombre) + "</div>";
  }

  function tutorEquipoLineHTML(alumno) {
    var partes = [];
    partes.push(alumno.municipio);
    var tutor = window.CANTERA.getTutorDeAlumno(data, alumno.id);
    if (tutor) partes.push("Tutor: " + tutor.nombre);
    if (alumno.equipoId) {
      var equipo = window.CANTERA.getEquipo(data, alumno.equipoId);
      if (equipo) {
        var obra = equipo.obraId ? window.CANTERA.getObra(data, equipo.obraId) : null;
        partes.push(equipo.nombre + (obra ? " · " + obra.ubicacion : ""));
      }
    } else {
      partes.push("Sin equipo asignado");
    }
    return partes.join(" · ");
  }

  function renderKPIs() {
    var total = data.alumnos.length;
    var resumenCuentas = window.CANTERA.getResumenCuentasBanRural(data);
    var pctAbiertas = total ? Math.round((resumenCuentas.abierta / total) * 100) : 0;
    var expedientesCompletos = data.alumnos.filter(function (a) {
      return window.CANTERA.getPorcentajeExpediente(a) === 100;
    }).length;
    var certificados = data.alumnos.filter(function (a) { return a.estadoCertificacion === "certificado"; }).length;

    var cards = [
      { num: total, label: "Alumnos en el programa" },
      { num: resumenCuentas.abierta, label: "Cuentas BanRural abiertas", sub: pctAbiertas + "% del total" },
      { num: expedientesCompletos, label: "Expedientes completos" },
      { num: certificados, label: "Alumnos certificados" }
    ];
    document.getElementById("rrhh-kpis").innerHTML = cards.map(function (c) {
      return '<div class="metric-card"><div class="num">' + c.num + '</div><div class="label">' + c.label + "</div>" +
        (c.sub ? '<div class="sub">' + c.sub + "</div>" : "") + "</div>";
    }).join("");
  }

  function renderEmbudo(elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var embudo = window.CANTERA.getEmbudoAdmision(data);
    var total = data.alumnos.length || 1;
    el.innerHTML = ETAPA_ADMISION_ORDEN.map(function (key) {
      var info = ETAPA_ADMISION_INFO[key];
      var count = embudo[key] || 0;
      var pct = Math.round((count / total) * 100);
      return (
        '<div class="embudo-etapa">' +
          '<div class="embudo-etapa-label">' + info.label + "</div>" +
          '<div class="embudo-etapa-bar"><span style="width:' + pct + '%"></span></div>' +
          '<div class="embudo-etapa-count">' + count + "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderEquiposResumen() {
    var el = document.getElementById("rrhh-equipos-resumen");
    if (!data.equipos.length) {
      el.innerHTML = '<p class="prioridad-empty">Todavía no hay equipos formados.</p>';
      return;
    }
    el.innerHTML = data.equipos.map(function (eq) {
      var obra = eq.obraId ? window.CANTERA.getObra(data, eq.obraId) : null;
      return (
        '<div class="rrhh-table-row">' +
          '<div class="info"><h4>' + eq.nombre + " · " + eq.codigo + "</h4>" +
          "<p>" + eq.integrantes.length + " integrantes" + (obra ? " · " + obra.ubicacion + " · Etapa: " + obra.etapaActual : " · Sin obra asignada") + "</p></div>" +
        "</div>"
      );
    }).join("");
  }

  function renderAdmisionLista() {
    var el = document.getElementById("rrhh-admision-lista");
    var grupos = {};
    ETAPA_ADMISION_ORDEN.forEach(function (k) { grupos[k] = []; });
    data.alumnos.forEach(function (a) { grupos[window.CANTERA.getEtapaAdmision(a)].push(a); });

    el.innerHTML = ETAPA_ADMISION_ORDEN.map(function (key) {
      var info = ETAPA_ADMISION_INFO[key];
      var lista = grupos[key];
      if (!lista.length) return "";
      return (
        '<div class="mt-16">' +
          '<p style="font-weight:700;color:var(--navy);font-size:13px;margin-bottom:6px">' + info.label + " (" + lista.length + ")</p>" +
          lista.map(function (a) {
            return (
              '<div class="rrhh-table-row">' +
                avatarHTML(a.nombre) +
                '<div class="info"><h4>' + a.nombre + "</h4><p>" + tutorEquipoLineHTML(a) + "</p></div>" +
                window.CANTERA_UI.badgeHTML(info.label, info.clase) +
              "</div>"
            );
          }).join("") +
        "</div>"
      );
    }).join("");
  }

  function renderCuentasLista() {
    var el = document.getElementById("rrhh-cuentas-lista");
    var alumnos = data.alumnos.slice().sort(function (a, b) {
      var ea = a.cuentaBanRural ? a.cuentaBanRural.estado : "pendiente";
      var eb = b.cuentaBanRural ? b.cuentaBanRural.estado : "pendiente";
      var orden = { pendiente: 0, en_proceso: 1, abierta: 2 };
      return orden[ea] - orden[eb];
    });
    el.innerHTML = alumnos.map(function (a) {
      var cuenta = a.cuentaBanRural || { estado: "pendiente" };
      var detalle = cuenta.estado === "abierta"
        ? ("Cuenta " + cuenta.numeroCuenta + "<br>Abierta " + window.CANTERA.formatFecha(cuenta.fechaApertura))
        : "Sin cuenta abierta";
      return (
        '<div class="rrhh-table-row">' +
          avatarHTML(a.nombre) +
          '<div class="info"><h4>' + a.nombre + "</h4><p>" + tutorEquipoLineHTML(a) + "</p></div>" +
          '<select data-cuenta-alumno="' + a.id + '">' +
            '<option value="pendiente"' + (cuenta.estado === "pendiente" ? " selected" : "") + ">Pendiente</option>" +
            '<option value="en_proceso"' + (cuenta.estado === "en_proceso" ? " selected" : "") + ">En proceso</option>" +
            '<option value="abierta"' + (cuenta.estado === "abierta" ? " selected" : "") + ">Abierta</option>" +
          "</select>" +
          '<div class="rrhh-cuenta-detalle">' + detalle + "</div>" +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("[data-cuenta-alumno]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        window.CANTERA.actualizarEstadoCuentaBanRural(data, sel.getAttribute("data-cuenta-alumno"), sel.value);
        data = window.CANTERA.loadData();
        renderKPIs();
        renderCuentasLista();
        updateCuentasBadge();
      });
    });
  }

  function renderExpedientesLista() {
    var el = document.getElementById("rrhh-expedientes-lista");
    var campos = [
      { key: "dpi", label: "DPI" },
      { key: "fotografia", label: "Fotografía" },
      { key: "comprobanteDomicilio", label: "Domicilio" },
      { key: "cartaAntecedentes", label: "Antecedentes" }
    ];
    el.innerHTML = data.alumnos.map(function (a) {
      var doc = a.documentos || {};
      var pct = window.CANTERA.getPorcentajeExpediente(a);
      return (
        '<div class="rrhh-table-row">' +
          avatarHTML(a.nombre) +
          '<div class="info"><h4>' + a.nombre + "</h4><p>" + a.municipio + "</p></div>" +
          '<div class="expediente-checklist">' +
            campos.map(function (c) {
              return '<label><input type="checkbox" data-doc-alumno="' + a.id + '" data-doc-campo="' + c.key + '"' + (doc[c.key] ? " checked" : "") + ">" + c.label + "</label>";
            }).join("") +
          "</div>" +
          '<div class="expediente-pct ' + (pct === 100 ? "completo" : "incompleto") + '">' + pct + "%</div>" +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("[data-doc-alumno]").forEach(function (chk) {
      chk.addEventListener("change", function () {
        window.CANTERA.actualizarDocumentoAlumno(data, chk.getAttribute("data-doc-alumno"), chk.getAttribute("data-doc-campo"), chk.checked);
        data = window.CANTERA.loadData();
        renderKPIs();
        renderExpedientesLista();
      });
    });
  }

  function updateCuentasBadge() {
    var badge = document.getElementById("rrhh-cuentas-badge");
    if (!badge) return;
    var resumen = window.CANTERA.getResumenCuentasBanRural(data);
    var pendientes = resumen.pendiente + resumen.en_proceso;
    badge.innerHTML = pendientes > 0 ? '<span class="nav-badge">' + (pendientes > 9 ? "9+" : pendientes) + "</span>" : "";
  }
})();
