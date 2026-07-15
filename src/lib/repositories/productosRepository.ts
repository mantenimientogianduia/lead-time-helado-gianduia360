import { getPool } from "@/lib/db/pool";
import { activo, FAMILIAS_INCLUIDAS, familiaIncluida, RUBROS_HELADO } from "./shared";

export async function contarProductosSinLeadtimePermitido(): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select count(*) as cant
     from g360.d_productos p
     where ${activo("p")}
       and rubro = any($1::text[])
       and (leadtime_permitido is null or leadtime_permitido <= 0)
       and ${familiaIncluida("p", 2)}`,
    [RUBROS_HELADO, FAMILIAS_INCLUIDAS]
  );
  return Number(rows[0]?.cant ?? 0);
}

export async function listarFamilias(): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `select distinct familia
     from g360.d_productos p
     where ${activo("p")}
       and rubro = any($1::text[])
       and familia = any($2::text[])
     order by familia`,
    [RUBROS_HELADO, FAMILIAS_INCLUIDAS]
  );
  return rows.map((fila) => fila.familia as string);
}
