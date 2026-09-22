# Módulo 1 · Modelar una API

**En este archivo**

- 1.1 Modelar = decidir qué se puede hacer y cómo se pide
- 1.2 Paso 1: identificar recursos
- 1.3 Paso 2: aplicar el estilo REST
- 1.4 Paso 3: relaciones entre recursos (anidamiento)
- 1.5 Paso 4: filtros, orden y paginación con query params
- 1.6 Paso 5: acciones que no son CRUD
- 1.7 Convenciones de nombres
- 1.8 Forma de las respuestas
- 1.9 Del DER a los recursos

---

## 1.1 · Modelar = decidir qué se puede hacer y cómo se pide

Antes de escribir una línea de código, definís **qué recursos existen** y **qué operaciones se pueden hacer** sobre ellos. Esto es el **modelado de la API**. Es el equivalente a diseñar las tablas antes de escribir SQL.

Un modelado bueno se nota en que un desarrollador que nunca vio tu API puede **adivinar** cómo se pide algo. Si para ver un producto es `GET /productos/3`, adivina que para ver una categoría es `GET /categorias/2`. Eso se logra siguiendo convenciones, no inventando.

## 1.2 · Paso 1: identificar recursos

Un **recurso** es una "cosa" de tu dominio: un producto, una categoría, un pedido. Casi siempre coinciden con las tablas de la base de datos, pero no es obligatorio (puede haber recursos calculados, como `/estadisticas`, o tablas internas que no se exponen).

Los recursos se nombran con **sustantivos en plural, en minúscula**:

```
/categorias
/productos
/pedidos
```

## 1.3 · Paso 2: aplicar el estilo REST

**REST** es un conjunto de convenciones para diseñar APIs HTTP. La idea central: **la URL dice sobre qué, el verbo dice qué hacer**.

| Operación | Verbo + Ruta | Status OK | Errores típicos |
|---|---|---|---|
| Listar | `GET /productos` | 200 | — |
| Ver uno | `GET /productos/:id` | 200 | 404 |
| Crear | `POST /productos` | 201 | 400, 404 (si referencia algo inexistente) |
| Reemplazar | `PUT /productos/:id` | 200 | 400, 404 |
| Modificar parte | `PATCH /productos/:id` | 200 | 400, 404 |
| Borrar | `DELETE /productos/:id` | 204 | 404, 409 (si algo depende de él) |

`:id` es un **parámetro de ruta**: la parte variable de la URL. En OpenAPI se escribe `{id}`.

Estas seis operaciones son el **CRUD** (Create, Read, Update, Delete) de un recurso. No todo recurso necesita las seis: una tabla de auditoría quizás solo se lista y se ve.

## 1.4 · Paso 3: relaciones entre recursos (anidamiento)

Cuando un recurso "pertenece" a otro, se puede anidar en la URL:

```
GET /categorias/2/productos     → los productos de la categoría 2
GET /productos/3/pedidos        → los pedidos del producto 3
```

Regla: **no anidar más de dos niveles**. `/categorias/2/productos/3/pedidos/12` es ilegible; alcanza con `/pedidos/12`.

**Anidar o filtrar?** `GET /categorias/2/productos` y `GET /productos?categoria_id=2` devuelven lo mismo. La segunda forma es más flexible porque se combina con otros filtros (`&stock_minimo=1`). La primera es más expresiva. Muchas APIs ofrecen solo el filtro. Si ofrecés las dos, tienen que devolver exactamente lo mismo.

## 1.5 · Paso 4: filtros, orden y paginación con query params

Todo lo que sea "opcional" o "refinamiento" de una lista va después del `?`:

```
GET /productos?categoria_id=2
GET /productos?nombre=tecl                  → búsqueda parcial
GET /productos?categoria_id=2&precio_max=20000
GET /productos?ordenar=precio&direccion=desc
GET /productos?pagina=2&limite=20
```

Los **query params** filtran. Los **params de ruta** identifican. Un id va en la ruta porque identifica un recurso; `categoria_id=2` va en el query porque filtra una lista.

**Búsqueda contra filtro.** Un filtro es una igualdad exacta: `categoria_id=2`. Una búsqueda es parcial: `nombre=tecl` encuentra "Teclado" y "Teclado inalámbrico". En SQL es la diferencia entre `=` y `LIKE '%tecl%'`. En el contrato hay que decir cuál de las dos es cada parámetro, y si la búsqueda distingue mayúsculas.

**Paginación.** Una lista de 10.000 productos no se devuelve entera. Se pide de a páginas:

```
GET /productos?pagina=3&limite=20    → productos 41 a 60
```

En SQL eso es `LIMIT 20 OFFSET 40`. El offset se calcula como `(pagina - 1) * limite`.

Cuando hay paginación, la respuesta **deja de ser un array** y pasa a ser un objeto con los datos y la información de la página:

```json
{
  "datos": [ { "id": 41, ... }, { "id": 42, ... } ],
  "total": 10000,
  "pagina": 3,
  "limite": 20
}
```

`total` es la cantidad de elementos que cumplen el filtro **en toda la colección**, no en esta página. Sin ese número el cliente no puede saber cuántas páginas hay.

Tres decisiones que el contrato tiene que tomar sobre la paginación:

1. Los **defaults**: qué pasa si no mandan `pagina` ni `limite`.
2. El **máximo** de `limite`, para que nadie pida 100.000 filas de un saque.
3. Qué pasa con valores inválidos como `pagina=0` o `limite=abc`: ¿400, o se corrige en silencio al default? Las dos son válidas si están documentadas.

Y una regla técnica: **siempre ordenar cuando se pagina**. Sin `ORDER BY`, la base no garantiza el orden entre consultas, y la página 2 puede repetir elementos de la página 1.

## 1.6 · Paso 5: acciones que no son CRUD

"Cancelar un pedido" no es crear, leer ni borrar nada. Hay dos formas aceptadas:

```
# Opción A: modificar el estado del recurso
PATCH /pedidos/12
{ "estado": "cancelado" }

# Opción B: sub-recurso de acción (cuando la lógica es compleja)
POST /pedidos/12/cancelacion
```

La opción A alcanza cuando la acción es "cambiar un campo". La B se justifica cuando la acción tiene su propio body, sus propias reglas y sus propios errores, y meterla en un PATCH genérico la haría confusa.

Lo que **no** se hace: meter verbos en la URL (`/cancelarPedido`, `/borrarProducto`). El verbo ya lo dice HTTP.

**Efectos secundarios.** Muchas acciones cambian más de un recurso. Cancelar un pedido devuelve el stock al producto. Eso tiene que estar **escrito en el contrato**: un cliente que hace `PATCH /pedidos/12` tiene que saber que después `GET /productos/3` va a mostrar otro stock.

## 1.7 · Convenciones de nombres

| ✅ Bien | ❌ Mal | Por qué |
|---|---|---|
| `/productos` | `/Productos`, `/producto` | minúscula, plural |
| `/productos/5` | `/productos?id=5` | el id identifica → va en la ruta |
| `/fechas-entrega` | `/fechasEntrega`, `/fechas_entrega` | kebab-case en URLs |
| `DELETE /productos/5` | `POST /productos/borrar/5` | el verbo es HTTP, no la URL |
| `GET /productos?stock=0` | `GET /productos/sin-stock` | un filtro es un query param |
| `categoria_id` (en JSON) | `categoriaId`, `CategoriaId` | elegí una convención para los campos y usala siempre |

Sobre los campos del JSON: `snake_case` o `camelCase` son ambos aceptables. Lo que no es aceptable es mezclarlos. Si la base usa `snake_case`, lo más simple es que la API también.

## 1.8 · Forma de las respuestas

Sé **consistente**. Elegí una estructura y usala siempre. Una común:

```json
// Éxito con un recurso
{ "id": 3, "nombre": "Teclado", "precio": 15000, "categoria_id": 2, "stock": 10 }

// Éxito con una lista sin paginar
[
  { "id": 3, "nombre": "Teclado", ... },
  { "id": 4, "nombre": "Mouse", ... }
]

// Éxito con una lista paginada
{ "datos": [ ... ], "total": 57, "pagina": 1, "limite": 10 }

// Error (siempre con la misma forma)
{ "error": "Producto no encontrado" }
```

Por qué importa que los errores tengan siempre la misma forma: el cliente escribe **una sola vez** el código que muestra errores. Si a veces es `{ error }`, a veces `{ message }` y a veces un string, tiene que escribir tres.

**Cambiar la forma de una respuesta rompe al cliente.** Pasar de un array a `{ datos, total }` es un cambio incompatible: todo cliente que hacía `respuesta.map(...)` deja de funcionar. Por eso se decide **antes** de publicar, y si hay que cambiarlo después, se versiona (`/v2/productos`).

## 1.9 · Del DER a los recursos

Si tenés el diagrama entidad-relación de la base, ya tenés el 80% del modelado:

| En el DER | En la API |
|---|---|
| Una entidad (tabla) | Un recurso, en plural: `PRODUCTOS` → `/productos` |
| La clave primaria | El parámetro de ruta: `/productos/{id}` |
| Una clave foránea | Un campo del JSON (`categoria_id`) y, casi siempre, un filtro (`?categoria_id=`) |
| Una relación 1 a N | Opcionalmente, un anidamiento: `/categorias/{id}/productos` |
| Una columna `NOT NULL` | Un campo obligatorio en el body del POST |
| Una columna con `DEFAULT` o autoincremental | Un campo que **no** va en el body del POST: lo pone el servidor |
| Una columna que acepta `NULL` | Un campo `nullable` en el schema |

Lo que el DER **no** te dice y tenés que decidir vos: qué operaciones se permiten sobre cada recurso, qué reglas de negocio hay (¿se puede borrar una categoría con productos?), y qué status devuelve cada error.
