import * as C from "./constants";
import { UserType } from "./types/User";
import { GoogleSheetAPI } from "./types/externalAPI";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const HAS_SUPABASE = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const supabase = HAS_SUPABASE
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null;

type LocalUser = {
  allLogins: UserType.CarreraInfo[];
  maps: UserType.Map[];
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

const updateLocalUser = (
  padron: string,
  updater: (current: LocalUser) => LocalUser,
) => {
  const db = readLocalDb();
  const current = db.users[padron] || { allLogins: [], maps: [] };
  db.users[padron] = updater(current);
  writeLocalDb(db);
};

export const getLocalUserData = (padron: string) => {
  const db = readLocalDb();
  return db.users[padron] || null;
};

export const getUserLogins = async (padron: string) => {
  if (C.OFFLINE) {
    const local = getLocalUserData(padron);
    return local?.allLogins || null;
  }

  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("user_logins")
      .select("carreraid, orientacionid, findecarreraid")
      .eq("padron", padron);

    if (error || !data || data.length === 0) return null;

    return data.map((row) => ({
      carreraid: row.carreraid as string,
      orientacionid: (row.orientacionid as string | null) || undefined,
      findecarreraid: (row.findecarreraid as string | null) || undefined,
    }));
  }

  const padrones = await fetch(
    `${C.SPREADSHEET}/${C.SHEETS.user}!B:B?majorDimension=COLUMNS&key=${C.KEY}`,
  )
    .then((res) => res.json())
    .then((res: GoogleSheetAPI.UserValueRange) =>
      !res.error ? res.values[0] : null,
    );

  if (!padrones) return null;

  const indexes: number[] = [];
  let j = -1;
  while ((j = padrones.indexOf(padron, j + 1)) !== -1) {
    indexes.push(j);
  }

  if (!indexes.length) return null;

  const ranges = indexes.map(
    (index) => `&ranges=${C.SHEETS.user}!${index + 1}:${index + 1}`,
  );

  const data = await fetch(
    `${C.SPREADSHEET}:batchGet?key=${C.KEY}${ranges.join("")}`,
  ).then((res) =>
    res.json().then((res: GoogleSheetAPI.BatchGet) => res.valueRanges),
  );

  const allLogins: UserType.CarreraInfo[] = data.map((d) => ({
    carreraid: d.values[0][2],
    orientacionid: d.values[0][3],
    findecarreraid: d.values[0][4],
  }));

  return allLogins;
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
    updateLocalUser(user.padron, (current) => {
      const newAllLogins = current.allLogins.filter(
        (l) => l.carreraid !== user.carrera.id,
      );
      newAllLogins.push({
        carreraid: user.carrera.id,
        orientacionid: user.orientacion?.nombre,
        findecarreraid: user.finDeCarrera?.id,
      });
      return {
        ...current,
        allLogins: newAllLogins,
      };
    });
    return;
  }

  if (HAS_SUPABASE && supabase) {
    await supabase.from("user_logins").upsert(
      {
        padron: user.padron,
        carreraid: user.carrera.id,
        orientacionid: user.orientacion?.nombre || null,
        findecarreraid: user.finDeCarrera?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "padron,carreraid" },
    );
    return;
  }
  const formData = new FormData();
  const padron = user.padron;
  const carreraid = user.carrera.id;
  const orientacionid = user.orientacion?.nombre;
  const findecarreraid = user.finDeCarrera?.id;
  formData.append(`${C.USER_FORM_ENTRIES.padron}`, padron);
  formData.append(`${C.USER_FORM_ENTRIES.carrera}`, carreraid);
  formData.append(`${C.USER_FORM_ENTRIES.orientacion}`, orientacionid || "");
  formData.append(`${C.USER_FORM_ENTRIES.finDeCarrera}`, findecarreraid || "");
  return fetch(`${C.USER_FORM}`, {
    body: formData,
    method: "POST",
    mode: "no-cors",
  });
};

// Le pega al form que almacena [padron,carrera,map]
// el map es un JSON stringifeado que tiene [materias, optativas, aplazos, checkboxes]
export const postGraph = async (
  user: UserType.Info,
  map: UserType.CarreraMap,
) => {
  if (C.OFFLINE) {
    updateLocalUser(user.padron, (current) => {
      const newMaps = current.maps.filter(
        (l) => l.carreraid !== user.carrera.id,
      );
      newMaps.push({
        carreraid: user.carrera.id,
        map,
      });
      return {
        ...current,
        maps: newMaps,
      };
    });
    return;
  }

  if (HAS_SUPABASE && supabase) {
    await supabase.from("user_maps").upsert(
      {
        padron: user.padron,
        carreraid: user.carrera.id,
        map,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "padron,carreraid" },
    );
    return;
  }
  const formData = new FormData();
  formData.append(`${C.GRAPH_FORM_ENTRIES.padron}`, user.padron);
  formData.append(`${C.GRAPH_FORM_ENTRIES.carrera}`, user.carrera.id);
  formData.append(`${C.GRAPH_FORM_ENTRIES.map}`, JSON.stringify(map));
  return fetch(`${C.GRAPH_FORM}`, {
    body: formData,
    method: "POST",
    mode: "no-cors",
  });
};

// Consigue todos los mapas asociados a un padron, de todas las carreras
export const getGraphs = async (padron: string) => {
  if (C.OFFLINE) {
    const local = getLocalUserData(padron);
    return local?.maps || [];
  }

  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from("user_maps")
      .select("carreraid, map")
      .eq("padron", padron);

    if (error || !data) return [];

    return data.map((row) => ({
      carreraid: row.carreraid as string,
      map:
        typeof row.map === "string"
          ? (JSON.parse(row.map) as UserType.CarreraMap)
          : (row.map as UserType.CarreraMap),
    })) as UserType.Map[];
  }
  const data = await fetch(
    `${C.SPREADSHEET}/${C.SHEETS.registros}!B:D?majorDimension=COLUMNS&key=${C.KEY}`,
  )
    .then((res) => res.json())
    .then((res: GoogleSheetAPI.RegistrosValueRange) =>
      !res.error ? res.values : null,
    );
  if (!data) return;

  const [padrones, carreras, maps] = data;
  const indexes: number[] = [];
  let j = -1;
  while ((j = padrones.indexOf(padron, j + 1)) !== -1) {
    indexes.push(j);
  }

  const allLogins: { carreraid: string; map: string }[] = [];
  for (let i = 0; i < indexes.length; i++) {
    allLogins.push({
      carreraid: carreras[indexes[i]],
      map: maps[indexes[i]],
    });
  }

  return allLogins.map((l) => ({
    carreraid: l.carreraid,
    map: JSON.parse(l.map),
  })) as UserType.Map[];
};
