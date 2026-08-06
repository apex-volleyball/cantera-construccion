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

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
});
