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
    { id: "m1",  orden: 1,  nombre: "Inducción a Cantera Construcción", tipo: "teórico", horas: 2 },
    { id: "m2",  orden: 2,  nombre: "Seguridad básica en obra", tipo: "teórico", horas: 4 },
    { id: "m3",  orden: 3,  nombre: "Buenas prácticas de construcción", tipo: "teórico", horas: 4 },
    { id: "m4",  orden: 4,  nombre: "Uso y cuidado de herramientas", tipo: "práctico", horas: 6 },
    { id: "m5",  orden: 5,  nombre: "Mezcladoras, generadores, barrenos, puntales y andamios", tipo: "práctico", horas: 6 },
    { id: "m6",  orden: 6,  nombre: "Orden, limpieza y prevención de riesgos", tipo: "teórico", horas: 3 },
    { id: "m7",  orden: 7,  nombre: "Documentación digital y bitácora", tipo: "práctico", horas: 3 },
    { id: "m8",  orden: 8,  nombre: "Comunicación con supervisor, propietario y entidad financiera", tipo: "teórico", horas: 3 },
    { id: "m9",  orden: 9,  nombre: "Calidad de ejecución", tipo: "práctico", horas: 5 },
    { id: "m10", orden: 10, nombre: "Evaluación práctica final", tipo: "práctico", horas: 4 }
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

  /* 2. DATOS SEMILLA ====================================== */

  function progresoCompleto() {
    return MODULOS_FORMATIVOS.map(function (m) {
      return { moduloId: m.id, estado: "completado", fecha: "2026-04-15" };
    });
  }

  function progresoParcial(hastaOrden, estadoActual) {
    return MODULOS_FORMATIVOS.map(function (m) {
      if (m.orden < hastaOrden) return { moduloId: m.id, estado: "completado", fecha: "2026-05-01" };
      if (m.orden === hastaOrden) return { moduloId: m.id, estado: estadoActual || "en_curso", fecha: null };
      return { moduloId: m.id, estado: "pendiente", fecha: null };
    });
  }

  var SEED = {
    entidadesFinancieras: [
      { id: "ef-01", nombre: "Banco Confianza Rural, S.A.", tipo: "banco", contacto: "Departamento de Vivienda Social", fechaAlianza: "2026-03-01" },
      { id: "ef-02", nombre: "Fundación Vivienda Digna", tipo: "aliado", contacto: "Coordinación de Proyectos", fechaAlianza: "2026-04-12" }
    ],

    alumnos: [
      {
        id: "al-01", nombre: "Juan Carlos Morales Xoc", edad: 26, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "4 años como albañil informal", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0101",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-alfa", rolEnEquipo: "jefe", destacado: true,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-02", nombre: "María Fernanda Us", edad: 24, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0102",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-alfa", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-03", nombre: "Pedro Tzul", edad: 22, municipio: "San Juan Sacatepéquez",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0103",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-alfa", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-04", nombre: "Carlos Ramírez", edad: 29, municipio: "Mixco",
        experienciaPrevia: "2 años en obra gris", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "intermedio", interesConstruccion: "medio", telefono: "5555-0104",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-alfa", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-05", nombre: "Marvin Osorio", edad: 31, municipio: "Chimaltenango",
        experienciaPrevia: "5 años como maestro de obra", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0105",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-beta", rolEnEquipo: "jefe", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-06", nombre: "Ana Lucía Pérez", edad: 27, municipio: "Chimaltenango",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0106",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-beta", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-07", nombre: "Diego Hernández", edad: 23, municipio: "Chimaltenango",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "parcial", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "medio", telefono: "5555-0107",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-beta", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-08", nombre: "Sara Cabrera", edad: 25, municipio: "Chimaltenango",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0108",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "ayudante", equipoId: "eq-beta", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-09", nombre: "Estuardo Chali", edad: 33, municipio: "Santa Apolonia",
        experienciaPrevia: "6 años de experiencia informal", disponibilidad: "completa", rolDeseado: "jefe de grupo",
        nivelExperiencia: "avanzado", interesConstruccion: "alto", telefono: "5555-0109",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "jefe", equipoId: "eq-gamma", rolEnEquipo: "jefe", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-10", nombre: "Wendy Sical", edad: 28, municipio: "Santa Apolonia",
        experienciaPrevia: "1 año en acabados", disponibilidad: "completa", rolDeseado: "asistente",
        nivelExperiencia: "intermedio", interesConstruccion: "alto", telefono: "5555-0110",
        estadoDiagnostico: "completado", estadoFormacion: "completado", estadoCertificacion: "certificado",
        potencial: "asistente", equipoId: "eq-gamma", rolEnEquipo: "asistente", destacado: false,
        progresoModulos: progresoCompleto()
      },
      {
        id: "al-11", nombre: "Byron Coy", edad: 20, municipio: "Santa Apolonia",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "medio", telefono: "5555-0111",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "necesita_refuerzo",
        potencial: "ayudante", equipoId: "eq-gamma", rolEnEquipo: "ayudante", destacado: false,
        progresoModulos: progresoParcial(7, "en_curso")
      },
      {
        id: "al-12", nombre: "Elvia Tzoc", edad: 19, municipio: "San Martín Jilotepeque",
        experienciaPrevia: "Sin experiencia previa", disponibilidad: "completa", rolDeseado: "ayudante",
        nivelExperiencia: "inicial", interesConstruccion: "alto", telefono: "5555-0112",
        estadoDiagnostico: "completado", estadoFormacion: "en_curso", estadoCertificacion: "en_formacion",
        potencial: "ayudante", equipoId: null, rolEnEquipo: null, destacado: false,
        progresoModulos: progresoParcial(5, "en_curso")
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
      }
    ],

    obras: [
      {
        id: "ob-001", codigo: "OB-2026-001", ubicacion: "San Juan Sacatepéquez, Guatemala",
        propietario: "Familia López Ramírez", entidadFinancieraId: "ef-01", equipoId: "eq-alfa",
        fechaInicio: "2026-05-04", fechaEstimadaEntrega: "2026-09-15", etapaActual: "Acabados",
        supervisor: "Ing. Rodrigo Paz", tipoVivienda: "Vivienda unifamiliar de 65 m²",
        estadoRiesgo: "bajo", porcentajeAvance: 82, destacada: true
      },
      {
        id: "ob-002", codigo: "OB-2026-002", ubicacion: "Chimaltenango, Guatemala",
        propietario: "Familia Ramírez Coy", entidadFinancieraId: "ef-01", equipoId: "eq-beta",
        fechaInicio: "2026-06-01", fechaEstimadaEntrega: "2026-10-30", etapaActual: "Instalaciones",
        supervisor: "Ing. Fernando Ixchop", tipoVivienda: "Vivienda unifamiliar de 72 m²",
        estadoRiesgo: "medio", porcentajeAvance: 55, destacada: false
      },
      {
        id: "ob-003", codigo: "OB-2026-003", ubicacion: "Santa Apolonia, Chimaltenango",
        propietario: "Familia Gómez Sical", entidadFinancieraId: "ef-02", equipoId: "eq-gamma",
        fechaInicio: "2026-06-20", fechaEstimadaEntrega: "2026-11-10", etapaActual: "Cimentación",
        supervisor: "Ing. Marta Xoc", tipoVivienda: "Vivienda unifamiliar de 58 m²",
        estadoRiesgo: "alto", porcentajeAvance: 25, destacada: false
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
    ]
  };

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
      return JSON.parse(raw);
    } catch (e) {
      var fallback = cloneSeed();
      saveData(fallback);
      return fallback;
    }
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

  /* API PÚBLICA ============================================ */
  window.CANTERA = {
    MODULOS_FORMATIVOS: MODULOS_FORMATIVOS,
    ETAPAS_OBRA: ETAPAS_OBRA,
    CRITERIOS_EVALUACION: CRITERIOS_EVALUACION,
    CRITERIOS_EXITO_PILOTO: CRITERIOS_EXITO_PILOTO,

    loadData: loadData,
    saveData: saveData,
    resetDemo: resetDemo,
    storageAvailable: storageAvailable,

    getAlumno: getAlumno,
    getEquipo: getEquipo,
    getObra: getObra,
    getEntidad: getEntidad,
    getBitacoraPorObra: getBitacoraPorObra,
    getIncidenciasPorObra: getIncidenciasPorObra,
    getAlumnosPorEquipo: getAlumnosPorEquipo,
    getEquipoDestacado: getEquipoDestacado,
    getAlumnoDestacado: getAlumnoDestacado,

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
