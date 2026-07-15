# Modelo de datos — verificación en vivo (Fase 0)

Verificado el 2026-07-15 contra `gianduia360-bbdd` (esquema `g360`) con `scripts/verificar-esquema.ts`.
La base es productiva y viva: algunos conteos (ej. cantidad de productos por rubro) cambiaron entre
corridas de pocos minutos porque hay operadores editando datos en simultáneo. Los porcentajes de
cobertura son estables como orden de magnitud, no como cifra exacta congelada.

## 1. Columnas confirmadas (`information_schema.columns`)

Confirma exactamente lo asumido en el plan para `f_detalles_ventas`, `f_ventas`, `d_productos` y
`f_partidas_stock`, con dos hallazgos que corrigen supuestos previos:

- **`f_partidas_op` NO tiene columna `id_partistock`.** Sus columnas reales son: `id_parti_op` (PK),
  `id_prod`, `id_dep`, `presentacion`, `lote`, `venc`, `partida`, `id_op`, `qr`, `ts_creacion`,
  `id_user`, `borrado`, `estado`, `costo_unit`, `fecha_fab`. La vía de resolución de fecha de
  fabricación por `id_partistock` que contemplaba el plan **no existe** — se descarta.
- `d_productos.leadtime_permitido` es `integer`, `subrubro` y `familia` sí existen como columnas
  reales (confirmado, no solo por CSVs históricos).

## 2. Valores reales de `rubro`

`PRODUCTO TERMINADO HELADO` y `PRODUCTO TERMINADO PINTAS` existen tal cual, sin plural ni variantes
de espaciado — se usan como filtro fijo (`RUBROS_HELADO` en `shared.ts`). Conteos ~205-219 (HELADO)
y 4 (PINTAS), fluctuando por ser base viva.

## 3. `familia` / `subrubro` dentro de esos rubros

HELADO: `BACHA`, `BALDE`, `MIX`, `SIEMBRAS`, `AXION LOG`, `PRUEBA`, `TORTA BAR`, y 1 producto con
`familia` nula. PINTAS: `familia='PINTAS'`, `subrubro='PINTAS'` (los 4 productos). El filtro de
familia en la UI debe tolerar `familia` nula (mostrar como "Sin familia").

## 4. Cobertura de `lote_fabricacion` en ventas (últimos 12 meses, rubro filtrado)

**99.9% de cobertura** (42.808 de 42.842 líneas). Confirma que `f_detalles_ventas.lote_fabricacion`
es una fuente sólida y casi completa para el lead time de ventas — decisión del usuario de usarla
como fuente primaria queda validada con datos reales.

## 5. Resolución de fecha de fabricación en cámara (depósito 8)

- La vía por `id_partistock` no existe (ver punto 1).
- **Hallazgo crítico de bug propio**: el valor real de `f_partidas_stock.origen` para producción es
  **`'Producción'` (con tilde)**, no `'Produccion'`. Filtrar sin tilde da 0 resultados — se corrigió
  en el script y debe usarse la forma con tilde en todo el código (`ORIGEN_PRODUCCION` en
  `shared.ts`).
- Con el filtro correcto: **hoy el 100% de las partidas activas en depósito 8** (helado/pintas,
  1.520 partidas) tiene `origen='Producción'` — no hay actualmente stock en cámara por repack,
  ajuste ni transferencia.
- Match por `lote + id_prod` contra `f_partidas_op.fecha_fab` (no nulo, activo): **1.418 de 1.520
  partidas resuelven (93,3%)**. El 6,7% restante cae al fallback `ts_ingreso`.
- **Colisiones**: 45 combinaciones de `id_prod + lote` tienen más de una fila en `f_partidas_op`
  con `fecha_fab` no nulo. Bajo volumen relativo. Regla de desempate elegida en el repositorio:
  tomar la fila con `fecha_fab` más reciente (`order by fecha_fab desc, id_parti_op desc limit 1`)
  — se documenta como supuesto, no se marca `confiable:false` porque el dato en sí es real
  producción, solo hay ambigüedad de cuál partida específica es.

**Decisión final de cascada** (2 niveles reales, no 3 como preveía el plan original):
1. `produccion_lote_id_prod`: match `f_partidas_stock.lote = f_partidas_op.lote` y
   `f_partidas_stock.id_prod = f_partidas_op.id_prod`, `fecha_fab` no nulo, desempate por
   `fecha_fab desc`. `confiable: true`.
2. `ts_ingreso`: fallback. `confiable: false`.
3. `sin_dato`: si tampoco hay `ts_ingreso` (no debería ocurrir en la práctica, es `NOT NULL` de
   hecho en los datos vistos).

## 6. Distribución de `leadtime_permitido`

De ~209-223 productos helado/pintas: 14 con `NULL`, 0 con `0`, el resto (>190) con valor positivo
definido. En la práctica casi no hay que preocuparse por el caso `0` (no aparece hoy), pero el
código lo sigue tratando como "sin parámetro" por seguridad ante cambios futuros de datos.

## 7. Huérfanos de `id_venta` y notas de crédito

Sobre 42.842 líneas de venta (12 meses, rubro filtrado): 34 sin cabecera en `f_ventas` (0,08%,
bajo, tolerable con `LEFT JOIN` + flag `sin_cabecera_venta`), 55 notas de crédito (`nc=true`,
0,13%, excluidas del histórico de ventas real por defecto).

## 8. Valores reales de `f_ventas.estado`

Confirmados exactamente los 4 esperados, sin valores inesperados: `Despachado` (1282),
`Anulado` (77), `Finalizado` (59), `Iniciado` (20). Filtro de venta real: incluir `Despachado` y
`Finalizado`, excluir `Anulado` e `Iniciado` — sin cambios respecto al plan original.

## 9. Validación de `ventasRepository` contra datos reales (ene-jun 2026)

Cobertura global 99,9% confirmada en el rango real. Se detectó un problema de calidad de datos:

- La familia **`PRUEBA`** (literalmente "prueba/test") tiene lead times promedio de ~10.265 días y
  p90 de ~20.527 días (décadas) — son productos de prueba con fechas absurdas, no ventas reales.
  Distorsionan fuertemente el **promedio** de algunos meses (ej. enero 2026 muestra promedio de 194
  días con mediana de solo 7 días en el mismo mes). La mediana y el p90 por mes/familia, que ya
  estaban en el diseño, absorben este ruido razonablemente — se prioriza su lectura sobre el
  promedio en la UI. No se excluye la familia `PRUEBA` automáticamente porque es una decisión de
  negocio, no técnica; queda documentada para que el usuario decida si se debe filtrar.
- La familia `BALDE` también muestra brecha promedio (227) vs mediana (6) por outliers puntuales,
  mismo patrón, menor magnitud.

## 10. Validación de `camaraRepository` contra datos reales (depósito 8, hoy)

1.520 partidas activas: 1.418 resuelven `fecha_fab` vía producción (93,3%), 102 caen al fallback
`ts_ingreso` (6,7%) — coincide con lo medido en Fase 0. Riesgo: 288 críticas, 82 en riesgo, 1.080 ok,
70 sin parámetro (suman 1.520).

**Hallazgo adicional**: el fallback a `ts_ingreso` no está distribuido parejo — se concentra
fuertemente en las partidas **más antiguas** (justo las que hoy aparecen como críticas al inicio de
la lista, ordenada por `ts_ingreso asc`). Hipótesis más probable: las órdenes de producción muy
viejas terminan con `borrado` activo o se depuran con el tiempo, así que el match por `lote+id_prod`
contra `f_partidas_op` deja de encontrarlas aunque la partida de stock siga viva en cámara. No cambia
el cálculo (`ts_ingreso` sigue siendo un dato real y la UI ya marca esas filas como "estimado"), pero
implica que las partidas más viejas —las que más importa clasificar bien— son también las que menos
confianza tienen en su fecha de fabricación. Documentado, no oculto, en la UI de Cámara.

## Ajustes al plan original que surgen de esta verificación

- Eliminada la vía de resolución por `id_partistock` en `fechaFabricacion.ts` (columna inexistente)
  — cascada de 3 pasos en vez de 4, dominio y tests actualizados.
- Corregido el valor de `origen` a `'Producción'` (con tilde) en todo query/constante que lo use.
- La cobertura de la vía de producción en cámara es alta (93,3%), mejor de lo previsto — se puede
  mostrar `fuenteFecha` como dato principal de confianza en la UI, no solo como detalle secundario.
