import * as C from "./constants";
import { UserType } from "./types/User";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const HAS_SUPABASE = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

console.log('[dbutils] Supabase config:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  HAS_SUPABASE,
  url: SUPABASE_URL,
});

const supabase = HAS_SUPABASE
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null;

type LocalUserState = {
  aprobadas: { id: string; nota: number }[];
  regularizadas: string[];
  no_aprobadas: string[];
  ingles: boolean;
  trabajo_profesional: boolean;
};

type LocalUser = {
  state: LocalUserState;
};

type LocalDb = {
  users: Record<string, LocalUser>;
};

const LOCAL_DB_KEY = "fiuba-map:local-db";

const readLocalDb = (): LocalDb => {
  if (typeof window === "undefined") return { users: {} };
  const raw = window.localStorage.getItem(LOCAL_DB_KEY);
  if (!raw) return { users: {} };
  try {
    const parsed = JSON.parse(raw) as LocalDb;
    if (!parsed || !parsed.users) return { users: {} };
    return parsed;
  } catch {
    return { users: {} };
  }
};

const writeLocalDb = (db: LocalDb) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
};

const DEFAULT_LOCAL_STATE: LocalUserState = {
  aprobadas: [],
  regularizadas: [],
  no_aprobadas: [],
  ingles: false,
  trabajo_profesional: false,
};

const updateLocalUser = (
  padron: string,
  updater: (current: LocalUser) => LocalUser,
) => {
  const db = readLocalDb();
  const current = db.users[padron] || { state: { ...DEFAULT_LOCAL_STATE } };
  db.users[padron] = updater(current);
  writeLocalDb(db);
};

export const getLocalUserData = (padron: string) => {
  const db = readLocalDb();
  return db.users[padron] || null;
};

const buildStateFromMap = (
  map: UserType.CarreraMap,
): LocalUserState => {
  const aprobadas: { id: string; nota: number }[] = [];
  const regularizadas: string[] = [];
  const no_aprobadas: string[] = [];
  const seen = new Set<string>();

  map.materias.forEach((m) => {
    if (!m?.id) return;
    if (m.nota >= 0) {
      aprobadas.push({ id: m.id, nota: m.nota });
      seen.add(m.id);
    }
  });

  map.materias.forEach((m) => {
    if (!m?.id || seen.has(m.id)) return;
    if (m.nota === -1) {
      regularizadas.push(m.id);
      seen.add(m.id);
    }
  });

  map.materias.forEach((m) => {
    if (!m?.id || seen.has(m.id)) return;
    no_aprobadas.push(m.id);
  });

  const checkboxes = map.checkboxes ?? [];
  const ingles =
    checkboxes.includes("Ingles") ||
    checkboxes.includes("Prueba de suficiencia");
  const trabajo_profesional = checkboxes.includes("Trabajo profesional");

  return {
    aprobadas,
    regularizadas,
    no_aprobadas,
    ingles,
    trabajo_profesional,
  };
};

const buildMapFromState = (state: LocalUserState): UserType.CarreraMap => {
  const materias: UserType.CarreraMap["materias"] = [];
  const seen = new Set<string>();

  state.aprobadas.forEach((m) => {
    materias.push({ id: m.id, nota: m.nota } as UserType.CarreraMap["materias"][number]);
    seen.add(m.id);
  });

  state.regularizadas.forEach((id) => {
    if (seen.has(id)) return;
    materias.push({ id, nota: -1 } as UserType.CarreraMap["materias"][number]);
    seen.add(id);
  });

  state.no_aprobadas.forEach((id) => {
    if (seen.has(id)) return;
    materias.push({ id, nota: -3 } as UserType.CarreraMap["materias"][number]);
    seen.add(id);
  });

  const checkboxes: string[] = [];
  if (state.ingles) checkboxes.push("Prueba de suficiencia");
  if (state.trabajo_profesional) checkboxes.push("Trabajo profesional");

  return {
    materias,
    checkboxes: checkboxes.length ? checkboxes : undefined,
  };
};

export const getUserLogins = async (padron: string) => {
  console.log('[getUserLogins] Checking for user:', padron);
  
  if (C.OFFLINE) {
    const local = getLocalUserData(padron);
    return local?.state
      ? [
          {
            carreraid: "biomedica-2022",
            orientacionid: undefined,
            findecarreraid: undefined,
          },
        ]
      : null;
  }

  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("user_state")
      .select("padron")
      .eq("padron", padron)
      .limit(1);

    console.log('[getUserLogins] Supabase query result:', { data, error });

    // Si el usuario existe (tiene datos guardados), devolvemos su carrera
    // Si NO existe, también devolvemos la carrera pero sin crear la fila todavía
    // (la fila se creará cuando el usuario presione "Guardar" por primera vez)
    return [
      {
        carreraid: "biomedica-2022",
        orientacionid: undefined,
        findecarreraid: undefined,
      },
    ];
  }

  return null;
};

// Le pega al form de bugs
export const submitBug = async (user: UserType.Info, bug: string) => {
  if (!bug) return;
  if (C.OFFLINE || HAS_SUPABASE) return;
  const formData = new FormData();
  const padron = user.padron;
  const carreraid = user.carrera.id;
  const orientacionid = user.orientacion?.nombre;
  const findecarreraid = user.finDeCarrera?.id;
  formData.append(`${C.BUGS_FORM_ENTRIES.padron}`, padron);
  formData.append(`${C.BUGS_FORM_ENTRIES.carrera}`, carreraid);
  formData.append(`${C.BUGS_FORM_ENTRIES.orientacion}`, orientacionid || "");
  formData.append(`${C.BUGS_FORM_ENTRIES.finDeCarrera}`, findecarreraid || "");
  formData.append(`${C.BUGS_FORM_ENTRIES.bug}`, bug || "");
  return fetch(`${C.BUGS_FORM}`, {
    body: formData,
    method: "POST",
    mode: "no-cors",
  });
};

// Le pega al form que almacena [padron,carrera,orientacion,findecarrera]
export const postUser = async (user: UserType.Info) => {
  if (C.OFFLINE) {
    updateLocalUser(user.padron, (current) => ({
      ...current,
      state: current.state || { ...DEFAULT_LOCAL_STATE },
    }));
    return;
  }

  if (HAS_SUPABASE && supabase) {
    await supabase.from("user_state").upsert(
      {
        padron: user.padron,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "padron" },
    );
    return;
  }
  return;
};

// Le pega al form que almacena [padron,carrera,map]
// el map es un JSON stringifeado que tiene [materias, optativas, aplazos, checkboxes]
export const postGraph = async (
  user: UserType.Info,
  map: UserType.CarreraMap,
) => {
  if (C.OFFLINE) {
    updateLocalUser(user.padron, (current) => ({
      ...current,
      state: buildStateFromMap(map),
    }));
    return;
  }

  if (HAS_SUPABASE && supabase) {
    const state = buildStateFromMap(map);
    console.log('[postGraph] Saving to Supabase:', {
      padron: user.padron,
      state,
    });
    
    const { data, error } = await supabase.from("user_state").upsert(
      {
        padron: user.padron,
        aprobadas: state.aprobadas,
        regularizadas: state.regularizadas,
        no_aprobadas: state.no_aprobadas,
        ingles: state.ingles,
        trabajo_profesional: state.trabajo_profesional,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "padron" },
    );
    
    if (error) {
      console.error('[postGraph] Error saving to Supabase:', error);
    } else {
      console.log('[postGraph] Successfully saved to Supabase:', data);
    }
    return;
  }

  return;
};

// Consigue todos los mapas asociados a un padron, de todas las carreras
export const getGraphs = async (padron: string) => {
  console.log('[getGraphs] Loading graphs for:', padron);
  
  if (C.OFFLINE) {
    const local = getLocalUserData(padron);
    if (!local?.state) return [];
    return [
      {
        carreraid: "biomedica-2022",
        map: buildMapFromState(local.state),
      },
    ] as UserType.Map[];
  }

  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("user_state")
      .select(
        "aprobadas, regularizadas, no_aprobadas, ingles, trabajo_profesional",
      )
      .eq("padron", padron)
      .limit(1);
    
    console.log('[getGraphs] Supabase query result:', { data, error });

    if (error || !data || data.length === 0) return [];

    const state: LocalUserState = {
      aprobadas: (data[0].aprobadas as { id: string; nota: number }[]) || [],
      regularizadas: (data[0].regularizadas as string[]) || [],
      no_aprobadas: (data[0].no_aprobadas as string[]) || [],
      ingles: !!data[0].ingles,
      trabajo_profesional: !!data[0].trabajo_profesional,
    };

    return [
      {
        carreraid: "biomedica-2022",
        map: buildMapFromState(state),
      },
    ] as UserType.Map[];
  }

  return [];
};
