# Módulo 0 · ¿Qué es una API?

**En este archivo**

- 0.1 Cliente y servidor
- 0.2 Anatomía de un pedido HTTP
- 0.3 Los verbos HTTP
- 0.4 Status codes que vas a usar siempre
- 0.5 PUT y PATCH no son lo mismo

---

## 0.1 · Cliente y servidor

Hasta ahora escribiste código que corre **en el navegador** (HTML, CSS, JS). Eso es el **cliente**. Una API corre **en un servidor**: una computadora que espera pedidos, los procesa (normalmente consultando una base de datos) y responde.

```
 Cliente (navegador, app, otro server)
    │
    │  1. Pedido HTTP:  GET /productos/3
    ▼
 Servidor (tu API)
    │
    │  2. Consulta:  SELECT * FROM productos WHERE id = 3
    ▼
 Base de datos
    │
    │  3. Devuelve la fila
    ▼
 Servidor arma la respuesta
    │
    │  4. Respuesta HTTP:  200 OK  { "id": 3, "nombre": "Teclado", ... }
    ▼
 Cliente
```

**API** significa *Application Programming Interface*: es la "puerta de entrada" de tu programa para que otros programas hablen con él. En web, esa puerta usa el protocolo **HTTP** y los datos viajan casi siempre en **JSON**.

El cliente **no sabe ni le importa** cómo está hecha la API: qué lenguaje usa, qué base de datos tiene, cómo se organizan sus archivos. Solo conoce la puerta. Por eso la puerta hay que definirla con cuidado: es lo único que el cliente ve.

## 0.2 · Anatomía de un pedido HTTP

Todo pedido tiene:

| Parte | Ejemplo | Para qué sirve |
|---|---|---|
| **Método (verbo)** | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Qué acción quiero hacer |
| **URL / ruta** | `/productos/3` | Sobre qué recurso |
| **Query string** | `?categoria_id=2&pagina=1` | Refinamientos opcionales, después del `?` |
| **Headers** | `Content-Type: application/json` | Metadatos del pedido |
| **Body** | `{ "nombre": "Teclado" }` | Datos que envío (solo en POST/PUT/PATCH) |

Y toda respuesta tiene:

| Parte | Ejemplo |
|---|---|
| **Status code** | `200`, `404`, `500` |
| **Headers** | `Content-Type: application/json` |
| **Body** | `{ "id": 3, "nombre": "Teclado" }` |

## 0.3 · Los verbos HTTP

| Verbo | Significado | Analogía con SQL | ¿Lleva body? |
|---|---|---|---|
| `GET` | Leer | `SELECT` | No |
| `POST` | Crear | `INSERT` | Sí |
| `PUT` | Reemplazar completo | `UPDATE` (todos los campos) | Sí |
| `PATCH` | Modificar parcialmente | `UPDATE` (algunos campos) | Sí |
| `DELETE` | Borrar | `DELETE` | No |

Una propiedad importante: `GET`, `PUT` y `DELETE` son **idempotentes**. Repetir el mismo pedido dos veces deja el sistema igual que hacerlo una vez. `POST` no lo es: dos `POST /productos` iguales crean dos productos.

## 0.4 · Status codes que vas a usar siempre

| Código | Nombre | Cuándo |
|---|---|---|
| `200` | OK | Todo salió bien |
| `201` | Created | Se creó un recurso (respuesta a un POST exitoso) |
| `204` | No Content | Salió bien pero no hay nada que devolver (típico de DELETE) |
| `400` | Bad Request | El cliente mandó datos inválidos o incompletos |
| `401` | Unauthorized | No estás autenticado |
| `403` | Forbidden | Estás autenticado pero no tenés permiso |
| `404` | Not Found | El recurso no existe |
| `409` | Conflict | El pedido está bien formado pero choca con el estado actual del sistema |
| `500` | Internal Server Error | Se rompió algo del lado del servidor |

**Regla rápida:** 2xx = éxito · 4xx = el cliente hizo algo mal · 5xx = el servidor hizo algo mal.

**400 contra 404 contra 409.** Los tres son "no puedo hacer lo que pedís", pero por motivos distintos:

- **400**: el pedido en sí está mal. Falta un campo, un tipo es incorrecto, un valor está fuera de rango. Se detecta mirando solo el pedido, sin consultar nada.
- **404**: el pedido está bien, pero apunta a algo que no existe. Se detecta consultando la base.
- **409**: el pedido está bien y todo lo que nombra existe, pero **una regla del negocio** impide hacerlo ahora. Cancelar un pedido que ya se envió. Borrar una categoría que todavía tiene productos. Comprar un producto sin stock.

Un caso que genera discusión: `POST /productos` con un `categoria_id` que no existe. ¿Es 400 porque el body trae un dato inválido, o 404 porque se referencia algo inexistente? Las dos posturas tienen argumentos. Lo importante es **elegir una y documentarla en el contrato**.

## 0.5 · PUT y PATCH no son lo mismo

Los dos modifican un recurso existente. La diferencia está en **qué pasa con los campos que no mandás**.

Supongamos este producto: `{ "id": 3, "nombre": "Teclado", "precio": 15000, "stock": 10 }`. Le mandamos el body `{ "precio": 12000 }`:

| Verbo | Resultado | Por qué |
|---|---|---|
| `PATCH /productos/3` | `{ "id": 3, "nombre": "Teclado", "precio": 12000, "stock": 10 }` | Solo cambia lo que vino. Lo demás queda igual. |
| `PUT /productos/3` | **400** | PUT reemplaza el recurso completo. Faltan `nombre` y `stock`, así que el body es inválido. |

Por eso el contrato de un `PUT` exige **todos** los campos obligatorios, igual que un `POST`. Y el de un `PATCH` los tiene **todos opcionales**, pero suele exigir que venga al menos uno.

**¿Cuándo usar cada uno?**

- `PATCH` es lo más común en APIs modernas: un formulario que edita solo el precio, un botón que cambia solo el estado.
- `PUT` tiene sentido cuando el cliente tiene el objeto completo y quiere guardarlo tal cual: una ficha de edición completa.

Muchas APIs ofrecen solo uno de los dos. Si vas a ofrecer ambos, el contrato tiene que dejar clarísima la diferencia.
