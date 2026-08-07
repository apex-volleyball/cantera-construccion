/* =========================================================
   CANTERA CONSTRUCCIÓN — LÓGICA DE LA LANDING (index.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. No toca alumno/jefe/admin/financiera.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  var data = window.CANTERA.loadData();

  var featuredEquipo = window.CANTERA.getEquipoDestacado(data);
  var featuredObra = window.CANTERA.getObra(data, featuredEquipo.obraId);
  var featuredAlumno = window.CANTERA.getAlumnoDestacado(data);

  /* --- Estado del prototipo (stat strip) --- */
  setText("stat-alumnos", data.alumnos.length);
  setText("stat-equipos", data.equipos.length);
  setText("stat-obras", data.obras.length);
  setText("stat-avance", featuredObra.porcentajeAvance + "%");

  /* --- Caso destacado --- */
  var avatarEl = document.getElementById("caso-avatar");
  if (avatarEl) avatarEl.textContent = window.CANTERA_UI.initialsFromName(featuredAlumno.nombre);
  setText("caso-nombre", featuredAlumno.nombre);
  var primerNombre = featuredAlumno.nombre.split(" ")[0];
  var cat = window.CANTERA.scoreCategoria(featuredEquipo.calificacionActual);
  setText(
    "caso-desc",
    primerNombre + " se certificó como jefe de grupo y hoy lidera " + featuredEquipo.nombre +
      ", a cargo de la obra " + featuredObra.codigo + " (" + featuredObra.etapaActual + ", " +
      featuredObra.porcentajeAvance + "% de avance). Su equipo tiene una calificación de " +
      featuredEquipo.calificacionActual + "/100 — categoría " + cat.letra + ", " + cat.desc.toLowerCase() + "."
  );

  /* --- Vistas previas de la plataforma (Nosotros / Plataforma) --- */
  renderPreviewAlumno(featuredAlumno);
  renderPreviewJefe(data, featuredEquipo, featuredObra);
  renderPreviewAdmin(data);
  renderPreviewFinanciera(data, featuredObra);
  renderPreviewRRHH(data);

  /* --- Criterios de éxito del piloto --- */
  var successList = document.getElementById("success-list");
  if (successList) {
    successList.innerHTML = window.CANTERA.CRITERIOS_EXITO_PILOTO.map(function (criterio) {
      return '<li><span class="check">' + window.CANTERA_UI.ICONS.check + "</span>" + criterio + "</li>";
    }).join("");
  }

  /* --- Tabs de valor por audiencia --- */
  var tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  /* --- Formulario de piloto (Google Forms + Google Sheets) ---
     El formulario visible es 100% nuestro (mismo diseño y responsive
     de siempre). Al enviarlo, mandamos los datos al endpoint público
     de un Google Form ya creado (campos equivalentes), cuyas respuestas
     caen automáticamente en una Google Sheet. Google no responde con
     CORS en este endpoint, así que el POST va en modo "no-cors": no
     podemos leer la respuesta real, por eso mostramos la confirmación
     visual de forma optimista (igual que se hacía antes con Netlify
     Forms). Si el sitio corre sin conexión a internet, el intento de
     red fallará silenciosamente pero la confirmación visual igual se
     muestra, para no romper la demo. */
  var GOOGLE_FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLSddGSjsMJbS_zSI6QUeRmHK74xYCn1Z44QIhtM8b2lvOCPziw/formResponse";
  var GOOGLE_FORM_ENTRIES = {
    nombre: "entry.1490169742",
    organizacion: "entry.490968387",
    correo: "entry.11496410",
    tipo: "entry.1499002860",
    mensaje: "entry.839266757"
  };

  var form = document.getElementById("piloto-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      try {
        var formData = new FormData(form);
        // Honeypot: si este campo oculto viene lleno, es un bot.
        // Mostramos éxito igual (para no delatar el filtro) pero no enviamos nada.
        if (formData.get("bot-field")) {
          showFormSuccess();
          return;
        }
        var body = new URLSearchParams();
        Object.keys(GOOGLE_FORM_ENTRIES).forEach(function (fieldName) {
          body.append(GOOGLE_FORM_ENTRIES[fieldName], formData.get(fieldName) || "");
        });
        fetch(GOOGLE_FORM_ACTION, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString()
        })
          .then(showFormSuccess)
          .catch(showFormSuccess);
      } catch (err) {
        showFormSuccess();
      }
    });
  }

  function showFormSuccess() {
    form.style.display = "none";
    var success = document.getElementById("piloto-success");
    if (success) success.style.display = "block";
  }

  function renderPreviewAlumno(alumno) {
    var el = document.getElementById("prev-alumno");
    if (!el || !alumno) return;
    var horas = window.CANTERA.horasCompletadas(alumno);
    var nota = window.CANTERA.promedioNotas(alumno);
    el.innerHTML =
      '<div class="avatar sm" style="margin-bottom:10px">' + window.CANTERA_UI.initialsFromName(alumno.nombre) + "</div>" +
      '<div style="font-weight:700;color:var(--navy);font-size:14px;text-align:center;margin-bottom:10px">' + alumno.nombre + "</div>" +
      '<div class="mini-kpi-row">' +
        '<div class="mini-kpi"><div class="num">' + horas + 'h</div><div class="label">Formación</div></div>' +
        '<div class="mini-kpi"><div class="num">' + (nota !== null ? nota : "—") + '</div><div class="label">Nota promedio</div></div>' +
      "</div>";
  }

  function renderPreviewJefe(dataObj, equipo, obra) {
    var el = document.getElementById("prev-jefe");
    if (!el || !equipo || !obra) return;
    var incidencias = window.CANTERA.getIncidenciasPorObra(dataObj, obra.id);
    var abiertas = incidencias.filter(function (i) { return i.estado === "abierta"; }).length;
    var badge = abiertas > 0
      ? window.CANTERA_UI.badgeHTML(abiertas + " incidencia" + (abiertas > 1 ? "s" : "") + " abierta" + (abiertas > 1 ? "s" : ""), "yellow")
      : window.CANTERA_UI.badgeHTML("Sin incidencias abiertas", "green");
    el.innerHTML =
      window.CANTERA_UI.scoreRingHTML(equipo.calificacionActual, { small: true }) +
      '<div style="font-weight:700;color:var(--navy);font-size:14px;text-align:center">' + equipo.nombre + "</div>" +
      badge;
  }

  function renderPreviewAdmin(dataObj) {
    var el = document.getElementById("prev-admin");
    if (!el) return;
    var ordenado = dataObj.equipos.slice().sort(function (a, b) { return b.calificacionActual - a.calificacionActual; });
    var items = ordenado.map(function (eq) {
      var cat = window.CANTERA.scoreCategoria(eq.calificacionActual);
      return { label: eq.codigo, value: eq.calificacionActual, max: 100, clase: cat.clase === "sky" ? "" : cat.clase };
    });
    el.innerHTML = window.CANTERA_UI.barChartHTML(items);
  }

  function renderPreviewFinanciera(dataObj, obra) {
    var el = document.getElementById("prev-financiera");
    if (!el || !obra) return;
    var entradas = window.CANTERA.getBitacoraPorObra(dataObj, obra.id).slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    var points = entradas.map(function (b) {
      return { x: window.CANTERA.formatFecha(b.fecha), y: b.porcentajeAvanceReportado };
    });
    var liberado = window.CANTERA.montoLiberado(obra);
    el.innerHTML =
      '<div class="mini-kpi-row" style="margin-bottom:10px">' +
        '<div class="mini-kpi"><div class="num">' + window.CANTERA.formatQ(liberado) + '</div><div class="label">Liberado en ' + obra.codigo + '</div></div>' +
      "</div>" +
      window.CANTERA_UI.lineChartHTML(points);
  }

  function renderPreviewRRHH(dataObj) {
    var el = document.getElementById("prev-rrhh");
    if (!el) return;
    var resumen = window.CANTERA.getResumenCuentasBanRural(dataObj);
    var total = dataObj.alumnos.length || 1;
    var pctAbiertas = Math.round((resumen.abierta / total) * 100);
    var embudo = window.CANTERA.getEmbudoAdmision(dataObj);
    var etapas = [
      { label: "Diagnosticado", count: embudo.diagnosticado || 0 },
      { label: "En formación", count: embudo.en_formacion || 0 },
      { label: "Certificado", count: embudo.certificado || 0 }
    ];
    el.innerHTML =
      '<div class="mini-kpi-row" style="margin-bottom:10px">' +
        '<div class="mini-kpi"><div class="num">' + resumen.abierta + '</div><div class="label">Cuentas BanRural abiertas (' + pctAbiertas + '%)</div></div>' +
      "</div>" +
      '<div class="embudo-admision">' +
      etapas.map(function (e) {
        var pct = Math.round((e.count / total) * 100);
        return (
          '<div class="embudo-etapa">' +
            '<div class="embudo-etapa-label">' + e.label + "</div>" +
            '<div class="embudo-etapa-bar"><span style="width:' + pct + '%"></span></div>' +
            '<div class="embudo-etapa-count">' + e.count + "</div>" +
          "</div>"
        );
      }).join("") +
      "</div>";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
});
