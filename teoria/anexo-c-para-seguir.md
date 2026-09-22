# Anexo C · Para seguir después de la clase

Lo que quedó fuera a propósito, en el orden en que conviene encararlo:

- **Manejo de errores centralizado.** El middleware de cuatro parámetros del módulo 6.2, para dejar de repetir `try/catch` en cada handler.
- **Middleware de log.** Una función que imprime `método + ruta + status + tiempo` por cada pedido. Es el primer middleware propio que vale la pena escribir.
- **Validación con `zod`.** Definís el schema una vez y obtenés **la validación en runtime y el tipo de TypeScript** del mismo lugar (`z.infer`). Es la evolución natural de los `typeof` a mano.
- **Capa de servicios.** Cuando los controladores empiezan a tener más reglas de negocio que HTTP (módulo 5.6).
- **Variables de entorno con `dotenv`.** Puerto, ruta de la base, credenciales. Nada de eso va escrito en el código.
- **Cambiar SQLite por PostgreSQL o MySQL.** Con Sequelize es cambiar el dialecto en la conexión. Es la prueba de fuego de que los repositorios aislaron bien la base.
- **Tests de endpoints con `supertest`.** Cada fila de errores del contrato es un test.
- **Inyección de dependencias.** Lo del módulo 6.8: pasar el repositorio al controlador en vez de importarlo, para testear con uno falso.
- **Autenticación con JWT.** Un middleware que lee el header `Authorization`, valida el token y deja el usuario en `req`.
- **Generar el contrato desde el código** o **el código desde el contrato.** Herramientas como `openapi-typescript` generan las interfaces a partir del YAML, para que las dos vistas no se puedan desincronizar.
