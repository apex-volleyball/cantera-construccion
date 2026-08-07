/* =========================================================
   CANTERA CONSTRUCCIÓN — DATOS SEMILLA Y CAPA DE PERSISTENCIA
   Prototipo v1 — Fase 1
   Todo el estado del demo vive en localStorage bajo una sola
   llave (CANTERA_STORAGE_KEY). Este archivo se carga PRIMERO
   en cada página (script normal, sin type="module", para que
   funcione también abriendo el HTML directo desde el disco).

   Índice (busca estos anclas al editar):
   1. CONSTANTES DE REFERENCIA (módulos, etapas)
   2. DATOS SEMILLA (alumnos, equipos, obras, bitácora, incidencias)
   3. PERSISTENCIA (load / save / reset)
   4. HELPERS DE CONSULTA (getters por id)
   5. HELPERS DE PRESENTACIÓN (badges, formato, cálculos)
   ========================================================= */

window.CANTERA = window.CANTERA || {};

(function () {
  "use strict";

  var STORAGE_KEY = "cantera_construccion_demo_v1";

  /* 1. CONSTANTES DE REFERENCIA ========================== */

  var MODULOS_FORMATIVOS = [
    { id: "m1", orden: 1, nombre: "Inducción a Cantera Construcción", tipo: "teórico", horas: 2,
      contenido: [
        { tipo: "video", titulo: "Bienvenida y modelo Cantera", minutos: 12 },
        { tipo: "lectura", titulo: "Cómo funciona la certificación por equipos", minutos: 10 }
      ],
      examen: { preguntas: 8, notaMinima: 70 } },
    { id: "m2", orden: 2, nombre: "Seguridad básica en obra", tipo: "teórico", horas: 4,
      contenido: [
        { tipo: "video", titulo: "Equipo de protección personal", minutos: 15 },
        { tipo: "video", titulo: "Riesgos comunes en obra gris", minutos: 18 },
        { tipo: "lectura", titulo: "Protocolo ante accidentes", minutos: 8 }
      ],
      examen: { preguntas: 12, notaMinima: 70 } },
    { id: "m3", orden: 3, nombre: "Buenas prácticas de construcción", tipo: "teórico", horas: 4,
      contenido: [
        { tipo: "video", titulo: "Estándares de calidad Cantera", minutos: 20 },
        { tipo: "lectura", titulo: "Errores comunes y cómo evitarlos", minutos: 12 }
      ],
      examen: { preguntas: 10, notaMinima: 70 } },
    { id: "m4", orden: 4, nombre: "Uso y cuidado de herramientas", tipo: "práctico", horas: 6,
      contenido: [
        { tipo: "video", titulo: "Herramienta manual básica", minutos: 14 },
        { tipo: "practica", titulo: "Taller supervisado de herramientas", minutos: 180 }
      ],
      examen: { preguntas: 10, notaMinima: 70 } },
    { id: "m5", orden: 5, nombre: "Mezcladoras, generadores, barrenos, puntales y andamios", tipo: "práctico", horas: 6,
      contenido: [
        { tipo: "video", titulo: "Operación segura de mezcladoras y generadores", minutos: 16 },
        { tipo: "practica", titulo: "Práctica de armado de andamios", minutos: 180 }
      ],
      examen: { preguntas: 10, notaMinima: 70 } },
    { id: "m6", orden: 6, nombre: "Orden, limpieza y prevención de riesgos", tipo: "teórico", horas: 3,
      contenido: [
        { tipo: "video", titulo: "Orden en obra (metodología 5S adaptada)", minutos: 14 },
        { tipo: "lectura", titulo: "Checklist de prevención de riesgos", minutos: 9 }
      ],
      examen: { preguntas: 8, notaMinima: 70 } },
    { id: "m7", orden: 7, nombre: "Documentación digital y bitácora", tipo: "práctico", horas: 3,
      contenido: [
        { tipo: "video", titulo: "Cómo registrar avance en la bitácora digital", minutos: 12 },
        { tipo: "practica", titulo: "Práctica de registro con evidencias fotográficas", minutos: 60 }
      ],
      examen: { preguntas: 8, notaMinima: 70 } },
    { id: "m8", orden: 8, nombre: "Comunicación con supervisor, propietario y entidad financiera", tipo: "teórico", horas: 3,
      contenido: [
        { tipo: "video", titulo: "Reportes claros y a tiempo", minutos: 13 },
        { tipo: "lectura", titulo: "Trato con el propietario de la vivienda", minutos: 10 }
      ],
      examen: { preguntas: 8, notaMinima: 70 } },
    { id: "m9", orden: 9, nombre: "Calidad de ejecución", tipo: "práctico", horas: 5,
      contenido: [
        { tipo: "video", titulo: "Control de calidad por etapa", minutos: 15 },
        { tipo: "practica", titulo: "Taller de autoevaluación de calidad", minutos: 120 }
      ],
      examen: { preguntas: 10, notaMinima: 70 } },
    { id: "m10", orden: 10, nombre: "Evaluación práctica final", tipo: "práctico", horas: 4,
      contenido: [
        { tipo: "practica", titulo: "Evaluación práctica integradora en obra simulada", minutos: 240 }
      ],
      examen: { preguntas: 15, notaMinima: 75 } }
  ];

  var ETAPAS_OBRA = ["Preparación", "Cimentación", "Levantado", "Instalaciones", "Acabados", "Revisión final", "Entrega"];

  var CRITERIOS_EVALUACION = [
    { key: "formacion", label: "Formación completada", max: 20 },
    { key: "seguridad", label: "Seguridad", max: 15 },
    { key: "calidadTecnica", label: "Calidad técnica", max: 20 },
    { key: "puntualidad", label: "Puntualidad", max: 15 },
    { key: "documentacion", label: "Documentación digital", max: 15 },
    { key: "satisfaccionPropietario", label: "Satisfacción del propietario", max: 10 },
    { key: "comunicacion", label: "Comunicación", max: 5 }
  ];

  var CRITERIOS_EXITO_PILOTO = [
    "Al menos 3 obras completadas de inicio a entrega con el modelo Cantera.",
    "Documentación de bitácora al día en el 100% de las obras activas.",
    "Cero incidentes de seguridad graves durante la ejecución.",
    "Al menos 2 de cada 3 equipos certificados alcanzan categoría A o B.",
    "Satisfacción del propietario validada en el 100% de las entregas."
  ];

  var CATALOGO_FORMACIONES = [
    { id: "cf-01", nombre: "Electricidad residencial básica", categoria: "Especialización técnica",
      descripcion: "Instalaciones eléctricas seguras para vivienda unifamiliar: circuitos, tableros y normas básicas.",
      horas: 12, modalidad: "virtual", costoQ: 0, icono: "bolt", caratula: "yellow" },
    { id: "cf-02", nombre: "Fontanería residencial básica", categoria: "Especialización técnica",
      descripcion: "Instalación y reparación de tubería de agua potable y drenajes en vivienda.",
      horas: 10, modalidad: "virtual", costoQ: 0, icono: "pipe", caratula: "sky" },
    { id: "cf-03", nombre: "Acabados finos y pintura decorativa", categoria: "Especialización técnica",
      descripcion: "Técnicas de acabado fino, texturizados y pintura decorativa para entregas de mayor valor.",
      horas: 16, modalidad: "presencial", costoQ: 150, icono: "paintRoller", caratula: "green" },
    { id: "cf-04", nombre: "Lectura avanzada de planos", categoria: "Especialización técnica",
      descripcion: "Interpretación de planos arquitectónicos y estructurales más complejos.",
      horas: 8, modalidad: "virtual", costoQ: 0, icono: "doc", caratula: "navy" },
    { id: "cf-05", nombre: "Supervisión y liderazgo de equipos", categoria: "Liderazgo",
      descripcion: "Habilidades para coordinar un equipo, resolver conflictos y reportar a supervisores y entidades financieras.",
      horas: 20, modalidad: "presencial", costoQ: 250, icono: "chart", caratula: "sky" },
    { id: "cf-06", nombre: "Manejo seguro de maquinaria pesada", categoria: "Especialización técnica",
      descripcion: "Operación y mantenimiento básico de maquinaria de mayor riesgo utilizada en obra.",
      horas: 24, modalidad: "presencial", costoQ: 300, icono: "shield", caratula: "red" },
    { id: "cf-07", nombre: "Cinturón de herramientas y herramienta manual esencial", categoria: "Herramientas y equipo",
      descripcion: "Organización correcta del cinturón de herramientas y dominio de las herramientas manuales básicas: martillo, cinta métrica, nivel, navaja, alicate y llave ajustable.",
      horas: 6, modalidad: "presencial", costoQ: 0, icono: "cinturon", caratula: "yellow" },
    { id: "cf-08", nombre: "Taladro y atornillador inalámbrico", categoria: "Herramientas y equipo",
      descripcion: "Uso seguro y eficiente del taladro/atornillador inalámbrico: broca correcta según material, control de torque y cuidado de la batería.",
      horas: 8, modalidad: "presencial", costoQ: 0, icono: "taladro", caratula: "sky" },
    { id: "cf-09", nombre: "Sierra circular eléctrica", categoria: "Herramientas y equipo",
      descripcion: "Cortes rectos y seguros en madera, tabla yeso y OSB con sierra circular: selección de disco, uso de guía y postura correcta.",
      horas: 10, modalidad: "presencial", costoQ: 100, icono: "sierraCircular", caratula: "red" },
    { id: "cf-10", nombre: "Esmeriladora angular (pulidora)", categoria: "Herramientas y equipo",
      descripcion: "Corte y desbaste de metal, concreto y cerámica con esmeriladora angular: selección de disco y equipo de protección obligatorio.",
      horas: 10, modalidad: "presencial", costoQ: 100, icono: "esmeriladora", caratula: "navy" },
    { id: "cf-11", nombre: "Pistola de clavos neumática e inalámbrica", categoria: "Herramientas y equipo",
      descripcion: "Fijación rápida y segura de madera y acabados con pistola de clavos: calibración de presión y prevención de accidentes.",
      horas: 8, modalidad: "presencial", costoQ: 120, icono: "clavadora", caratula: "green" },
    { id: "cf-12", nombre: "Nivel láser y medición moderna", categoria: "Herramientas y equipo",
      descripcion: "Uso de nivel láser y medidor láser de distancia para trazos y verificaciones más rápidas y precisas que la escuadra tradicional.",
      horas: 6, modalidad: "presencial", costoQ: 80, icono: "nivelLaser", caratula: "sky" },
    { id: "cf-13", nombre: "Sierra de sable y multiherramienta oscilante", categoria: "Herramientas y equipo",
      descripcion: "Cortes de demolición ligera, remodelación y ajustes finos con sierra de sable y multiherramienta oscilante.",
      horas: 8, modalidad: "presencial", costoQ: 120, icono: "multiherramienta", caratula: "red" }
  ];

  var TRAMOS_DESEMBOLSO = [
    { id: "t1", etapaRequerida: "Preparación", pct: 20, nombre: "Anticipo e inicio de obra" },
    { id: "t2", etapaRequerida: "Cimentación", pct: 25, nombre: "Cimentación completada" },
    { id: "t3", etapaRequerida: "Levantado", pct: 25, nombre: "Levantado de muros completado" },
    { id: "t4", etapaRequerida: "Acabados", pct: 20, nombre: "Acabados completados" },
    { id: "t5", etapaRequerida: "Entrega", pct: 10, nombre: "Entrega final de la vivienda" }
  ];

  /* 2. DATOS SEMILLA ====================================== */

  function strHash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  var NOTAS_BASE_MODULO = { m1: 94, m2: 88, m3: 90, m4: 92, m5: 86, m6: 91, m7: 95, m8: 89, m9: 87, m10: 93 };

  function notaModulo(alumnoId, moduloId) {
    var base = NOTAS_BASE_MODULO[moduloId] || 88;
    var variacion = (strHash(alumnoId + moduloId) % 9) - 4;
    return Math.max(70, Math.min(100, base + variacion));
  }

  function progresoCompleto(alumnoId) {
    return MODULOS_FORMATIVOS.map(function (m) {
      return { moduloId: m.id, estado: "completado", fecha: "2026-04-15", nota: notaModulo(alumnoId, m.id) };
    });
  }

  function progresoParcial(alumnoId, hastaOrden, estadoActual) {
    return MODULOS_FORMATIVOS.map(function (m) {
      if (m.orden < hastaOrden) return { moduloId: m.id, estado: "completado", fecha: "2026-05-01", nota: notaModulo(alumnoId, m.id) };
      if (m.orden === hastaOrden) return { moduloId: m.id, estado: estadoActual || "en_curso", fecha: null, nota: null };
      return { moduloId: m.id, estado: "pendiente", fecha: null, nota: null };
    });
  }

  function generarDesembolsos(obra) {
    var idxObra = ETAPAS_OBRA.indexOf(obra.etapaActual);
    return TRAMOS_DESEMBOLSO.map(function (t) {
      var idxTramo = ETAPAS_OBRA.indexOf(t.etapaRequerida);
      var estado = idxTramo < idxObra ? "liberado" : (idxTramo === idxObra ? "disponible" : "pendiente");
      return { tramoId: t.id, estado: estado, fechaLiberacion: estado === "liberado" ? obra.fechaInicio : null };
    });
  }

  var SEED = {
    entidadesFinancieras: [
      { id: "ef-01", nombre: "Banco Confianza Rural, S.A.", tipo: "banco", contacto: "Departamento de Vivienda Social", fechaAlianza: "2026-03-01" },
      { id: "ef-02", nombre: "Fundación Vivienda Digna", tipo: "aliado", contacto: "Coordinación de Proyectos", fechaAlianza: "2026-04-12" }
    ],

    tutores: [
      { id: "tu-01", nombre: "Marta Elena Sical", especialidad: "Psicóloga educativa",
        bio: "Acompaña el proceso emocional y motivacional de los alumnos, ayudándolos a sostener el ritmo de formación y resolver bloqueos personales.",
        capacidadMaxima: 70, colorAvatar: "sky" },
      { id: "tu-02", nombre: "Luis Fernando Ordóñez", especialidad: "Pedagogo",
        bio: "Ayuda a los alumnos a organizar su tiempo de estudio y a encontrar la forma de aprender que mejor se adapta a su ritmo.",
        capacidadMaxima: 70, colorAvatar: "green" },
      { id: "tu-03", nombre: "Claudia Beatriz Morales", especialidad: "Trabajadora social",
        bio: "Apoya a los alumnos en temas prácticos y de bienestar durante su proceso de formación, y los conecta con el recurso correcto en cada momento.",
        capacidadMaxima: 70, colorAvatar: "navy" }
    ],

    alumnos: [
      {
        id: "al-01", tutorId: "tu-01", nombre: "Juan Carlos Morales Xoc", edad: 26, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "4 años como albañil informal", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0101",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-alfa", rolEnEquipo: "jefe", destacado: true,
        progresoModulos: progresoCompleto("al-01"),
        solicitudesFormacion: []
      },
      {
        id: "al-02", tutorId: "tu-01", nombre: "María Fernanda Us", edad: 24, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0102",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-alfa", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto("al-02"),
        solicitudesFormacion: []
      },
      {
        id: "al-03", tutorId: "tu-01", nombre: "Pedro Tzul", edad: 22, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0103",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-alfa", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto("al-03"),
        solicitudesFormacion: []
      },
      {
        id: "al-04", tutorId: "tu-01", nombre: "Carlos Ramírez", edad: 29, municipio: "Mixco",
        experienciaPrevia: "2 años en obra gris", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "intermedio", interesConstruccion: "medio", telefono: "5555-0104",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-alfa", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto("al-04"),
        solicitudesFormacion: []
      },
      {
        id: "al-05", tutorId: "tu-02", nombre: "Marvin Osorio", edad: 31, municipio: "Chimaltenango",
        experienciaPrevia: "5 años como maestro de obra", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0105",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-beta", rolEnEquipo: "jefe", destacado: false,
        progresoModulos: progresoCompleto("al-05"),
        solicitudesFormacion: []
      },
      {
        id: "al-06", tutorId: "tu-02", nombre: "Ana Lucía Pérez", edad: 27, municipio: "Chimaltenango",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0106",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-beta", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto("al-06"),
        solicitudesFormacion: []
      },
      {
        id: "al-07", tutorId: "tu-02", nombre: "Diego Hernández", edad: 23, municipio: "Chimaltenango",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "parcial", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "medio", telefono: "5555-0107",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-beta", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto("al-07"),
        solicitudesFormacion: []
      },
      {
        id: "al-08", tutorId: "tu-02", nombre: "Sara Cabrera", edad: 25, municipio: "Chimaltenango",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0108",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-beta", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto("al-08"),
        solicitudesFormacion: []
      },
      {
        id: "al-09", tutorId: "tu-03", nombre: "Estuardo Chali", edad: 33, municipio: "Santa Apolonia",
        experienciaPrevia: "6 años de experiencia informal", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0109",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-gamma", rolEnEquipo: "jefe", destacado: false,
        progresoModulos: progresoCompleto("al-09"),
        solicitudesFormacion: []
      },
      {
        id: "al-10", tutorId: "tu-03", nombre: "Wendy Sical", edad: 28, municipio: "Santa Apolonia",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0110",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-gamma", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto("al-10"),
        solicitudesFormacion: []
      },
      {
        id: "al-11", tutorId: "tu-03", nombre: "Byron Coy", edad: 20, municipio: "Santa Apolonia",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "medio", telefono: "5555-0111",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "necesita_refuerzo",
        potencial: "ayudante", equipoId: "eq-gamma", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoParcial("al-11", 7, "en_curso"),
        solicitudesFormacion: []
      },
      {
        id: "al-12", tutorId: "tu-03", nombre: "Elvia Tzoc", edad: 19, municipio: "San Martín Jilotepeque",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0112",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "en_formacion",
        potencial: "ayudante", equipoId: null, rolEnEquipo: null, destacado: false,
        progresoModulos: progresoParcial("al-12", 5, "en_curso"),
        solicitudesFormacion: []
      },
      {
        id: "al-13", tutorId: "tu-01", nombre: "Mario Alberto Xitumul", edad: 30, municipio: "Quetzaltenango",
        experienciaPrevia: "3 años en albañilería", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0113",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: null, rolEnEquipo: null, destacado: true,
        progresoModulos: progresoCompleto("al-13"),
        solicitudesFormacion: []
      },
      {
        id: "al-14", tutorId: "tu-02", nombre: "Rosa Isela Cotzajay", edad: 23, municipio: "Quetzaltenango",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0114",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "en_formacion",
        potencial: "ayudante", equipoId: null, rolEnEquipo: null, destacado: false,
        progresoModulos: progresoParcial("al-14", 6, "en_curso"),
        solicitudesFormacion: []
      },
      {
        id: "al-15", tutorId: "tu-03", nombre: "Julio César Marroquín", edad: 34, municipio: "Escuintla",
        experienciaPrevia: "7 años como operador de maquinaria", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0115",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-delta", rolEnEquipo: "jefe", destacado: false,
        progresoModulos: progresoCompleto("al-15"),
        solicitudesFormacion: []
      },
      {
        id: "al-16", tutorId: "tu-01", nombre: "Katherine Waleska Ixchop", edad: 21, municipio: "Escuintla",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "medio", telefono: "5555-0116",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-delta", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto("al-16"),
        solicitudesFormacion: []
      },
      {
        id: "al-17", tutorId: "tu-02", nombre: "Hugo Leonel Caal", edad: 27, municipio: "Cobán",
        experienciaPrevia: "2 años en obra gris", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0117",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-delta", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto("al-17"),
        solicitudesFormacion: []
      },
      {
        id: "al-18", tutorId: "tu-03", nombre: "Floridalma Xol", edad: 19, municipio: "Cobán",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0118",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "en_formacion",
        potencial: "ayudante", equipoId: null, rolEnEquipo: null, destacado: false,
        progresoModulos: progresoParcial("al-18", 4, "en_curso"),
        solicitudesFormacion: []
      }
    ],

    equipos: [
      {
        id: "eq-alfa", codigo: "EQ-001", nombre: "Equipo Alfa", ubicacion: "San Juan Sacatepéquez",
        disponibilidad: "en obra", categoria: "A", calificacionActual: 92, destacado: true,
        obraId: "ob-001", fechaCreacion: "2026-04-20",
        integrantes: [
          { alumnoId: "al-01", rol: "jefe" },
          { alumnoId: "al-02", rol: "asistente" },
          { alumnoId: "al-03", rol: "ayudante" },
          { alumnoId: "al-04", rol: "ayudante" }
        ],
        evaluacion: { formacion: 20, seguridad: 13, calidadTecnica: 18, puntualidad: 13, documentacion: 14, satisfaccionPropietario: 9, comunicacion: 5 },
        historialObras: ["ob-001"]
      },
      {
        id: "eq-beta", codigo: "EQ-002", nombre: "Equipo Beta", ubicacion: "Chimaltenango",
        disponibilidad: "en obra", categoria: "B", calificacionActual: 78, destacado: false,
        obraId: "ob-002", fechaCreacion: "2026-05-10",
        integrantes: [
          { alumnoId: "al-05", rol: "jefe" },
          { alumnoId: "al-06", rol: "asistente" },
          { alumnoId: "al-07", rol: "ayudante" },
          { alumnoId: "al-08", rol: "ayudante" }
        ],
        evaluacion: { formacion: 17, seguridad: 12, calidadTecnica: 15, puntualidad: 11, documentacion: 11, satisfaccionPropietario: 8, comunicacion: 4 },
        historialObras: ["ob-002"]
      },
      {
        id: "eq-gamma", codigo: "EQ-003", nombre: "Equipo Gamma", ubicacion: "Santa Apolonia, Chimaltenango",
        disponibilidad: "en obra", categoria: "C", calificacionActual: 58, destacado: false,
        obraId: "ob-003", fechaCreacion: "2026-05-28",
        integrantes: [
          { alumnoId: "al-09", rol: "jefe" },
          { alumnoId: "al-10", rol: "asistente" },
          { alumnoId: "al-11", rol: "ayudante" }
        ],
        evaluacion: { formacion: 12, seguridad: 9, calidadTecnica: 11, puntualidad: 9, documentacion: 8, satisfaccionPropietario: 6, comunicacion: 3 },
        historialObras: ["ob-003"]
      },
      {
        id: "eq-delta", codigo: "EQ-004", nombre: "Equipo Delta", ubicacion: "Escuintla",
        disponibilidad: "disponible", categoria: "B", calificacionActual: 81, destacado: false,
        obraId: null, fechaCreacion: "2026-01-05",
        integrantes: [
          { alumnoId: "al-15", rol: "jefe" },
          { alumnoId: "al-16", rol: "asistente" },
          { alumnoId: "al-17", rol: "ayudante" }
        ],
        evaluacion: { formacion: 18, seguridad: 13, calidadTecnica: 16, puntualidad: 12, documentacion: 12, satisfaccionPropietario: 9, comunicacion: 5 },
        historialObras: ["ob-004"]
      }
    ],

    obras: [
      {
        id: "ob-001", codigo: "OB-2026-001", ubicacion: "San Juan Sacatepéquez, Guatemala",
        propietario: "Familia López Ramírez", entidadFinancieraId: "ef-01", equipoId: "eq-alfa",
        fechaInicio: "2026-05-04", fechaEstimadaEntrega: "2026-09-15", etapaActual: "Acabados",
        supervisor: "Ing. Rodrigo Paz", tipoVivienda: "Vivienda unifamiliar de 65 m²",
        estadoRiesgo: "bajo", porcentajeAvance: 82, estado: "en_curso", mapaX: 254, mapaY: 517.5, destacada: true, montoTotalFinanciadoQ: 195000
      },
      {
        id: "ob-002", codigo: "OB-2026-002", ubicacion: "Chimaltenango, Guatemala",
        propietario: "Familia Ramírez Coy", entidadFinancieraId: "ef-01", equipoId: "eq-beta",
        fechaInicio: "2026-06-01", fechaEstimadaEntrega: "2026-10-30", etapaActual: "Instalaciones",
        supervisor: "Ing. Fernando Ixchop", tipoVivienda: "Vivienda unifamiliar de 72 m²",
        estadoRiesgo: "medio", porcentajeAvance: 55, estado: "en_curso", mapaX: 208, mapaY: 512, destacada: false, montoTotalFinanciadoQ: 216000
      },
      {
        id: "ob-003", codigo: "OB-2026-003", ubicacion: "Santa Apolonia, Chimaltenango",
        propietario: "Familia Gómez Sical", entidadFinancieraId: "ef-02", equipoId: "eq-gamma",
        fechaInicio: "2026-06-20", fechaEstimadaEntrega: "2026-11-10", etapaActual: "Cimentación",
        supervisor: "Ing. Marta Xoc", tipoVivienda: "Vivienda unifamiliar de 58 m²",
        estadoRiesgo: "alto", porcentajeAvance: 25, estado: "en_curso", mapaX: 190, mapaY: 500, destacada: false, montoTotalFinanciadoQ: 174000
      },
      {
        id: "ob-004", codigo: "OB-2026-004", ubicacion: "Escuintla, Escuintla",
        propietario: "Familia Us Marroquín", entidadFinancieraId: "ef-01", equipoId: "eq-delta",
        fechaInicio: "2026-01-12", fechaEstimadaEntrega: "2026-05-20", etapaActual: "Entrega",
        supervisor: "Ing. Lucía Barrios", tipoVivienda: "Vivienda unifamiliar de 60 m²",
        estadoRiesgo: "bajo", porcentajeAvance: 100, destacada: false, montoTotalFinanciadoQ: 168000,
        estado: "finalizada", mapaX: 195, mapaY: 588
      },
      {
        id: "ob-005", codigo: "OB-2026-005", ubicacion: "Quetzaltenango, Quetzaltenango",
        propietario: "Familia Similox García", entidadFinancieraId: "ef-01", equipoId: null,
        fechaInicio: null, fechaEstimadaEntrega: "2026-12-15", etapaActual: "Sin iniciar",
        supervisor: "Por asignar", tipoVivienda: "Vivienda unifamiliar de 68 m²",
        estadoRiesgo: "pendiente", porcentajeAvance: 0, destacada: false, montoTotalFinanciadoQ: 205000,
        estado: "planificada", mapaX: 80, mapaY: 498
      },
      {
        id: "ob-006", codigo: "OB-2026-006", ubicacion: "Cobán, Alta Verapaz",
        propietario: "Familia Caal Xol", entidadFinancieraId: "ef-02", equipoId: null,
        fechaInicio: null, fechaEstimadaEntrega: "2027-01-20", etapaActual: "Sin iniciar",
        supervisor: "Por asignar", tipoVivienda: "Vivienda unifamiliar de 55 m²",
        estadoRiesgo: "pendiente", porcentajeAvance: 0, destacada: false, montoTotalFinanciadoQ: 158000,
        estado: "planificada", mapaX: 310, mapaY: 330
      },
      {
        id: "ob-007", codigo: "OB-2026-007", ubicacion: "Antigua Guatemala, Sacatepéquez",
        propietario: "Familia Ordóñez Pérez", entidadFinancieraId: "ef-01", equipoId: null,
        fechaInicio: null, fechaEstimadaEntrega: "2026-12-30", etapaActual: "Sin iniciar",
        supervisor: "Por asignar", tipoVivienda: "Vivienda unifamiliar de 75 m²",
        estadoRiesgo: "pendiente", porcentajeAvance: 0, destacada: false, montoTotalFinanciadoQ: 228000,
        estado: "planificada", mapaX: 238, mapaY: 545
      }
    ],

    bitacora: [
      { id: "bt-01", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-05-06", etapa: "Preparación",
        descripcion: "Limpieza y trazo del terreno completado. Se instaló bodega temporal y letrina para el equipo.",
        materiales: "Cal, cuerda, estacas de madera", herramientas: "Nivel de manguera, cinta métrica, mazo",
        evidencias: [{ tipo: "foto", descripcion: "Terreno trazado y limpio" }],
        incidenciaId: null, porcentajeAvanceReportado: 8, solicitudRevision: false },
      { id: "bt-02", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-05-20", etapa: "Cimentación",
        descripcion: "Excavación y fundición de zapatas y solera de humedad finalizada en todo el perímetro.",
        materiales: "Cemento, hierro 3/8\", piedrín, arena de río", herramientas: "Mezcladora, vibrador de concreto",
        evidencias: [{ tipo: "foto", descripcion: "Zapatas fundidas" }],
        incidenciaId: "inc-02", porcentajeAvanceReportado: 24, solicitudRevision: false },
      { id: "bt-03", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-06-18", etapa: "Levantado",
        descripcion: "Levantado de muros de block en primer nivel al 90%, incluyendo columnas de amarre.",
        materiales: "Block 15x20x40, cemento, arena", herramientas: "Andamios, plomada, nivel láser",
        evidencias: [{ tipo: "foto", descripcion: "Muros levantados, primer nivel" }],
        incidenciaId: null, porcentajeAvanceReportado: 48, solicitudRevision: false },
      { id: "bt-04", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-07-22", etapa: "Instalaciones",
        descripcion: "Instalación eléctrica e hidráulica embutida completada, lista para repello.",
        materiales: "Tubería PVC, cable THHN, cajas octogonales", herramientas: "Rotomartillo, pulidora",
        evidencias: [{ tipo: "foto", descripcion: "Instalación eléctrica embutida" }],
        incidenciaId: null, porcentajeAvanceReportado: 66, solicitudRevision: false },
      { id: "bt-05", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-08-01", etapa: "Acabados",
        descripcion: "Repello y cernido de fachada principal terminado. Piso cerámico colocado en sala y comedor.",
        materiales: "Cerámica 40x40, cemento gris, arena de río", herramientas: "Llana, nivel, cortadora de cerámica",
        evidencias: [{ tipo: "foto", descripcion: "Piso cerámico colocado" }, { tipo: "foto", descripcion: "Fachada repellada" }],
        incidenciaId: null, porcentajeAvanceReportado: 82, solicitudRevision: true },

      { id: "bt-06", obraId: "ob-002", equipoId: "eq-beta", fecha: "2026-06-05", etapa: "Preparación",
        descripcion: "Trazo y limpieza de terreno realizado conforme a planos.",
        materiales: "Cal, cuerda, estacas", herramientas: "Nivel, cinta métrica",
        evidencias: [{ tipo: "foto", descripcion: "Terreno trazado" }],
        incidenciaId: null, porcentajeAvanceReportado: 10, solicitudRevision: false },
      { id: "bt-07", obraId: "ob-002", equipoId: "eq-beta", fecha: "2026-07-02", etapa: "Cimentación",
        descripcion: "Zapatas fundidas en un 100%. Solera de humedad en proceso.",
        materiales: "Cemento, hierro 3/8\", piedrín", herramientas: "Mezcladora",
        evidencias: [{ tipo: "foto", descripcion: "Zapatas fundidas" }],
        incidenciaId: null, porcentajeAvanceReportado: 28, solicitudRevision: false },
      { id: "bt-08", obraId: "ob-002", equipoId: "eq-beta", fecha: "2026-07-30", etapa: "Levantado",
        descripcion: "Levantado de muros en primer nivel al 70%.",
        materiales: "Block, cemento, arena", herramientas: "Andamios, plomada",
        evidencias: [{ tipo: "foto", descripcion: "Levantado de muros" }],
        incidenciaId: null, porcentajeAvanceReportado: 42, solicitudRevision: false },
      { id: "bt-09", obraId: "ob-002", equipoId: "eq-beta", fecha: "2026-08-04", etapa: "Instalaciones",
        descripcion: "Inicio de instalación hidráulica. Se solicita revisión de supervisor para continuar con eléctrica.",
        materiales: "Tubería PVC, accesorios sanitarios", herramientas: "Rotomartillo",
        evidencias: [{ tipo: "foto", descripcion: "Tubería hidráulica instalada" }],
        incidenciaId: null, porcentajeAvanceReportado: 55, solicitudRevision: true },

      { id: "bt-10", obraId: "ob-003", equipoId: "eq-gamma", fecha: "2026-06-22", etapa: "Preparación",
        descripcion: "Limpieza de terreno completada. Trazo pendiente de validación por el supervisor.",
        materiales: "Cal, cuerda", herramientas: "Nivel de manguera",
        evidencias: [{ tipo: "foto", descripcion: "Terreno en limpieza" }],
        incidenciaId: null, porcentajeAvanceReportado: 10, solicitudRevision: false },
      { id: "bt-11", obraId: "ob-003", equipoId: "eq-gamma", fecha: "2026-07-28", etapa: "Cimentación",
        descripcion: "Excavación de zapatas iniciada. Se reporta retraso en la entrega de cemento por parte del proveedor local.",
        materiales: "Piedrín, arena (cemento pendiente de entrega)", herramientas: "Barreno, pala mecánica",
        evidencias: [{ tipo: "foto", descripcion: "Excavación de zapatas" }],
        incidenciaId: "inc-01", porcentajeAvanceReportado: 25, solicitudRevision: true }
    ],

    incidencias: [
      { id: "inc-01", obraId: "ob-003", equipoId: "eq-gamma", fecha: "2026-07-28", tipo: "Retraso de materiales",
        descripcion: "Proveedor local no entregó el cemento programado, generando atraso en la fundición de zapatas.",
        severidad: "media", estado: "abierta", resolucion: null },
      { id: "inc-02", obraId: "ob-001", equipoId: "eq-alfa", fecha: "2026-05-10", tipo: "Seguridad",
        descripcion: "Se detectó a un ayudante sin casco durante la excavación de zapatas.",
        severidad: "baja", estado: "resuelta",
        resolucion: "Se reforzó el uso obligatorio de equipo de protección personal y se realizó una charla de seguridad de 30 minutos con todo el equipo." }
    ],

    mensajesTutoria: [
      { id: "mt-01", alumnoId: "al-01", tutorId: "tu-01", autor: "alumno",
        texto: "Hola, ¿puedo ver mi certificado desde el celular o solo desde computadora?",
        fecha: "2026-08-01", leido: true },
      { id: "mt-02", alumnoId: "al-01", tutorId: "tu-01", autor: "tutor",
        texto: "¡Hola Juan Carlos! Sí, puedes verlo y descargarlo desde cualquier navegador, incluido tu celular, en la pestaña Certificados.",
        fecha: "2026-08-01", leido: false },
      { id: "mt-03", alumnoId: "al-11", tutorId: "tu-03", autor: "alumno",
        texto: "Mi evaluación dice que necesito refuerzo pero no sé bien en qué. ¿Me puede orientar?",
        fecha: "2026-08-03", leido: false }
    ],

    mensajesDirectivos: [
      { id: "md-01", tutorId: "tu-01", de: "Administración Cantera", asunto: "Resumen mensual de seguimiento",
        texto: "Por favor envía tu resumen de seguimiento de julio antes del viernes.",
        fecha: "2026-07-28", leido: false },
      { id: "md-02", tutorId: "tu-03", de: "Administración Cantera", asunto: "Nuevo alumno asignado",
        texto: "Se te ha asignado un nuevo alumno: Elvia Tzoc, actualmente sin equipo.",
        fecha: "2026-08-02", leido: false }
    ]
  };

  SEED.obras.forEach(function (o) { o.desembolsos = generarDesembolsos(o); });

  /* 3. PERSISTENCIA ======================================== */

  function cloneSeed() {
    return JSON.parse(JSON.stringify(SEED));
  }

  function loadData() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (!raw) {
      var fresh = cloneSeed();
      saveData(fresh);
      return fresh;
    }
    try {
      var parsed = JSON.parse(raw);
      if (migrarDatosTutoria(parsed)) saveData(parsed);
      return parsed;
    } catch (e) {
      var fallback = cloneSeed();
      saveData(fallback);
      return fallback;
    }
  }

  function migrarDatosTutoria(data) {
    var changed = false;
    if (!data.tutores) {
      data.tutores = cloneSeed().tutores;
      changed = true;
    }
    if (!data.mensajesTutoria) {
      data.mensajesTutoria = [];
      changed = true;
    }
    if (!data.mensajesDirectivos) {
      data.mensajesDirectivos = [];
      changed = true;
    }
    if (data.alumnos) {
      var faltaTutorId = data.alumnos.some(function (a) { return !a.tutorId; });
      if (faltaTutorId) {
        var seedAlumnos = cloneSeed().alumnos;
        data.alumnos.forEach(function (a) {
          if (!a.tutorId) {
            var seedMatch = seedAlumnos.filter(function (s) { return s.id === a.id; })[0];
            if (seedMatch && seedMatch.tutorId) {
              a.tutorId = seedMatch.tutorId;
              changed = true;
            }
          }
        });
      }
    }
    return changed;
  }

  function storageAvailable() {
    try {
      var testKey = "__cantera_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* almacenamiento no disponible */ }
  }

  function resetDemo() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
    window.location.reload();
  }

  /* 4. HELPERS DE CONSULTA ================================= */

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function getAlumno(data, id) { return byId(data.alumnos, id); }
  function getEquipo(data, id) { return byId(data.equipos, id); }
  function getObra(data, id) { return byId(data.obras, id); }
  function getEntidad(data, id) { return byId(data.entidadesFinancieras, id); }
  function getTutor(data, id) { return byId(data.tutores, id); }

  function getBitacoraPorObra(data, obraId) {
    return data.bitacora.filter(function (b) { return b.obraId === obraId; })
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  }

  function getIncidenciasPorObra(data, obraId) {
    return data.incidencias.filter(function (i) { return i.obraId === obraId; });
  }

  function getAlumnosPorEquipo(data, equipoId) {
    var eq = getEquipo(data, equipoId);
    if (!eq) return [];
    return eq.integrantes.map(function (i) {
      var al = getAlumno(data, i.alumnoId);
      return al ? Object.assign({}, al, { rolEnEquipoActual: i.rol }) : null;
    }).filter(Boolean);
  }

  function getEquipoDestacado(data) {
    var destacado = data.equipos.filter(function (e) { return e.destacado; })[0];
    return destacado || data.equipos[0];
  }

  function getAlumnoDestacado(data) {
    var destacado = data.alumnos.filter(function (a) { return a.destacado; })[0];
    return destacado || data.alumnos[0];
  }

  /* 5. HELPERS DE PRESENTACIÓN ============================= */

  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function formatFecha(iso) {
    if (!iso) return "—";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear();
  }

  function scoreCategoria(score) {
    if (score >= 85) return { letra: "A", label: "Equipo A", desc: "Altamente confiable", clase: "green" };
    if (score >= 70) return { letra: "B", label: "Equipo B", desc: "Confiable con mejoras", clase: "sky" };
    if (score >= 55) return { letra: "C", label: "Equipo C", desc: "Requiere refuerzo", clase: "yellow" };
    return { letra: "—", label: "No recomendado", desc: "Requiere recertificación", clase: "red" };
  }

  function scoreTotal(evaluacion) {
    var total = 0;
    CRITERIOS_EVALUACION.forEach(function (c) { total += (evaluacion[c.key] || 0); });
    return total;
  }

  function riesgoBadge(estadoRiesgo) {
    var map = {
      bajo: { texto: "Riesgo bajo", clase: "green" },
      medio: { texto: "Riesgo medio", clase: "yellow" },
      alto: { texto: "Riesgo alto", clase: "red" }
    };
    return map[estadoRiesgo] || { texto: estadoRiesgo, clase: "gray" };
  }

  function certificacionBadge(estado) {
    var map = {
      certificado: { texto: "Certificado", clase: "green" },
      necesita_refuerzo: { texto: "Necesita refuerzo", clase: "yellow" },
      no_apto: { texto: "No apto todavía", clase: "red" },
      en_formacion: { texto: "En formación", clase: "sky" }
    };
    return map[estado] || { texto: estado, clase: "gray" };
  }

  function moduloEstadoLabel(estado) {
    var map = { completado: "Completado", en_curso: "En curso", pendiente: "Pendiente" };
    return map[estado] || estado;
  }

  function progresoFormativoPct(alumno) {
    var total = alumno.progresoModulos.length;
    if (!total) return 0;
    var completados = alumno.progresoModulos.filter(function (p) { return p.estado === "completado"; }).length;
    return Math.round((completados / total) * 100);
  }

  function etapaIndex(etapa) {
    var idx = ETAPAS_OBRA.indexOf(etapa);
    return idx === -1 ? 0 : idx;
  }

  function getCatalogoFormaciones() { return CATALOGO_FORMACIONES; }

  function getSolicitud(alumno, cursoId) {
    return (alumno.solicitudesFormacion || []).filter(function (s) { return s.cursoId === cursoId; })[0] || null;
  }

  function solicitarFormacion(data, alumnoId, cursoId) {
    var alumno = getAlumno(data, alumnoId);
    if (!alumno) return;
    if (!alumno.solicitudesFormacion) alumno.solicitudesFormacion = [];
    if (getSolicitud(alumno, cursoId)) return;
    alumno.solicitudesFormacion.push({
      cursoId: cursoId, estado: "solicitada",
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      fechaActualizacion: new Date().toISOString().slice(0, 10),
      nota: null
    });
    saveData(data);
  }

  function avanzarSolicitud(data, alumnoId, cursoId) {
    var alumno = getAlumno(data, alumnoId);
    if (!alumno) return null;
    var s = getSolicitud(alumno, cursoId);
    if (!s) return null;
    if (s.estado === "solicitada") { s.estado = "en_curso"; }
    else if (s.estado === "en_curso") { s.estado = "completada"; s.nota = notaModulo(alumnoId, cursoId); }
    s.fechaActualizacion = new Date().toISOString().slice(0, 10);
    saveData(data);
    return s.estado;
  }

  function solicitudEstadoBadge(estado) {
    var map = {
      solicitada: { texto: "Solicitada", clase: "yellow" },
      en_curso: { texto: "En curso", clase: "sky" },
      completada: { texto: "Completada", clase: "green" }
    };
    return map[estado] || { texto: "Disponible", clase: "gray" };
  }

  function promedioNotas(alumno) {
    var notas = alumno.progresoModulos
      .filter(function (p) { return p.estado === "completado" && typeof p.nota === "number"; })
      .map(function (p) { return p.nota; });
    if (!notas.length) return null;
    var suma = notas.reduce(function (a, b) { return a + b; }, 0);
    return Math.round(suma / notas.length);
  }

  function horasCompletadas(alumno) {
    var completados = alumno.progresoModulos
      .filter(function (p) { return p.estado === "completado"; })
      .map(function (p) { return p.moduloId; });
    return MODULOS_FORMATIVOS
      .filter(function (m) { return completados.indexOf(m.id) !== -1; })
      .reduce(function (sum, m) { return sum + m.horas; }, 0);
  }

  function codigoCertificado(alumno) {
    return "CC-2026-" + alumno.id.toUpperCase();
  }

  function codigoCertificadoEspecializacion(alumno, cursoId) {
    return "CC-ESP-2026-" + alumno.id.toUpperCase() + "-" + cursoId.toUpperCase();
  }

  function getTramosDesembolso() { return TRAMOS_DESEMBOLSO; }

  function getTramo(tramoId) {
    return TRAMOS_DESEMBOLSO.filter(function (t) { return t.id === tramoId; })[0] || null;
  }

  function getDesembolso(obra, tramoId) {
    return (obra.desembolsos || []).filter(function (d) { return d.tramoId === tramoId; })[0] || null;
  }

  function montoTramo(obra, tramoId) {
    var t = getTramo(tramoId);
    if (!t) return 0;
    return Math.round(obra.montoTotalFinanciadoQ * t.pct / 100);
  }

  function montoLiberado(obra) {
    return (obra.desembolsos || [])
      .filter(function (d) { return d.estado === "liberado"; })
      .reduce(function (sum, d) { return sum + montoTramo(obra, d.tramoId); }, 0);
  }

  function liberarDesembolso(data, obraId, tramoId) {
    var obra = getObra(data, obraId);
    if (!obra) return false;
    var d = getDesembolso(obra, tramoId);
    if (!d || d.estado !== "disponible") return false;
    d.estado = "liberado";
    d.fechaLiberacion = new Date().toISOString().slice(0, 10);
    saveData(data);
    return true;
  }

  function getDesembolsosPendientes(data) {
    var out = [];
    data.obras.forEach(function (obra) {
      (obra.desembolsos || []).forEach(function (d) {
        if (d.estado === "disponible") out.push({ obra: obra, desembolso: d });
      });
    });
    return out;
  }

  function desembolsoEstadoBadge(estado) {
    var map = {
      pendiente: { texto: "Pendiente", clase: "gray" },
      disponible: { texto: "Listo para liberar", clase: "yellow" },
      liberado: { texto: "Liberado", clase: "green" }
    };
    return map[estado] || { texto: estado, clase: "gray" };
  }

  function formatQ(monto) {
    var str = Math.round(monto || 0).toString();
    var withCommas = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "Q " + withCommas;
  }

  /* 6. TUTORÍA Y MENSAJERÍA ================================ */

  function getTutorDeAlumno(data, alumnoId) {
    var al = getAlumno(data, alumnoId);
    return al && al.tutorId ? getTutor(data, al.tutorId) : null;
  }

  function getAlumnosDeTutor(data, tutorId) {
    return data.alumnos.filter(function (a) { return a.tutorId === tutorId; });
  }

  function getHiloTutoria(data, alumnoId) {
    return (data.mensajesTutoria || [])
      .filter(function (m) { return m.alumnoId === alumnoId; })
      .sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
  }

  function enviarMensajeTutoria(data, alumnoId, tutorId, autor, texto) {
    if (!data.mensajesTutoria) data.mensajesTutoria = [];
    data.mensajesTutoria.push({
      id: "mt-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      alumnoId: alumnoId, tutorId: tutorId, autor: autor, texto: texto,
      fecha: new Date().toISOString().slice(0, 10), leido: false
    });
    saveData(data);
  }

  function marcarHiloLeido(data, alumnoId, porQuien) {
    var autorOpuesto = porQuien === "alumno" ? "tutor" : "alumno";
    (data.mensajesTutoria || []).forEach(function (m) {
      if (m.alumnoId === alumnoId && m.autor === autorOpuesto) m.leido = true;
    });
    saveData(data);
  }

  function contarNoLeidosAlumno(data, alumnoId) {
    return (data.mensajesTutoria || []).filter(function (m) {
      return m.alumnoId === alumnoId && m.autor === "tutor" && !m.leido;
    }).length;
  }

  function getDudasPendientesTutor(data, tutorId) {
    var alumnos = getAlumnosDeTutor(data, tutorId);
    var pendientes = [];
    alumnos.forEach(function (al) {
      var hilo = getHiloTutoria(data, al.id);
      if (hilo.length && hilo[hilo.length - 1].autor === "alumno") {
        pendientes.push({ alumno: al, ultimoMensaje: hilo[hilo.length - 1] });
      }
    });
    return pendientes;
  }

  function getMensajesDirectivos(data, tutorId) {
    return (data.mensajesDirectivos || []).filter(function (m) { return m.tutorId === tutorId; });
  }

  function getNotificacionesTutor(data, tutorId) {
    var alumnos = getAlumnosDeTutor(data, tutorId);
    var out = [];
    alumnos.forEach(function (al) {
      if (al.estadoCertificacion === "necesita_refuerzo") {
        out.push({ texto: al.nombre + " necesita refuerzo en su evaluación.", alumnoId: al.id, clase: "yellow" });
      }
      if (al.estadoCertificacion === "certificado" && !al.equipoId) {
        out.push({ texto: al.nombre + " ya está certificado y disponible para equipo.", alumnoId: al.id, clase: "sky" });
      }
    });
    return out;
  }

/* 7. MAPA DE COBERTURA POR DEPARTAMENTO ============================ */

  var MUNICIPIO_A_DEPARTAMENTO = {
    "San Juan Sacatepéquez": "dep-guatemala",
    "Antigua Guatemala": "dep-sacatepequez",
    "Mixco": "dep-guatemala",
    "Chimaltenango": "dep-chimaltenango",
    "Santa Apolonia": "dep-chimaltenango",
    "San Martín Jilotepeque": "dep-chimaltenango",
    "Quetzaltenango": "dep-quetzaltenango",
    "Escuintla": "dep-escuintla",
    "Cobán": "dep-alta-verapaz"
  };

  function getDepartamentoDeAlumno(alumno) {
    return MUNICIPIO_A_DEPARTAMENTO[alumno.municipio] || null;
  }

  function getPersonasPorDepartamento(data, depId) {
    return data.alumnos.filter(function (a) {
      return getDepartamentoDeAlumno(a) === depId;
    });
  }

  function getConteoPorDepartamento(data) {
    var conteo = {};
    data.alumnos.forEach(function (a) {
      var dep = getDepartamentoDeAlumno(a);
      if (!dep) return;
      conteo[dep] = (conteo[dep] || 0) + 1;
    });
    return conteo;
  }

/* 8. ASIGNACIÓN DE EQUIPOS Y OBRAS =================================== */

  var ROLES_EQUIPO = [
    { valor: "jefe", etiqueta: "Jefe de grupo" },
    { valor: "asistente", etiqueta: "Asistente" },
    { valor: "ayudante", etiqueta: "Ayudante" }
  ];

  function rolEquipoLabel(rol) {
    var r = ROLES_EQUIPO.filter(function (x) { return x.valor === rol; })[0];
    return r ? r.etiqueta : rol;
  }

  function getAlumnosSinEquipo(data) {
    return data.alumnos.filter(function (a) { return !a.equipoId; });
  }

  function getEquiposDisponibles(data) {
    return data.equipos.filter(function (e) { return !e.obraId; });
  }

  function getObrasPorEstado(data, estado) {
    return data.obras.filter(function (o) { return o.estado === estado; });
  }

  function siguienteCodigoEquipo(data) {
    var n = data.equipos.length + 1;
    var s = String(n);
    while (s.length < 3) s = "0" + s;
    return "EQ-" + s;
  }

  function crearEquipo(data, nombre, integrantes) {
    var municipios = integrantes.map(function (it) {
      var al = getAlumno(data, it.alumnoId);
      return al ? al.municipio : null;
    }).filter(Boolean);
    var ubicacion = municipios.length ? municipios[0] : "Por definir";

    var nuevo = {
      id: "eq-" + Date.now(),
      codigo: siguienteCodigoEquipo(data),
      nombre: nombre,
      ubicacion: ubicacion,
      disponibilidad: "disponible",
      categoria: "B",
      calificacionActual: null,
      destacado: false,
      obraId: null,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      integrantes: integrantes.slice(),
      evaluacion: null,
      historialObras: []
    };
    data.equipos.push(nuevo);

    integrantes.forEach(function (it) {
      var al = getAlumno(data, it.alumnoId);
      if (al) {
        al.equipoId = nuevo.id;
        al.rolEnEquipo = it.rol;
      }
    });

    saveData(data);
    return nuevo;
  }

  function asignarObraAEquipo(data, obraId, equipoId) {
    var obra = getObra(data, obraId);
    var equipo = getEquipo(data, equipoId);
    if (!obra || !equipo) return false;

    obra.equipoId = equipo.id;
    obra.estado = "en_curso";
    if (!obra.fechaInicio) obra.fechaInicio = new Date().toISOString().slice(0, 10);
    if (!obra.etapaActual || obra.etapaActual === "Sin iniciar") obra.etapaActual = "Preparación";
    if (obra.estadoRiesgo === "pendiente") obra.estadoRiesgo = "bajo";

    equipo.obraId = obra.id;
    equipo.disponibilidad = "en obra";
    if (equipo.historialObras.indexOf(obra.id) === -1) equipo.historialObras.push(obra.id);

    saveData(data);
    return true;
  }

  function getMapaObras(data) {
    return data.obras.map(function (o) {
      return { obra: o, equipo: o.equipoId ? getEquipo(data, o.equipoId) : null };
    });
  }

  /* API PÚBLICA ============================================ */
  window.CANTERA = {
    MODULOS_FORMATIVOS: MODULOS_FORMATIVOS,
    ETAPAS_OBRA: ETAPAS_OBRA,
    CRITERIOS_EVALUACION: CRITERIOS_EVALUACION,
    CRITERIOS_EXITO_PILOTO: CRITERIOS_EXITO_PILOTO,
    CATALOGO_FORMACIONES: CATALOGO_FORMACIONES,
    TRAMOS_DESEMBOLSO: TRAMOS_DESEMBOLSO,

    loadData: loadData,
    saveData: saveData,
    resetDemo: resetDemo,
    storageAvailable: storageAvailable,

    getAlumno: getAlumno,
    getEquipo: getEquipo,
    getObra: getObra,
    getEntidad: getEntidad,
    getTutor: getTutor,
    getBitacoraPorObra: getBitacoraPorObra,
    getIncidenciasPorObra: getIncidenciasPorObra,
    getAlumnosPorEquipo: getAlumnosPorEquipo,
    getEquipoDestacado: getEquipoDestacado,
    getAlumnoDestacado: getAlumnoDestacado,

    notaModulo: notaModulo,
    getCatalogoFormaciones: getCatalogoFormaciones,
    getSolicitud: getSolicitud,
    solicitarFormacion: solicitarFormacion,
    avanzarSolicitud: avanzarSolicitud,
    solicitudEstadoBadge: solicitudEstadoBadge,
    promedioNotas: promedioNotas,
    horasCompletadas: horasCompletadas,
    codigoCertificado: codigoCertificado,
    codigoCertificadoEspecializacion: codigoCertificadoEspecializacion,

    getTramosDesembolso: getTramosDesembolso,
    getTramo: getTramo,
    getDesembolso: getDesembolso,
    montoTramo: montoTramo,
    montoLiberado: montoLiberado,
    liberarDesembolso: liberarDesembolso,
    getDesembolsosPendientes: getDesembolsosPendientes,
    desembolsoEstadoBadge: desembolsoEstadoBadge,
    formatQ: formatQ,

    getTutorDeAlumno: getTutorDeAlumno,
    getAlumnosDeTutor: getAlumnosDeTutor,
    getHiloTutoria: getHiloTutoria,
    enviarMensajeTutoria: enviarMensajeTutoria,
    marcarHiloLeido: marcarHiloLeido,
    contarNoLeidosAlumno: contarNoLeidosAlumno,
    getDudasPendientesTutor: getDudasPendientesTutor,
    getMensajesDirectivos: getMensajesDirectivos,
    getNotificacionesTutor: getNotificacionesTutor,
    getDepartamentoDeAlumno: getDepartamentoDeAlumno,
    getPersonasPorDepartamento: getPersonasPorDepartamento,
    getConteoPorDepartamento: getConteoPorDepartamento,
    rolEquipoLabel: rolEquipoLabel,
    getAlumnosSinEquipo: getAlumnosSinEquipo,
    getEquiposDisponibles: getEquiposDisponibles,
    getObrasPorEstado: getObrasPorEstado,
    crearEquipo: crearEquipo,
    asignarObraAEquipo: asignarObraAEquipo,
    getMapaObras: getMapaObras,

    formatFecha: formatFecha,
    scoreCategoria: scoreCategoria,
    scoreTotal: scoreTotal,
    riesgoBadge: riesgoBadge,
    certificacionBadge: certificacionBadge,
    moduloEstadoLabel: moduloEstadoLabel,
    progresoFormativoPct: progresoFormativoPct,
    etapaIndex: etapaIndex
  };
})();
