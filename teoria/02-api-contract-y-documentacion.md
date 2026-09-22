# Módulo 2 · API Contract y documentación

**En este archivo**

- 2.1 ¿Qué es un API Contract?
- 2.2 Qué tiene que definir el contrato de un endpoint
- 2.3 OpenAPI / Swagger: el estándar
- 2.4 ¿Qué más se documenta además de los endpoints?
- 2.5 Regla de oro
- 2.6 Anatomía de un documento OpenAPI
- 2.7 Schemas: la forma de los datos
- 2.8 Contrato primero, código después

---

## 2.1 · ¿Qué es un API Contract?

El **contrato** es un documento que dice **exactamente** qué recibe y qué devuelve cada endpoint. Es un acuerdo entre quien hace el backend y quien hace el frontend: si ambos respetan el contrato, las dos partes se pueden desarrollar **en paralelo** sin esperarse.

Piensalo como el menú de un restaurante: vos elegís del menú, la cocina prepara lo del menú. Nadie improvisa.

**Sin contrato:**
> Front: "¿el campo es `nombre` o `name`?" · "¿me devolvés la categoría como id o como objeto?" · "¿qué status me das si no existe?" · "¿la lista viene paginada?"

**Con contrato:** todas esas preguntas ya están respondidas por escrito.

## 2.2 · Qué tiene que definir el contrato de un endpoint

Sin importar el formato, para cada endpoint tiene que quedar respondido:

| Pregunta | Ejemplo para `POST /productos` |
|---|---|
| ¿Qué verbo y qué ruta? | `POST /productos` |
| ¿Qué hace, en una línea? | Crea un producto nuevo |
| ¿Qué parámetros de ruta? | Ninguno |
| ¿Qué query params, y cuáles son opcionales? | Ninguno |
| ¿Qué body, con qué campos, de qué tipo, cuáles obligatorios, con qué reglas? | `nombre` string obligatorio de 1 a 100 caracteres · `precio` number obligatorio mayor a 0 · `categoria_id` integer obligatorio que exista · `stock` integer opcional, default 0 |
| ¿Qué devuelve si sale bien, con qué status, con un ejemplo real? | 201 y el producto completo con su `id` |
| ¿Qué errores puede dar, con qué status, con qué body cada uno? | 400 si falta un campo o tiene tipo incorrecto · 404 si `categoria_id` no existe |
| ¿Tiene efectos secundarios sobre otros recursos? | No |

La lista de errores es la parte que más se olvida y la que más problemas evita. Una técnica: por cada campo del body, preguntate "¿qué pasa si no viene? ¿si viene con otro tipo? ¿si viene con un valor absurdo?". Por cada referencia a otro recurso: "¿qué pasa si no existe?". Por cada regla de negocio: "¿qué pasa si no se cumple?".

Lo importante no es el formato sino que **no quede nada ambiguo**.

## 2.3 · OpenAPI / Swagger: el estándar

**OpenAPI** es un formato estándar (en YAML o JSON) para escribir contratos de APIs HTTP. **Swagger** es la familia de herramientas que lo lee. La más usada es **Swagger UI**: una página web que muestra el contrato como documentación navegable y permite **probar cada endpoint desde el navegador** con el botón *Try it out*.

Un contrato escrito en OpenAPI y servido con Swagger UI da tres cosas a la vez:

1. **Documentación** que se lee.
2. **Un cliente HTTP** para probar, sin instalar nada.
3. **Un archivo procesable**: hay herramientas que generan código de cliente, validadores y tests a partir de él.

Así se ve un endpoint chico:

```yaml
paths:
  /productos/{id}:
    get:
      summary: Obtiene un producto por id
      tags: [Productos]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Producto encontrado
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Producto"
        "404":
          description: Producto no encontrado
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
              example:
                error: Producto no encontrado
```

Se lee de arriba hacia abajo: en la ruta `/productos/{id}`, el verbo `get`, recibe un parámetro `id` en la ruta que es entero obligatorio, y responde 200 con un `Producto` o 404 con un `Error`. Los schemas `Producto` y `Error` se definen una sola vez, aparte, y se referencian con `$ref`.

## 2.4 · ¿Qué más se documenta además de los endpoints?

- **URL base** y versión: `https://api.tienda.com/v1`
- **Autenticación**: si hace falta token, dónde va (`Authorization: Bearer ...`)
- **Formato de errores** general
- **Convenciones**: formato de fechas (`YYYY-MM-DD`), paginación, nombres de campos
- **Ejemplos completos** de pedido y respuesta

En OpenAPI todo eso va en `info.description` y en `servers`.

## 2.5 · Regla de oro

> Si un desarrollador que nunca habló con vos no puede consumir tu API leyendo solo la documentación, la documentación está incompleta.

## 2.6 · Anatomía de un documento OpenAPI

Un archivo OpenAPI tiene cuatro bloques principales:

```yaml
openapi: 3.0.3              # versión del formato

info:                        # sobre la API en general
  title: API Tienda
  version: 1.0.0
  description: Convenciones, formato de fechas, forma de los errores...

servers:                     # dónde vive
  - url: http://localhost:3000

paths:                       # los endpoints: una entrada por ruta, adentro una por verbo
  /productos:
    get: ...
    post: ...
  /productos/{id}:
    get: ...
    patch: ...
    delete: ...

components:                  # piezas reutilizables
  schemas:                   # las formas de los datos
    Producto: ...
    NuevoProducto: ...
    Error: ...
```

Dentro de cada verbo, las piezas que vas a usar:

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `summary` | Una línea de qué hace | `Crea un producto` |
| `description` | Detalles, reglas, efectos secundarios | `Descuenta el stock del producto.` |
| `tags` | Agrupa endpoints en Swagger UI | `[Productos]` |
| `parameters` | Params de ruta y de query | ver abajo |
| `requestBody` | El body, para POST/PUT/PATCH | ver abajo |
| `responses` | Una entrada por status posible | `"200"`, `"400"`, `"404"` |

**Parámetros.** Cada uno dice dónde viene (`in: path` o `in: query`), si es obligatorio, y qué tipo tiene. Los de ruta son siempre `required: true`. Los de query casi siempre `required: false` y pueden tener `default`:

```yaml
parameters:
  - name: categoria_id
    in: query
    required: false
    schema: { type: integer }
    description: Filtra por categoría
  - name: limite
    in: query
    required: false
    schema: { type: integer, default: 10, minimum: 1, maximum: 50 }
```

**Request body.** Apunta a un schema y dice si es obligatorio:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/NuevoProducto"
```

**Responses.** Una por status, cada una con `description` y, si tiene body, `content`. Los status van entre comillas porque YAML los tomaría como números.

## 2.7 · Schemas: la forma de los datos

Un **schema** describe la forma de un objeto JSON: qué propiedades tiene, de qué tipo, cuáles son obligatorias, qué reglas cumplen.

```yaml
components:
  schemas:
    Producto:
      type: object
      required: [id, nombre, precio, categoria_id, stock]
      properties:
        id:           { type: integer, example: 3 }
        nombre:       { type: string,  example: Teclado, maxLength: 100 }
        precio:       { type: number,  example: 15000, minimum: 0 }
        categoria_id: { type: integer, example: 2 }
        stock:        { type: integer, example: 10, minimum: 0 }
        descripcion:  { type: string,  nullable: true, example: null }

    NuevoProducto:
      type: object
      required: [nombre, precio, categoria_id]
      properties:
        nombre:       { type: string,  minLength: 1, maxLength: 100 }
        precio:       { type: number,  minimum: 0 }
        categoria_id: { type: integer }
        stock:        { type: integer, minimum: 0, default: 0 }

    Error:
      type: object
      required: [error]
      properties:
        error: { type: string, example: Producto no encontrado }
```

Cosas para notar:

- **Tipos**: `integer`, `number` (con decimales), `string`, `boolean`, `array`, `object`. Para arrays: `type: array` más `items: { $ref: ... }`.
- **`required`** es una lista aparte, no una propiedad de cada campo.
- **`nullable: true`** es la traducción de una columna que acepta `NULL`.
- **Reglas**: `minLength`, `maxLength`, `minimum`, `maximum`, `enum: [pendiente, enviado, cancelado]`, `format: date`.
- **`example`** en cada propiedad hace que Swagger UI arme un body de ejemplo automáticamente en *Try it out*.

**Un recurso, varios schemas.** `Producto` es lo que la API devuelve. `NuevoProducto` es lo que recibe en un POST: sin `id`, porque lo pone el servidor. Un `EditarProducto` para PATCH tendría los mismos campos pero ninguno en `required`. Son formas distintas del mismo concepto, y conviene que tengan nombres que lo digan.

**Una lista paginada** es un schema más:

```yaml
    PaginaDeProductos:
      type: object
      required: [datos, total, pagina, limite]
      properties:
        datos:
          type: array
          items: { $ref: "#/components/schemas/Producto" }
        total:  { type: integer, example: 57 }
        pagina: { type: integer, example: 1 }
        limite: { type: integer, example: 10 }
```

## 2.8 · Contrato primero, código después

Escribir el contrato antes del código parece más lento. No lo es:

- **Te obliga a decidir** los casos borde antes de programarlos, cuando cambiar de opinión es gratis. Cambiar un status code en el YAML cuesta un segundo. Cambiarlo en el código, en el front que ya lo consume y en la documentación vieja, cuesta una tarde.
- **Te da la lista de pruebas.** Cada fila de errores del contrato es una prueba que tenés que hacer. Si el contrato dice que `precio: -5` da 400, probás eso.
- **Detecta inconsistencias.** Cuando escribís el tercer endpoint te das cuenta de que en el primero devolvías `{ mensaje }` y en el segundo `{ error }`.
- **Es la definición de "terminado".** El endpoint está listo cuando la respuesta real coincide con el contrato en cada caso. Ni antes ni después.

El flujo de trabajo por endpoint es: escribir el contrato, verlo renderizado, implementarlo, probar cada caso del contrato contra la implementación real. Si algo no coincide, hay dos posibilidades: el código está mal, o el contrato estaba mal pensado. Las dos se arreglan. Lo que no se hace es dejarlos en desacuerdo.
