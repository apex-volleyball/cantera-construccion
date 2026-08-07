/* =========================================================
   CANTERA CONSTRUCCIÓN — VISTA ALUMNO (alumno.html)
   Prototipo v1 — Fase 1
   Solo afecta esta página. Ediciones aquí no tocan jefe/admin/financiera.

   Índice:
   1. ARRANQUE Y PESTAÑAS
   2. PERFIL / ESTADO / RESUMEN
   3. RUTA FORMATIVA (acordeón de módulos + examen simulado)
   4. ADQUIRIR FORMACIONES (catálogo)
   5. EVALUACIÓN Y NOTAS (boletín)
   6. CERTIFICADOS (pantalla + versión imprimible / PDF)
   ========================================================= */

(function () {
  "use strict";

  var SELECTED_KEY = "cantera_ui_selected_alumno";
  var CRITERIOS_ALUMNO = [
    "Asistencia", "Prueba teórica", "Prueba práctica", "Uso de herramientas",
    "Seguridad", "Documentación digital", "Actitud", "Puntualidad", "Trabajo en equipo"
  ];
  var expandedModulos = {};

  /* 1. ARRANQUE Y PESTAÑAS ================================= */

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.CANTERA.loadData();
    populateSelector(data);
    bindTabs();

    var initialId = getSelectedId(data);
    document.getElementById("selector-alumno").value = initialId;
    render(initialId);

    document.getElementById("selector-alumno").addEventListener("change", function (e) {
      try { localStorage.setItem(SELECTED_KEY, e.target.value); } catch (err) { /* noop */ }
      expandedModulos = {};
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
    renderResumenStats(alumno);
    renderRutaFormativa(data, alumno);
    renderCatalogo(data, alumno);
    renderEvaluacion(alumno);
    renderCertificados(data, alumno);
  }

  /* 2. PERFIL / ESTADO / RESUMEN =========================== */

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

  function renderResumenStats(alumno) {
    var pct = window.CANTERA.progresoFormativoPct(alumno);
    var completados = alumno.progresoModulos.filter(function (p) { return p.estado === "completado"; }).length;
    var promedio = window.CANTERA.promedioNotas(alumno);
    var horas = window.CANTERA.horasCompletadas(alumno);
    var especializaciones = (alumno.solicitudesFormacion || []).filter(function (s) { return s.estado === "completada"; }).length;

    document.getElementById("resumen-stats").innerHTML =
      metricCard(completados + "/10", "Módulos completados") +
      metricCard(promedio !== null ? promedio : "—", "Nota promedio") +
      metricCard(horas + "h", "Horas de formación") +
      metricCard(especializaciones, "Especializaciones extra");
  }

  function metricCard(num, label) {
    return '<div class="metric-card"><div class="num">' + num + '</div><div class="label">' + label + "</div></div>";
  }

  /* 3. RUTA FORMATIVA ======================================= */

  function renderRutaFormativa(data, alumno) {
    var pct = window.CANTERA.progresoFormativoPct(alumno);
    document.getElementById("progreso-general-bar").querySelector("span").style.width = pct + "%";
    document.getElementById("progreso-general-pct").textContent = pct + "%";

    var lista = document.getElementById("lista-modulos");
    lista.innerHTML = "";

    window.CANTERA.MODULOS_FORMATIVOS.forEach(function (modulo, idx) {
      var progreso = alumno.progresoModulos.filter(function (p) { return p.moduloId === modulo.id; })[0];
      var estado = progreso ? progreso.estado : "pendiente";
      var nota = progreso ? progreso.nota : null;
      var prevCompletado = idx === 0 || alumno.progresoModulos[idx - 1].estado === "completado";

      var dot = estado === "completado" ? "✓" : String(modulo.orden);
      var block = document.createElement("div");
      block.className = "module-block" + (expandedModulos[modulo.id] ? " expanded" : "");

      var accionHTML = "";
      if (estado === "completado") {
        accionHTML = '<span class="badge badge-green">Completado</span>';
      } else if (estado === "en_curso") {
        accionHTML = '<button class="btn btn-secondary btn-sm" data-modulo="' + modulo.id + '" data-accion="examen">Presentar examen</button>';
      } else if (prevCompletado) {
        accionHTML = '<button class="btn btn-secondary btn-sm" data-modulo="' + modulo.id + '" data-accion="iniciar">Iniciar módulo</button>';
      } else {
        accionHTML = '<span class="text-sm text-mid">Bloqueado</span>';
      }

      var metaTexto = window.CANTERA.moduloEstadoLabel(estado) + " · " + modulo.tipo + " · " + modulo.horas + "h" +
        (nota !== null && nota !== undefined ? " · Nota: " + nota + "/100" : "");

      block.innerHTML =
        '<div class="module-item" data-toggle="' + modulo.id + '" style="cursor:pointer">' +
          '<div class="status-dot ' + estado + '">' + dot + "</div>" +
          '<div class="info"><h4>' + modulo.nombre + "</h4><p>" + metaTexto + "</p></div>" +
          '<div class="flex gap-8" style="align-items:center">' + accionHTML +
            '<span class="text-sm" style="color:var(--sky);white-space:nowrap">' + (expandedModulos[modulo.id] ? "Ocultar ▴" : "Ver contenido ▾") + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="module-detail">' + moduloDetalleHTML(modulo, estado, nota) + "</div>";

      lista.appendChild(block);
    });

    // Clic en la fila (fuera de los botones de acción) expande/colapsa el detalle
    lista.querySelectorAll("[data-toggle]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest("button")) return;
        var id = row.getAttribute("data-toggle");
        expandedModulos[id] = !expandedModulos[id];
        renderRutaFormativa(data, alumno);
      });
    });

    lista.querySelectorAll("button[data-accion]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var moduloId = btn.getAttribute("data-modulo");
        var accion = btn.getAttribute("data-accion");
        var entry = alumno.progresoModulos.filter(function (p) { return p.moduloId === moduloId; })[0];
        var modulo = window.CANTERA.MODULOS_FORMATIVOS.filter(function (m) { return m.id === moduloId; })[0];
        if (!entry || !modulo) return;

        if (accion === "iniciar") {
          entry.estado = "en_curso";
          expandedModulos[moduloId] = true;
        } else if (accion === "examen") {
          var notaObtenida = window.CANTERA.notaModulo ? window.CANTERA.notaModulo(alumno.id, moduloId) : 85;
          entry.nota = notaObtenida;
          if (notaObtenida >= modulo.examen.notaMinima) {
            entry.estado = "completado";
            entry.fecha = new Date().toISOString().slice(0, 10);
          }
          expandedModulos[moduloId] = true;
        }
        window.CANTERA.saveData(data);
        render(alumno.id);
      });
    });
  }

  function moduloDetalleHTML(modulo, estado, nota) {
    var contenidoHTML = modulo.contenido.map(function (c) {
      return (
        '<div class="content-item">' +
          '<span class="tag-tipo">' + tipoLabel(c.tipo) + "</span>" +
          "<span>" + c.titulo + "</span>" +
          '<span class="dur">' + formatDuracion(c.minutos) + "</span>" +
        "</div>"
      );
    }).join("");

    var examenEstadoHTML;
    if (estado === "completado") {
      examenEstadoHTML = '<p class="mb-0"><span class="badge badge-green">Aprobado</span> Nota obtenida: <strong>' + nota + "/100</strong></p>";
    } else if (estado === "en_curso") {
      examenEstadoHTML = '<p class="text-sm text-mid mb-0">Disponible cuando termines de revisar el contenido de este módulo. Usa el botón "Presentar examen" en la fila de arriba.</p>';
    } else {
      examenEstadoHTML = '<p class="text-sm text-mid mb-0">Se habilita al iniciar este módulo.</p>';
    }

    return (
      '<div class="text-sm text-mid" style="font-weight:700;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:8px">Contenido del módulo</div>' +
      contenidoHTML +
      '<div class="exam-box">' +
        '<div class="flex-between"><strong class="text-sm" style="color:var(--navy)">Examen final del módulo</strong>' +
        '<span class="text-sm text-mid">' + modulo.examen.preguntas + " preguntas · nota mínima " + modulo.examen.notaMinima + "</span></div>" +
        '<div class="mt-8">' + examenEstadoHTML + "</div>" +
      "</div>"
    );
  }

  function tipoLabel(tipo) {
    var map = { video: "Video", lectura: "Lectura", practica: "Práctica" };
    return map[tipo] || tipo;
  }

  function formatDuracion(min) {
    if (min >= 60) {
      var h = Math.floor(min / 60), m = min % 60;
      return h + "h" + (m ? " " + m + "min" : "");
    }
    return min + " min";
  }

  /* 4. ADQUIRIR FORMACIONES ================================= */

  function renderCatalogo(data, alumno) {
    var elegible = alumno.estadoCertificacion === "certificado";
    var aviso = document.getElementById("aviso-catalogo");
    aviso.innerHTML = elegible
      ? ""
      : '<div class="alert-item medium mt-8"><span>Termina tu certificación base en "Ruta formativa" para poder solicitar estas formaciones adicionales.</span></div>';

    var lista = document.getElementById("lista-catalogo");
    lista.innerHTML = window.CANTERA.getCatalogoFormaciones().map(function (curso) {
      var solicitud = window.CANTERA.getSolicitud(alumno, curso.id);
      var estado = solicitud ? solicitud.estado : null;
      var costoTexto = curso.costoQ === 0 ? "Cubierto por Cantera" : "Q" + curso.costoQ;
      var caratula = window.CANTERA_UI.caratulaHTML(curso.icono, curso.caratula);

      var footerHTML;
      if (!elegible) {
        footerHTML = '<span class="badge badge-gray">Bloqueado</span><button class="btn btn-secondary btn-sm" disabled style="opacity:0.5">Solicitar</button>';
      } else if (!solicitud) {
        footerHTML = '<span class="badge badge-sky">Disponible</span><button class="btn btn-primary btn-sm" data-curso="' + curso.id + '" data-accion="solicitar">Solicitar</button>';
      } else if (estado === "solicitada") {
        footerHTML = window.CANTERA_UI.badgeHTML("Solicitada", "yellow") + '<button class="btn btn-secondary btn-sm" data-curso="' + curso.id + '" data-accion="avanzar">Simular inicio (demo)</button>';
      } else if (estado === "en_curso") {
        footerHTML = window.CANTERA_UI.badgeHTML("En curso", "sky") + '<button class="btn btn-secondary btn-sm" data-curso="' + curso.id + '" data-accion="avanzar">Simular finalización (demo)</button>';
      } else {
        footerHTML = window.CANTERA_UI.badgeHTML("Completada · Nota " + solicitud.nota, "green") + '<span class="text-sm" style="color:var(--sky)">Ver en Certificados →</span>';
      }

      return (
        '<div class="course-card">' +
          caratula +
          '<div class="course-body">' +
            '<div class="course-head">' +
              "<div><h4>" + curso.nombre + '</h4><div class="course-meta">' + curso.categoria + "</div></div>" +
            "</div>" +
            '<p class="course-desc">' + curso.descripcion + "</p>" +
            '<p class="course-meta mb-0">' + curso.horas + "h · " + capitalize(curso.modalidad) + " · " + costoTexto + "</p>" +
            '<div class="course-footer">' + footerHTML + "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    lista.querySelectorAll("button[data-accion]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cursoId = btn.getAttribute("data-curso");
        var accion = btn.getAttribute("data-accion");
        if (accion === "solicitar") {
          window.CANTERA.solicitarFormacion(data, alumno.id, cursoId);
        } else if (accion === "avanzar") {
          window.CANTERA.avanzarSolicitud(data, alumno.id, cursoId);
        }
        render(alumno.id);
      });
    });
  }

  /* 5. EVALUACIÓN Y NOTAS =================================== */

  function renderEvaluacion(alumno) {
    var promedio = window.CANTERA.promedioNotas(alumno);
    var horas = window.CANTERA.horasCompletadas(alumno);
    var completados = alumno.progresoModulos.filter(function (p) { return p.estado === "completado"; }).length;

    document.getElementById("resumen-notas").innerHTML =
      metricCard(promedio !== null ? promedio : "—", "Promedio general") +
      metricCard(completados + "/10", "Módulos aprobados") +
      metricCard(horas + "h", "Horas acumuladas");

    var lista = document.getElementById("lista-notas-modulos");
    lista.innerHTML = window.CANTERA.MODULOS_FORMATIVOS.map(function (modulo) {
      var progreso = alumno.progresoModulos.filter(function (p) { return p.moduloId === modulo.id; })[0];
      var estado = progreso ? progreso.estado : "pendiente";
      var nota = progreso ? progreso.nota : null;
      var dot = estado === "completado" ? "✓" : String(modulo.orden);
      var notaHTML = (nota !== null && nota !== undefined)
        ? '<strong style="color:var(--navy);font-size:16px">' + nota + '</strong><span class="text-sm text-mid">/100</span>'
        : '<span class="text-sm text-mid">Pendiente</span>';
      return (
        '<div class="module-item">' +
          '<div class="status-dot ' + estado + '">' + dot + "</div>" +
          '<div class="info"><h4>' + modulo.nombre + "</h4><p>" + modulo.examen.preguntas + " preguntas · nota mínima " + modulo.examen.notaMinima + "</p></div>" +
          "<div>" + notaHTML + "</div>" +
        "</div>"
      );
    }).join("");

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

  /* 6. CERTIFICADOS ========================================= */

  function renderCertificados(data, alumno) {
    var principal = document.getElementById("certificado-principal");
    var promedio = window.CANTERA.promedioNotas(alumno);
    var horas = window.CANTERA.horasCompletadas(alumno);
    var codigo = window.CANTERA.codigoCertificado(alumno);
    var fecha = window.CANTERA.formatFecha(ultimaFechaCompletado(alumno));

    if (alumno.estadoCertificacion === "certificado") {
      principal.innerHTML =
        '<div class="card">' +
          certificateMarkup({
            kicker: "CANTERA CONSTRUCCIÓN",
            label: "Certificado de Formación en Construcción",
            nombre: alumno.nombre,
            cuerpo: "Ha completado satisfactoriamente el Programa de Formación en Construcción de Cantera Construcción, con un promedio de <strong>" + promedio + "/100</strong> en <strong>" + horas + " horas</strong> de formación teórico-práctica.",
            codigo: codigo,
            fecha: fecha
          }) +
          '<button class="btn btn-primary btn-block mt-16 no-print" id="btn-descargar-certificado">Descargar certificado (PDF)</button>' +
        "</div>";

      document.getElementById("btn-descargar-certificado").addEventListener("click", function () {
        document.getElementById("certificado-imprimible").innerHTML = certificateMarkup({
          kicker: "CANTERA CONSTRUCCIÓN",
          label: "Certificado de Formación en Construcción",
          nombre: alumno.nombre,
          cuerpo: "Ha completado satisfactoriamente el Programa de Formación en Construcción de Cantera Construcción, con un promedio de <strong>" + promedio + "/100</strong> en <strong>" + horas + " horas</strong> de formación teórico-práctica.",
          codigo: codigo,
          fecha: fecha
        });
        window.print();
      });
    } else {
      var pct = window.CANTERA.progresoFormativoPct(alumno);
      principal.innerHTML =
        '<div class="card text-center">' +
          '<div class="card-title" style="justify-content:center">Certificado aún no disponible</div>' +
          '<p class="text-sm text-mid">Termina los 10 módulos de tu ruta formativa y aprueba la evaluación práctica final para desbloquear tu certificado descargable avalado por Cantera Construcción.</p>' +
          '<div class="progress-row mt-8" style="max-width:320px;margin:8px auto 0"><div class="progress"><span style="width:' + pct + '%"></span></div><div class="pct">' + pct + "%</div></div>" +
        "</div>";
    }

    renderCertificadosEspecializacion(data, alumno);
  }

  function renderCertificadosEspecializacion(data, alumno) {
    var el = document.getElementById("certificados-especializacion");
    var completadas = (alumno.solicitudesFormacion || []).filter(function (s) { return s.estado === "completada"; });

    if (!completadas.length) {
      el.innerHTML = '<div class="card"><p class="text-sm text-mid mb-0">Aún no tienes especializaciones adicionales completadas. Ve a la pestaña "Adquirir formaciones" para solicitar una.</p></div>';
      return;
    }

    el.innerHTML = completadas.map(function (s) {
      var curso = window.CANTERA.getCatalogoFormaciones().filter(function (c) { return c.id === s.cursoId; })[0];
      if (!curso) return "";
      var codigoEsp = window.CANTERA.codigoCertificadoEspecializacion(alumno, curso.id);
      return (
        '<div class="card mt-16">' +
          '<div class="flex-between" style="align-items:center;flex-wrap:wrap;gap:10px">' +
            '<div><div class="card-title mb-0">Certificado de especialización: ' + curso.nombre + '</div>' +
            '<p class="text-sm text-mid mb-0">Nota: ' + s.nota + "/100 · " + curso.horas + "h · Código " + codigoEsp + "</p></div>" +
            '<button class="btn btn-secondary btn-sm no-print" data-descargar-esp="' + curso.id + '">Descargar PDF</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");

    el.querySelectorAll("button[data-descargar-esp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cursoId = btn.getAttribute("data-descargar-esp");
        var curso = window.CANTERA.getCatalogoFormaciones().filter(function (c) { return c.id === cursoId; })[0];
        var s = window.CANTERA.getSolicitud(alumno, cursoId);
        if (!curso || !s) return;
        document.getElementById("certificado-imprimible").innerHTML = certificateMarkup({
          kicker: "CANTERA CONSTRUCCIÓN",
          label: "Certificado de Especialización",
          nombre: alumno.nombre,
          cuerpo: "Ha completado satisfactoriamente la formación de especialización <strong>" + curso.nombre + "</strong>, con una nota de <strong>" + s.nota + "/100</strong> en <strong>" + curso.horas + " horas</strong>.",
          codigo: window.CANTERA.codigoCertificadoEspecializacion(alumno, curso.id),
          fecha: window.CANTERA.formatFecha(s.fechaActualizacion)
        });
        window.print();
      });
    });
  }

  function certificateMarkup(opts) {
    return (
      '<div class="certificate">' +
        '<div class="certificate-seal">' + window.CANTERA_UI.ICONS.shield + "</div>" +
        '<div class="certificate-kicker">' + opts.kicker + "</div>" +
        '<div class="certificate-label">' + opts.label + "</div>" +
        '<div class="certificate-name">' + opts.nombre + "</div>" +
        '<p class="certificate-body">' + opts.cuerpo + "</p>" +
        '<div class="certificate-meta-row">' +
          '<div><span class="label">Código de verificación</span><span class="value">' + opts.codigo + "</span></div>" +
          '<div><span class="label">Fecha de emisión</span><span class="value">' + opts.fecha + "</span></div>" +
        "</div>" +
        '<div class="certificate-sign">Cantera Construcción — Programa de Formación · Fase 1</div>' +
      "</div>"
    );
  }

  function ultimaFechaCompletado(alumno) {
    var fechas = alumno.progresoModulos.filter(function (p) { return p.fecha; }).map(function (p) { return p.fecha; });
    if (!fechas.length) return new Date().toISOString().slice(0, 10);
    return fechas.sort().slice(-1)[0];
  }

  function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
})();
