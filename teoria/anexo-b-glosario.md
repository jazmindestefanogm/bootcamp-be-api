# Anexo B · Glosario

| Término | Definición corta |
|---|---|
| **API** | Interfaz para que programas se comuniquen entre sí. |
| **REST** | Convenciones para diseñar APIs HTTP: recursos en URLs, acciones en verbos. |
| **Endpoint** | Una combinación de verbo + ruta, ej. `GET /productos/{id}`. |
| **Recurso** | Una "cosa" del dominio expuesta por la API (producto, categoría). |
| **CRUD** | Create, Read, Update, Delete: las cuatro operaciones básicas sobre un recurso. |
| **Parámetro de ruta** | Parte variable de la URL que identifica un recurso: `/productos/{id}`. |
| **Query param** | Refinamiento opcional después del `?`: filtro, búsqueda, orden, página. |
| **Paginación** | Devolver una lista de a partes, con `pagina` y `limite`, más el `total`. |
| **Idempotente** | Operación que repetida N veces deja el mismo resultado que hecha una vez. |
| **Efecto secundario** | Cambio en un recurso distinto al que se está operando. |
| **Contrato** | Documento que especifica exactamente entradas y salidas de cada endpoint. |
| **OpenAPI** | Formato estándar (YAML/JSON) para escribir contratos de API. |
| **Swagger UI** | Página web que renderiza un OpenAPI y permite probar los endpoints. |
| **Schema** | En OpenAPI, la descripción de la forma de un objeto JSON. |
| **`$ref`** | En OpenAPI, referencia a un schema definido en `components`. |
| **Handler** | Función que atiende un pedido: `(req, res) => {}`. |
| **Middleware** | Función que se ejecuta entre el pedido y el handler, ej. `express.json()`. |
| **Router** | Agrupador de rutas de Express, se monta con `app.use(prefijo, router)`. |
| **Early return** | Responder y salir apenas se detecta un error, para no anidar `if`s. |
| **MVC** | Patrón: Modelo (datos) – Vista (salida) – Controlador (coordinación). |
| **Capa** | Grupo de código con una responsabilidad; las capas se comunican en un solo sentido. |
| **ORM** | Librería que traduce entre objetos del lenguaje y filas de la base de datos. |
| **Sequelize** | El ORM más usado en Node. |
| **Modelo (ORM)** | Clase que representa una tabla; define columnas, tipos y relaciones. |
| **Instancia (ORM)** | Objeto de un modelo; representa una fila. `toJSON()` la vuelve objeto plano. |
| **Repositorio** | Módulo con las funciones de acceso a datos de un recurso. Único que usa el ORM. |
| **DTO** | *Data Transfer Object*: la forma exacta de los datos que entran o salen de la API. Lo decide el contrato, no la tabla. |
| **Entidad** | Una fila de la base tal como está guardada. En este proyecto, un modelo de Sequelize. |
| **Mapper** | Función que convierte una entidad en un DTO eligiendo campo por campo. |
| **Asignación masiva** | Ataque que aprovecha pasar `req.body` directo a la base para modificar campos no permitidos. |
| **Servicio** | Capa opcional entre controlador y repositorios para reglas de negocio complejas. |
| **DER** | Diagrama Entidad-Relación: tablas, columnas, claves y relaciones de una base. |
| **PK / FK** | Clave primaria / clave foránea. |
| **Refactorizar** | Cambiar la estructura del código sin cambiar su comportamiento. |
| **DRY** | *Don't Repeat Yourself*: no duplicar código. |
| **SOLID** | Cinco principios de diseño para código fácil de cambiar. |
| **TypeScript** | JavaScript con tipos, chequeados antes de ejecutar. |
| **Interface** | Descripción de la forma de un objeto: propiedades y tipos. |
| **Type (alias)** | Nombre para cualquier tipo: uniones, literales, derivados. |
| **Unión** | `A \| B`: un valor que puede ser de uno u otro tipo. |
| **Genérico** | Tipo con un parámetro, ej. `PaginaDe<T>`, `Promise<T>`, `Array<T>`. |
| **`Omit` / `Partial` / `Pick`** | Tipos derivados de otro: quitar campos, hacerlos opcionales, elegir algunos. |
| **`any`** | Tipo que desactiva el chequeo. Evitarlo. |
| **`unknown`** | Tipo "no sé qué es": obliga a validar antes de usar. |
| **`strict`** | Opción de `tsconfig` que activa todos los chequeos de TypeScript. |
