/**
 * Fase 0 — verificacion de esquema en vivo (read-only).
 * Corre: npm run verificar-esquema
 * Vuelca resultados a stdout; documentar manualmente en docs/modelo-datos.md.
 */
import { getPool } from "../src/lib/db/pool";

const RUBROS_HELADO = ["PRODUCTO TERMINADO HELADO", "PRODUCTO TERMINADO PINTAS"];
const TABLAS = ["f_detalles_ventas", "f_ventas", "d_productos", "f_partidas_stock", "f_partidas_op"];

async function main() {
  const pool = getPool();

  console.log("\n=== 1. Tipos de columna (information_schema.columns) ===");
  const columnas = await pool.query(
    `select table_name, column_name, data_type, is_nullable
     from information_schema.columns
     where table_schema = 'g360' and table_name = any($1::text[])
     order by table_name, ordinal_position`,
    [TABLAS]
  );
  for (const tabla of TABLAS) {
    console.log(`\n-- g360.${tabla} --`);
    for (const fila of columnas.rows.filter((r) => r.table_name === tabla)) {
      console.log(`${fila.column_name}\t${fila.data_type}\tnullable=${fila.is_nullable}`);
    }
  }

  console.log("\n=== 2. Valores reales de rubro en d_productos ===");
  const rubros = await pool.query(
    `select rubro, count(*) as cant
     from g360.d_productos
     where coalesce(btrim(borrado::text), '') = ''
     group by rubro
     order by cant desc`
  );
  console.table(rubros.rows);

  console.log("\n=== 3. familia/subrubro dentro de los rubros helado ===");
  const familias = await pool.query(
    `select rubro, familia, subrubro, count(*) as cant
     from g360.d_productos
     where coalesce(btrim(borrado::text), '') = ''
       and rubro = any($1::text[])
     group by rubro, familia, subrubro
     order by rubro, cant desc`,
    [RUBROS_HELADO]
  );
  console.table(familias.rows);

  console.log("\n=== 4. Cobertura de lote_fabricacion (ultimos 12 meses, rubro filtrado) ===");
  const coberturaLoteFab = await pool.query(
    `select
       count(*) as total_lineas,
       count(dv.lote_fabricacion) as con_fecha_fab,
       round(100.0 * count(dv.lote_fabricacion) / nullif(count(*), 0), 1) as pct_cobertura
     from g360.f_detalles_ventas dv
     join g360.d_productos p on p.id_prod = dv.id_prod
     where coalesce(btrim(dv.borrado::text), '') = ''
       and coalesce(btrim(p.borrado::text), '') = ''
       and p.rubro = any($1::text[])
       and dv.fecha_venta >= (current_date - interval '12 months')`,
    [RUBROS_HELADO]
  );
  console.table(coberturaLoteFab.rows);

  console.log(
    "\n=== 5a. NOTA: f_partidas_op NO tiene columna id_partistock (confirmado por information_schema arriba) ==="
  );
  console.log("Se descarta esa via; se mide directamente la via por lote+id_prod (5b).");

  console.log("\n=== 5b. Cobertura por lote+id_prod (deposito 8, origen=Produccion) y deteccion de colisiones ===");
  const coberturaLote = await pool.query(
    `select
       count(*) as total,
       count(po2.id_parti_op) as con_match_lote_prod
     from g360.f_partidas_stock ps
     join g360.d_productos p on p.id_prod = ps.id_prod
     left join lateral (
       select po.id_parti_op
       from g360.f_partidas_op po
       where po.id_prod = ps.id_prod
         and po.lote = ps.lote
         and coalesce(btrim(po.borrado::text), '') = ''
         and po.fecha_fab is not null
       limit 1
     ) po2 on true
     where coalesce(btrim(ps.borrado::text), '') = ''
       and ps.id_dep = 8
       and p.rubro = any($1::text[])
       and ps.origen = 'Producción'`,
    [RUBROS_HELADO]
  );
  console.table(coberturaLote.rows);

  const colisiones = await pool.query(
    `select count(*) as combinaciones_con_mas_de_una_fila from (
       select id_prod, lote, count(*) as filas
       from g360.f_partidas_op
       where coalesce(btrim(borrado::text), '') = '' and fecha_fab is not null
       group by id_prod, lote
       having count(*) > 1
     ) t`
  );
  console.table(colisiones.rows);

  console.log("\n=== 6. Distribucion de leadtime_permitido ===");
  const leadtimePermitido = await pool.query(
    `select
       count(*) as total_productos,
       count(*) filter (where leadtime_permitido is null) as sin_valor,
       count(*) filter (where leadtime_permitido = 0) as valor_cero,
       count(*) filter (where leadtime_permitido > 0) as con_valor
     from g360.d_productos
     where coalesce(btrim(borrado::text), '') = ''
       and rubro = any($1::text[])`,
    [RUBROS_HELADO]
  );
  console.table(leadtimePermitido.rows);

  console.log("\n=== 7. Huerfanos id_venta y notas de credito (ultimos 12 meses, rubro filtrado) ===");
  const huerfanos = await pool.query(
    `select
       count(*) filter (where v.id_venta is null) as sin_cabecera,
       count(*) filter (where dv.nc is true) as notas_credito,
       count(*) as total
     from g360.f_detalles_ventas dv
     left join g360.f_ventas v on v.id_venta = dv.id_venta
     join g360.d_productos p on p.id_prod = dv.id_prod
     where coalesce(btrim(dv.borrado::text), '') = ''
       and p.rubro = any($1::text[])
       and dv.fecha_venta >= (current_date - interval '12 months')`,
    [RUBROS_HELADO]
  );
  console.table(huerfanos.rows);

  console.log("\n=== 8. Valores reales de f_ventas.estado ===");
  const estados = await pool.query(
    `select estado, count(*) from g360.f_ventas group by estado order by count(*) desc`
  );
  console.table(estados.rows);

  await pool.end();
}

main().catch((err) => {
  console.error("Fallo la verificacion de esquema:", err);
  process.exit(1);
});
