# Supuestos y limitaciones conocidas

## Alcance

Solo `d_productos.rubro` en `PRODUCTO TERMINADO HELADO` y `PRODUCTO TERMINADO PINTAS` (valores
reales confirmados en vivo, ver `docs/modelo-datos.md`).

Dentro de esos rubros, el análisis se restringe además a una lista de inclusión de familias por
decisión explícita del usuario: solo `BACHA`, `BALDE` y `PINTAS` (constante `FAMILIAS_INCLUIDAS` en
`src/lib/repositories/shared.ts`). Cualquier otra familia (`MIX`, `SIEMBRAS`, `PRUEBA`, `MERIENDA`,
`AXION LOG`, `TORTA BAR`, productos con familia nula, etc.) queda fuera de: histórico de ventas,
cámara en vivo, lista de familias del filtro y conteo de productos sin `leadtime_permitido`. A
diferencia del modelo anterior (lista de exclusión), esto es una lista cerrada: solo entran esas
tres familias exactas, nada más.

## Lead time de ventas (histórico)

- Fuente de "fecha de fabricación": `f_detalles_ventas.lote_fabricacion`. Cobertura real medida:
  99,9%. El resto de las ventas del período queda fuera del cálculo (no se inventa una fecha).
- Se excluyen las notas de crédito (`nc = true`) del histórico de ventas real.
- Las ventas con `id_venta` huérfano (sin cabecera en `f_ventas`, ~0,08% del volumen) se incluyen
  en el cálculo de lead time porque tienen su propia `fecha_venta`/`lote_fabricacion`, pero no se
  filtran por `estado` (no hay estado que consultar) — se marcan con `sinCabeceraVenta`.
- Se prioriza la **mediana** y el **percentil 95 (p95)** sobre el **promedio** como lectura
  principal: incluso con `PRUEBA` ya excluida, algunos outliers puntuales en `BALDE` pueden seguir
  distorsionando el promedio en ciertos meses. La mediana no se ve afectada de la misma forma.
- Los productos con `leadtime_permitido` nulo o ≤ 0 se clasifican como "sin parámetro definido",
  nunca como si el umbral permitido fuera 0 días.

## Antigüedad de stock en cámara (depósito 8)

- Resolución en dos niveles: 1) match por `lote + id_prod` contra `f_partidas_op.fecha_fab`
  (93,3% de cobertura medida); 2) fallback a `f_partidas_stock.ts_ingreso` (6,7% restante). La UI
  marca explícitamente cuándo una partida usa el fallback ("Ingreso a depósito (estimado)").
- El fallback a `ts_ingreso` se concentra en las partidas más antiguas (justo las más críticas),
  probablemente porque las órdenes de producción muy viejas terminan archivadas/borradas. El dato
  sigue siendo real (fecha de ingreso a stock), solo que no confirma la fecha de fabricación exacta.
- 45 combinaciones de `id_prod + lote` tienen más de una orden de producción con `fecha_fab`; se
  desempata tomando la `fecha_fab` más reciente. Bajo volumen relativo, documentado como supuesto.
- Clasificación de riesgo por bandas de `% de leadtime_permitido consumido`: ok < 70%, riesgo
  70–100%, crítico > 100%. Umbrales ajustables en `src/lib/domain/riesgo.ts`.

## Seguridad de conexión

- El host de PostgreSQL de G360 presenta un certificado que no valida contra las CAs públicas ni
  el almacén del sistema (confirmado al conectar). Por decisión explícita del usuario, la app se
  conecta con `G360_DB_SSL_REJECT_UNAUTHORIZED=false` para este host específico — la conexión sigue
  viajando cifrada por TLS, pero no valida la cadena de certificados. Mismo criterio que ya usa en
  producción el proyecto hermano `dashboard sop`. Si en algún momento se resuelve el certificado del
  lado del servidor, esta variable debería volver a `true`.

## Fuera de alcance del MVP

- Autenticación propia (se apoya en Vercel Password Protection si hace falta).
- Escritura a G360.
- Reconciliación con el histórico Excel SOP (eso vive en el proyecto hermano `dashboard sop`).
- Forecast, MRP simulado, compras — esta app es exclusivamente de lead time.
