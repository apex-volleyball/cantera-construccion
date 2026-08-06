/* =========================================================
   CANTERA CONSTRUCCIÓN — ASISTENTE DE CHAT (alumno.html)
   Prototipo v1 — Fase 1
   Motor de reglas 100% local (sin conexión a internet, sin costo,
   sin límites de uso). Solo afecta esta página.

   Índice:
   1. BASE DE PREGUNTAS Y RESPUESTAS (procedimientos)
   2. MOTOR DE BÚSQUEDA (normalización + puntaje por palabras clave)
   3. RESUMEN DINÁMICO DE PENDIENTES (datos reales del alumno)
   4. INTERFAZ (construcción del widget, mensajes, eventos)
   ========================================================= */

(function () {
  "use strict";

  var SELECTED_KEY = "cantera_ui_selected_alumno";

  /* 1. BASE DE PREGUNTAS Y RESPUESTAS ======================= */
  /* Cada entrada tiene palabras clave (sin tildes, minúsculas) y
     una respuesta en HTML simple. Esto es 100% guionizado por
     Cantera — no genera texto nuevo, así que nunca inventa datos. */

  var FAQ = [
    {
      keywords: ["completar modulo", "avanzar modulo", "como completo", "terminar modulo", "aprobar modulo"],
      respuesta: "Para completar un módulo entra a la pestaña <strong>Ruta formativa</strong>, ábrelo y revisa su contenido. Cada módulo tiene un examen simulado con una nota mínima de 70 puntos para marcarse como completado."
    },
    {
      keywords: ["repruebo", "reprobar", "no paso el examen", "fallar examen", "suspendo"],
      respuesta: "Si no alcanzas la nota mínima, puedes volver a intentar el examen del módulo. No pierdes tu progreso en los módulos ya completados — solo necesitas alcanzar 70 puntos en el que quedó pendiente."
    },
    {
      keywords: ["solicitar formacion", "nueva formacion", "especializacion", "curso adicional", "catalogo"],
      respuesta: "En la pestaña <strong>Adquirir formaciones</strong> puedes ver el catálogo y solicitar el curso que te interese. Tu solicitud pasa por tres estados: Solicitada → En curso → Completada."
    },
    {
      keywords: ["cuanto cuesta", "costo", "precio", "pagar", "gratis"],
      respuesta: "Depende del curso: algunas formaciones del catálogo están cubiertas por Cantera (gratis) y otras tienen un costo asociado. El costo de cada una se muestra en su tarjeta dentro de <strong>Adquirir formaciones</strong>."
    },
    {
      keywords: ["nota", "calificacion", "promedio", "boletin"],
      respuesta: "Tu boletín de notas está en la pestaña <strong>Evaluación y notas</strong>. Ahí ves tu promedio y la nota de cada módulo completado. La nota mínima para aprobar un módulo es 70."
    },
    {
      keywords: ["certificado", "certificacion", "diploma"],
      respuesta: "Tu certificado se genera automáticamente al completar toda tu ruta formativa base, y lo puedes ver (o descargar en PDF) en la pestaña <strong>Certificados</strong>. Cada especialización del catálogo que completes también genera su propio certificado."
    },
    {
      keywords: ["equipo", "rol en equipo", "jefe de grupo", "asistente", "ayudante"],
      respuesta: "Los equipos se arman según tu potencial (jefe, asistente o ayudante) y tu nivel de certificación. Tu rol actual dentro de tu equipo aparece en la parte superior de tu perfil."
    },
    {
      keywords: ["calificacion del equipo", "ranking", "categoria a", "categoria b", "0 a 100", "puntaje del equipo"],
      respuesta: "La calificación del equipo (0 a 100) la evalúa tu jefe de grupo y el administrador según el avance real en obra, no algo que edites tú directamente. Puedes ver la calificación actual de tu equipo en la pestaña <strong>Resumen</strong>."
    },
    {
      keywords: ["contenido de la formacion", "video", "clase", "profesor", "instructor", "material del curso"],
      respuesta: "En este prototipo el contenido de cada módulo (videos, lecturas) está simulado con datos de ejemplo. Para dudas específicas sobre el contenido real de tu formación, lo mejor es preguntarle directamente a tu jefe de grupo."
    },
    {
      keywords: ["que es cantera", "de que se trata", "que es esto", "que hace cantera"],
      respuesta: "Cantera Construcción forma, certifica y da seguimiento a equipos de construcción, para que bancos, constructoras y propietarios puedan confiar en la ejecución de una obra con datos medibles, no solo referencias informales."
    },
    {
      keywords: ["cambiar de alumno", "otro perfil", "cambiar perfil", "selector"],
      respuesta: "Puedes ver otros perfiles de alumno con el selector \"Ver perfil de (demo)\" en la parte superior de la página."
    },
    {
      keywords: ["mis datos", "informacion segura", "privacidad", "donde se guarda"],
      respuesta: "En este prototipo todos los datos se guardan solo en este navegador (localStorage) — no hay servidor ni base de datos real todavía."
    },
    {
      keywords: ["hola", "buenas", "que tal", "buenos dias", "buenas tardes"],
      respuesta: "¡Hola de nuevo! ¿En qué te puedo ayudar sobre tu formación o el funcionamiento de la plataforma?"
    },
    {
      keywords: ["gracias", "muchas gracias", "te lo agradezco"],
      respuesta: "¡De nada! Aquí estoy si necesitas algo más."
    },
    {
      keywords: ["adios", "chao", "hasta luego", "nos vemos"],
      respuesta: "¡Hasta pronto! Sigue avanzando en tu ruta formativa."
    }
  ];

  var FALLBACK =
    "No tengo información sobre eso todavía 🤔. Pregúntale a tu jefe de grupo o al equipo de Cantera. " +
    "Puedo ayudarte con dudas sobre: módulos y ruta formativa, exámenes y notas, el catálogo de formaciones, " +
    "certificados, tu equipo, o cómo funciona esta demo.";

  /* 2. MOTOR DE BÚSQUEDA ==================================== */

  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
  }

  function buscarRespuesta(textoUsuario) {
    var input = normalizar(textoUsuario);
    var mejorEntrada = null;
    var mejorPuntaje = 0;
    FAQ.forEach(function (entrada) {
      var puntaje = 0;
      entrada.keywords.forEach(function (kw) {
        if (input.indexOf(normalizar(kw)) !== -1) puntaje += kw.length;
      });
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorEntrada = entrada;
      }
    });
    return mejorEntrada ? mejorEntrada.respuesta : FALLBACK;
  }

  /* 3. RESUMEN DINÁMICO DE PENDIENTES ======================= */
  /* Todo esto sale de datos reales del alumno — nunca inventado. */

  function construirPendientes(alumno) {
    var lineas = [];
    var modulos = window.CANTERA.MODULOS_FORMATIVOS;
    var siguiente = null;

    alumno.progresoModulos.some(function (p) {
      if (p.estado !== "completado") {
        siguiente = p;
        return true;
      }
      return false;
    });

    if (siguiente) {
      var modulo = modulos.filter(function (m) { return m.id === siguiente.moduloId; })[0];
      if (modulo) {
        var estadoTexto = siguiente.estado === "en_curso" ? "en curso" : "pendiente de iniciar";
        lineas.push(
          "Tienes el módulo <strong>" + modulo.nombre + "</strong> (" + modulo.horas + "h) " + estadoTexto + "."
        );
      }
    } else {
      lineas.push("Completaste toda tu ruta formativa base. 🎉");
    }

    (alumno.solicitudesFormacion || []).forEach(function (s) {
      var curso = window.CANTERA.CATALOGO_FORMACIONES.filter(function (c) { return c.id === s.cursoId; })[0];
      if (!curso) return;
      if (s.estado === "solicitada") {
        lineas.push("Tu solicitud de <strong>" + curso.nombre + "</strong> está pendiente de iniciar.");
      } else if (s.estado === "en_curso") {
        lineas.push("Estás cursando <strong>" + curso.nombre + "</strong>, ¡sigue así!");
      }
    });

    if (!alumno.equipoId) {
      lineas.push("Aún no perteneces a un equipo asignado — Cantera está evaluando tu asignación.");
    }

    if (alumno.estadoCertificacion === "necesita_refuerzo") {
      lineas.push("Tu evaluación indica que necesitas reforzar algunos criterios. Habla con tu jefe de grupo.");
    }

    if (lineas.length === 0) {
      lineas.push("No tienes pendientes por ahora. ¡Vas muy bien!");
    }

    return lineas;
  }

  /* 4. INTERFAZ ============================================== */

  var mensajes = [];
  var alumnoActualId = null;
  var elBody, elPanel, elLauncher, elBadge, elInput;

  document.addEventListener("DOMContentLoaded", function () {
    var contenedor = document.getElementById("chat-asistente-widget");
    if (!contenedor) return;

    contenedor.innerHTML =
      '<button class="chat-launcher no-print" id="chat-launcher" type="button" title="Asistente de Cantera">' +
        '<span class="chat-launcher-icon">' + (window.CANTERA_UI.ICONS.chat || "💬") + "</span>" +
        '<span class="chat-launcher-badge" id="chat-launcher-badge">1</span>' +
      "</button>" +
      '<div class="chat-panel no-print" id="chat-panel" hidden>' +
        '<div class="chat-panel-header">' +
          '<div><div class="chat-panel-title">Asistente Cantera</div><div class="chat-panel-sub">Guía de procedimientos</div></div>' +
          '<button class="chat-panel-close" id="chat-panel-close" type="button" aria-label="Cerrar">✕</button>' +
        "</div>" +
        '<div class="chat-panel-body" id="chat-panel-body"></div>' +
        '<form class="chat-panel-input-row" id="chat-panel-form">' +
          '<input type="text" id="chat-panel-input" placeholder="Escribe tu pregunta..." autocomplete="off">' +
          '<button type="submit">Enviar</button>' +
        "</form>" +
      "</div>";

    elLauncher = document.getElementById("chat-launcher");
    elBadge = document.getElementById("chat-launcher-badge");
    elPanel = document.getElementById("chat-panel");
    elBody = document.getElementById("chat-panel-body");
    elInput = document.getElementById("chat-panel-input");

    elLauncher.addEventListener("click", function () {
      var abierto = !elPanel.hasAttribute("hidden");
      if (abierto) {
        elPanel.setAttribute("hidden", "");
        return;
      }
      elPanel.removeAttribute("hidden");
      elBadge.style.display = "none";
      prepararConversacion();
      elInput.focus();
    });

    document.getElementById("chat-panel-close").addEventListener("click", function () {
      elPanel.setAttribute("hidden", "");
    });

    document.getElementById("chat-panel-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var texto = elInput.value.trim();
      if (!texto) return;
      agregarMensaje("user", escapeHtml(texto));
      elInput.value = "";
      renderMensajes();
      setTimeout(function () {
        agregarMensaje("bot", buscarRespuesta(texto));
        renderMensajes();
      }, 350);
    });

    /* Si el presentador cambia de alumno en el selector de la demo,
       reiniciamos la conversación para reflejar al alumno correcto. */
    document.addEventListener("change", function (e) {
      if (e.target && e.target.id === "selector-alumno") {
        alumnoActualId = null;
        if (!elPanel.hasAttribute("hidden")) prepararConversacion();
      }
    });
  });

  function getAlumnoActual(data) {
    var stored = null;
    try { stored = localStorage.getItem(SELECTED_KEY); } catch (e) { stored = null; }
    var alumno = stored ? window.CANTERA.getAlumno(data, stored) : null;
    return alumno || window.CANTERA.getAlumnoDestacado(data);
  }

  function prepararConversacion() {
    var data = window.CANTERA.loadData();
    var alumno = getAlumnoActual(data);
    if (!alumno || alumno.id === alumnoActualId) {
      renderMensajes();
      return;
    }
    alumnoActualId = alumno.id;
    mensajes = [];
    var primerNombre = alumno.nombre.split(" ")[0];
    agregarMensaje("bot", "¡Hola, " + primerNombre + "! 👋 Soy el asistente de Cantera Construcción.");
    var pendientes = construirPendientes(alumno);
    agregarMensaje("bot", "Esto es lo que tienes hoy:<ul class=\"chat-pendientes\">" +
      pendientes.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>");
    agregarMensaje("bot", "Puedes preguntarme sobre módulos, exámenes, notas, el catálogo de formaciones, certificados, tu equipo o cómo funciona esta demo.");
    renderMensajes();
  }

  function agregarMensaje(from, html) {
    mensajes.push({ from: from, html: html });
  }

  function renderMensajes() {
    elBody.innerHTML = mensajes.map(function (m) {
      return '<div class="chat-msg chat-msg-' + m.from + '">' + m.html + "</div>";
    }).join("");
    elBody.scrollTop = elBody.scrollHeight;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
