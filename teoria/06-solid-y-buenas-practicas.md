# Módulo 6 · SOLID y buenas prácticas

**En este archivo**

- 6.1 Buenas prácticas básicas (antes de SOLID)
- 6.2 Manejo de errores centralizado en Express
- 6.3 Los principios SOLID
- 6.4 S — Single Responsibility (Responsabilidad única)
- 6.5 O — Open/Closed (Abierto/Cerrado)
- 6.6 L — Liskov Substitution (Sustitución de Liskov)
- 6.7 I — Interface Segregation (Segregación de interfaces)
- 6.8 D — Dependency Inversion (Inversión de dependencias)
- 6.9 Resumen SOLID en una tabla

---

## 6.1 · Buenas prácticas básicas (antes de SOLID)

Estas son las que más impacto tienen y las que más se olvidan:

**1. Nombres que dicen lo que hacen.**

```ts
// ❌
const d = req.body;
function f(x: any) { ... }

// ✅
const datosProducto: NuevoProducto = validarNuevoProducto(req.body);
function obtenerProductoPorId(id: number): Producto | null { ... }
```

Los tipos son parte del nombre: `id: number` dice más que `id` solo.

Variables y funciones se leen cientos de veces y se escriben una. Optimizá para la lectura.

**2. Funciones cortas que hacen una cosa.** Si necesitás la palabra "y" para describir qué hace una función, son dos funciones.

**3. Retornar temprano (early return).** Evitá el "if anidado infinito":

```ts
// ❌
if (producto) {
  if (producto.stock >= cantidad) {
    // 15 líneas
  } else {
    return res.status(409)...
  }
} else {
  return res.status(404)...
}

// ✅
if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
if (producto.stock < cantidad) return res.status(409).json({ error: "Stock insuficiente" });
// 15 líneas, sin indentación
```

**4. No repetir código (DRY).** Si copiás y pegás un bloque, extraelo a una función. El caso típico en una API: la validación del body de `POST` y de `PUT` es la misma. Una función, dos llamadas.

**5. Usar `===` y no `==`.** `"1" == 1` es `true`; `"1" === 1` es `false`. El `==` genera bugs silenciosos. Ejemplo real: `req.params.id == producto.id` parece funcionar porque `==` convierte el string a número. Un día cambiás el `==` por `===` en un refactor "inofensivo" y todo devuelve 404.

**5b. No usar `any`.** Cada `any` es un lugar donde TypeScript dejó de ayudarte. Si no sabés el tipo, es `unknown` y se valida; si lo sabés, se escribe. El único `any` aceptable es el de `req.body`, y solo hasta la línea siguiente donde lo validás.

**6. Manejar errores siempre.** Toda operación que puede fallar (base de datos, red, parseo) puede tirar una excepción. Si nadie la agarra, el servidor responde un 500 genérico o directamente se cae. Ver 6.2.

**7. Consistencia.** Mismo estilo de nombres, misma forma de respuesta, misma estructura de archivos en todo el proyecto. Si un compañero abre un archivo tuyo y otro de otro recurso, tienen que parecer escritos por la misma persona.

## 6.2 · Manejo de errores centralizado en Express

Qué pasa si la base de datos falla en medio de un handler `async`? La promesa se rechaza, nadie la agarra, y Express 4 no lo maneja solo: el pedido queda colgado o el proceso se cae.

La forma mínima es un `try/catch` en cada handler que responda 500:

```ts
export async function obtenerUno(req: Request, res: Response) {
  try {
    // ...
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
```

La forma centralizada es delegar al **manejador de errores** de Express: un middleware con **cuatro** parámetros `(error, req, res, next)`, declarado **al final** de `server.ts`, después de todas las rutas. Los handlers hacen `next(error)` en el `catch` y Express lo llama automáticamente.

```ts
// server.ts — SIEMPRE al final
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
});
```

Va al final porque Express recorre las declaraciones en orden y salta al primer middleware de cuatro parámetros que encuentra después del punto donde se llamó `next(error)`. Si está antes de las rutas, nunca lo alcanza.

Cuál usar depende del tamaño del proyecto. Para una API chica, el `try/catch` por handler alcanza y es más explícito. El manejador central es la evolución natural cuando hay veinte handlers repitiendo el mismo `catch`.

## 6.3 · Los principios SOLID

**SOLID** son cinco principios para escribir código que sea fácil de cambiar sin romper. Fueron pensados para programación orientada a objetos, pero aplican igual a módulos y funciones en JavaScript. No los vas a aplicar los cinco todos los días, pero conocerlos te ayuda a **reconocer por qué un código duele**.

---

## 6.4 · S — Single Responsibility (Responsabilidad única)

> Cada módulo/función debe tener **una sola razón para cambiar**.

Es exactamente lo que hace la arquitectura en capas: el repositorio cambia si cambia la base de datos; el controlador cambia si cambia la API HTTP; la ruta cambia si cambian las URLs. Cada uno por su motivo.

```ts
// ❌ Una función, cuatro responsabilidades
function confirmarPedido(req: Request, res: Response) {
  // valida el body
  // consulta y actualiza la base
  // envía un email al cliente
  // arma la respuesta HTTP
}

// ✅ Cada cosa en su lugar
function confirmarPedido(req: Request, res: Response) {
  const errores = validarPedido(req.body);
  if (errores) return res.status(400).json({ error: errores });

  const pedido = PedidosService.confirmar(req.body); // este llama a repositorios y a notificaciones
  res.status(201).json(pedido);
}
```

El test rápido: si para describir la función tenés que usar "y", tiene más de una responsabilidad.

---

## 6.5 · O — Open/Closed (Abierto/Cerrado)

> El código debe estar **abierto a extensión** pero **cerrado a modificación**: agregar funcionalidad nueva sin tocar lo que ya funciona.

```ts
type Canal = "email" | "sms" | "whatsapp";

// ❌ Cada canal nuevo obliga a modificar esta función
function notificar(cliente: Cliente, mensaje: string, canal: Canal) {
  if (canal === "email") enviarEmail(cliente.email, mensaje);
  else if (canal === "sms") enviarSms(cliente.telefono, mensaje);
  else if (canal === "whatsapp") enviarWhatsapp(cliente.telefono, mensaje);
}

// ✅ Agregar un canal = agregar una entrada, sin tocar notificar()
type Enviador = (cliente: Cliente, mensaje: string) => void;

const canales: Record<Canal, Enviador> = {
  email: (c, msg) => enviarEmail(c.email, msg),
  sms: (c, msg) => enviarSms(c.telefono, msg),
  whatsapp: (c, msg) => enviarWhatsapp(c.telefono, msg),
};

function notificar(cliente: Cliente, mensaje: string, canal: Canal) {
  canales[canal](cliente, mensaje);
}
```

Bonus de TypeScript: si agregás `"telegram"` al tipo `Canal` y te olvidás de agregarlo a `canales`, el compilador te avisa. `Record<Canal, Enviador>` exige una entrada por cada valor posible.

En la estructura de carpetas esto se ve así: agregar un recurso nuevo es **agregar** archivos (`pedidos.routes.ts`, `pedidos.controller.ts`, ...) y una línea en `server.ts`. No se **modifica** ningún archivo de los recursos que ya existen.

---

## 6.6 · L — Liskov Substitution (Sustitución de Liskov)

> Si algo espera un tipo de objeto, debería poder recibir cualquier "variante" de ese objeto **sin enterarse**.

En la práctica: si tu controlador usa un repositorio con `obtenerPorId()`, `crear()`, `eliminar()`, debería poder recibir el repositorio "con Sequelize y Postgres" o el repositorio "con MySQL" o el repositorio "falso en memoria para tests", y funcionar igual, porque todos exponen las mismas funciones con el mismo comportamiento.

Acá TypeScript ayuda directamente: escribís ese "conjunto de funciones" como una **interface** y las variantes la implementan.

```ts
// types/producto.ts
export interface ProductosRepositorio {
  obtenerPorId(id: number): Promise<Producto | null>;
  crear(datos: NuevoProducto): Promise<Producto>;
  eliminar(id: number): Promise<boolean>;
}

// repositories/productos.sequelize.ts
export const productosSequelize: ProductosRepositorio = { /* ...usa Sequelize */ };

// repositories/productos.memoria.ts
export const productosMemoria: ProductosRepositorio = { /* ...usa un array */ };
```

Si `productosMemoria.obtenerPorId` devolviera `undefined` en vez de `null`, **no compila**: la interface lo detecta. Sin TypeScript, se rompe en producción cuando el controlador hace `if (producto === null)`.

"Mismo comportamiento" incluye los casos borde: las dos variantes devuelven `null` cuando no existe, las dos tiran excepción si la conexión falla, ninguna devuelve `undefined` a veces y `null` otras.

---

## 6.7 · I — Interface Segregation (Segregación de interfaces)

> Nadie debería depender de funciones que no usa.

```ts
// ❌ Un módulo gigante "utils.ts" con 40 funciones: el que importa una, importa todo.
import * as utils from "./utils.js";

// ✅ Módulos chicos y específicos
import { validarProducto } from "./validaciones/productos.js";
import { formatearPrecio } from "./formato/precios.js";
```

Con interfaces es literal: mejor varias interfaces chicas que una gigante.

```ts
// ❌ Una interface para todo
interface Datos { id: number; nombre?: string; precio?: number; producto_id?: number; /* ...20 más */ }

// ✅ Una por concepto, y tipos derivados para cada uso
interface Producto { ... }
type NuevoProducto = Omit<Producto, "id">;
type ProductoResumen = Pick<Producto, "id" | "nombre" | "precio">;
```

En APIs, esto también aplica al **contrato**: si un endpoint devuelve 30 campos y el cliente usa 3, la interfaz está mal segmentada (`ProductoResumen` para el listado, `Producto` completo para el detalle).

---

## 6.8 · D — Dependency Inversion (Inversión de dependencias)

> Los módulos de alto nivel (reglas de negocio) no deberían depender de los detalles (base de datos concreta). Ambos dependen de una **abstracción**.

Con la capa de repositorios ya estás cerca: el controlador depende de "algo que tiene `obtenerPorId`", no de Sequelize. La abstracción es la interface `ProductosRepositorio` que definimos arriba.

Un paso más allá es **inyectar** la dependencia en vez de importarla, lo que permite testear con un repositorio falso:

```ts
// El controlador recibe el repositorio como parámetro. Solo sabe que cumple la interface.
export function crearProductosController(Productos: ProductosRepositorio) {
  return {
    async obtenerUno(req: Request, res: Response) {
      const producto = await Productos.obtenerPorId(Number(req.params.id));
      if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
      res.json(producto);
    },
  };
}

// En producción:
const controller = crearProductosController(productosSequelize);
// En tests:
const controller = crearProductosController(productosMemoria);
```

El parámetro es de tipo `ProductosRepositorio`, no `typeof productosSequelize`. Eso **es** la inversión: el controlador (alto nivel) define qué necesita; la base de datos (detalle) se adapta.

No hace falta que lo apliques desde el primer día; sí que entiendas la idea: **depender de qué hace algo, no de cómo lo hace**.

---

## 6.9 · Resumen SOLID en una tabla

| Letra | Principio | En una frase | Dónde se ve en una API en capas |
|---|---|---|---|
| **S** | Responsabilidad única | Una función, una tarea | rutas / controladores / repositorios, cada uno con su motivo de cambio |
| **O** | Abierto/Cerrado | Agregar sin modificar | Agregar un recurso = agregar archivos, no editar los otros |
| **L** | Sustitución | Las variantes se comportan igual | Dos repositorios que implementan la misma interface |
| **I** | Segregación de interfaces | No importar lo que no usás | `Producto`, `NuevoProducto`, `ProductoResumen` en vez de una interface gigante |
| **D** | Inversión de dependencias | Depender de la abstracción | El controlador recibe un `ProductosRepositorio`, no Sequelize |
