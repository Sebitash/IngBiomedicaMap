import { COLORS } from "./theme";
import { UserType } from "./types/User";

// La estructura de las carreras de FIUBA varía bastante. Es muy poco uniforme
// Cada carrera tiene un json asociado donde se almacenan las materias

// Algunas carreras tienen orientaciones
// - Algunas carreras tienen orientaciones obligatorias (hay que elegirla y aprobar todas las materias que tienen) => `eligeOrientaciones`
// - Otras, tienen orientaciones que son solamente un conjunto de materias electivas (o sea, son una sugerencia, algo asi como "si te gusta termodinamica, cursate estas 3 materias")

// Algunas carreras te hacen elegir entre tesis y tpp, otras no => `creditos.findecarrera`
// Algunas carreras tienen materias que si o si necesitas para recibirte (practica profesional) => `creditos.materias`
// Algunas carreras tienen cosas que no son materias que si o si necesitas para recibirte (examen de ingles) => `creditos.checkbox`

// Informatica es la peor de todas. En base a las combinaciones de [orientacion,findecarrera], hay que hacer distinta cantidad de creditos de electivas

//// Acerca de cada json de las carreras
// En los jsons se tiene una lista de objetos donde cada uno representa una materia
//   de cada materia hay que especificar el id (el codigo), el nombre, la cantidad de creditos que da,
//   (en algunas materias, la cantidad de creditos minima requerida para cursarlas),
//   las correlativas que tiene (un string de ids separados por guiones),
//   el grupo al que pertenecen: son electivas? obligatorias? etc
// Se puede intentar armar ese json parseando los PDFs de la facultad, o a manopla
// Con el tiempo si hay alguna correlativa esta mal escrita, alguien se da cuenta y lo avisa

// Técnicamente este array no es de carreras, es de planes de estudio de cada carrera
// Pero el FIUBA Map arranco antes de que existan muchos planes para cada carrera, y
// ahora quedo que el usuario tiene una "carrera" asociada, aunque sea un plan, así que
// lo dejamos así

export const CARRERAS: UserType.Carrera[] = [
  {
    id: "biomedica-2022",
    link: "https://fi.uba.ar/grado/carreras/ingenieria-biomedica/plan-de-estudios",
    ano: 2022,
    graph: require("./data/biomedica-2022.json"),
    creditos: {
      total: 250,
      electivas: 16,
      checkbox: [
        {
          nombre: "Prueba de suficiencia",
          nombrecorto: "Suficiencia",
          color: "aprobadas",
          bg: COLORS.aprobadas[50],
        },
        {
          nombre: "Trabajo profesional",
          nombrecorto: "TP",
          color: "findecarrera",
          bg: COLORS.findecarrera[50],
        },
      ],
    },
  },
];

// Acá se define como se le presentan al usuario la lista de planes/carreras
// Todos los ids de `CARRERAS` tienen que estar usados acá
export const PLANES = [
  {
    nombre: "Ingeniería Biomédica",
    nombrecorto: "Biomédica",
    planes: ["biomedica-2022"],
  },
];
