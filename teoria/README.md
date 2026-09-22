# De la base de datos a la API — Material teórico (índice)

**Modelado de API · API Contract · TypeScript · Express · MVC · SOLID**

Este documento es el **material de consulta**. Las consignas están en practica.md: la idea es que primero leas la práctica y vengas acá a buscar lo que te falta. Cada sección tiene un número (por ejemplo **1.3**) que es el que se cita desde la práctica.

**Lo que ya sabés y vamos a usar:** JavaScript (funciones, objetos, arrays, `async/await`), fetch, bases de datos relacionales (tablas, claves, `SELECT`, `INSERT`) y lo básico de Sequelize.

La teoría es **conceptual**. Los ejemplos usan una tienda (categorías, productos, pedidos) que no es el proyecto de la práctica: la idea es que entiendas el concepto y lo apliques, no que copies.

La teoría está partida en **un archivo por módulo**.

### Índice

- Módulo 0 · ¿Qué es una API?
  - 0.1 Cliente y servidor
  - 0.2 Anatomía de un pedido HTTP
  - 0.3 Los verbos HTTP
  - 0.4 Status codes que vas a usar siempre
  - 0.5 PUT y PATCH no son lo mismo
- Módulo 1 · Modelar una API
  - 1.1 Modelar = decidir qué se puede hacer y cómo se pide
  - 1.2 Paso 1: identificar recursos
  - 1.3 Paso 2: aplicar el estilo REST
  - 1.4 Paso 3: relaciones entre recursos (anidamiento)
  - 1.5 Paso 4: filtros, orden y paginación con query params
  - 1.6 Paso 5: acciones que no son CRUD
  - 1.7 Convenciones de nombres
  - 1.8 Forma de las respuestas
  - 1.9 Del DER a los recursos
  - 1.10 Path params, query params y body: dónde viaja cada dato
- Módulo 2 · API Contract y documentación
  - 2.1 ¿Qué es un API Contract?
  - 2.2 Qué tiene que definir el contrato de un endpoint
  - 2.3 OpenAPI / Swagger: el estándar
  - 2.4 ¿Qué más se documenta además de los endpoints?
  - 2.5 Regla de oro
  - 2.6 Anatomía de un documento OpenAPI
  - 2.7 Schemas: la forma de los datos
  - 2.8 Contrato primero, código después
- Módulo 3 · TypeScript básico
  - 3.1 ¿Qué es TypeScript y por qué lo usamos?
  - 3.2 Tipos básicos
  - 3.3 Tipar funciones
  - 3.4 Interfaces: la forma de un objeto
  - 3.5 `type`: alias y combinaciones
  - 3.6 Tipos derivados: `Omit`, `Partial`, `Pick`
  - 3.7 `any` y `unknown`: cuando no sabés el tipo
  - 3.8 Instalar y correr TypeScript
  - 3.9 Genéricos: tipos con parámetros
  - 3.10 `async` y `Promise<T>`
- Módulo 4 · Express.js
  - 4.1 ¿Qué es Express?
  - 4.2 Crear el proyecto
  - 4.3 El servidor mínimo
  - 4.4 Anatomía de una ruta
  - 4.5 Leer datos del pedido (`req`)
  - 4.6 Responder (`res`)
  - 4.7 Ejemplo completo: GET uno y POST
  - 4.8 TypeScript y el body: la frontera con el mundo exterior
  - 4.9 Middleware: funciones que se ejecutan "en el medio"
  - 4.10 Probar la API
  - 4.11 Routers: agrupar rutas por recurso
  - 4.12 Convertir lo que llega por query string
- Módulo 5 · Arquitectura y MVC
  - 5.1 ¿Qué es la arquitectura de software?
  - 5.2 MVC: Modelo – Vista – Controlador
  - 5.3 Cómo fluye un pedido en MVC
  - 5.4 Estructura de carpetas
  - 5.5 El código, capa por capa
  - 5.6 Una capa más cuando crece: servicios
  - 5.7 Cómo dibujar un diagrama de arquitectura
  - 5.8 ORM: hablar con la base sin escribir SQL
  - 5.9 La capa de repositorios
  - 5.10 DTOs: lo que entra y sale de la API
- Módulo 6 · SOLID y buenas prácticas
  - 6.1 Buenas prácticas básicas (antes de SOLID)
  - 6.2 Manejo de errores centralizado en Express
  - 6.3 Los principios SOLID
  - 6.4 S — Single Responsibility (Responsabilidad única)
  - 6.5 O — Open/Closed (Abierto/Cerrado)
  - 6.6 L — Liskov Substitution (Sustitución de Liskov)
  - 6.7 I — Interface Segregation (Segregación de interfaces)
  - 6.8 D — Dependency Inversion (Inversión de dependencias)
  - 6.9 Resumen SOLID en una tabla
- Anexos: A · Cheatsheet (Express, TypeScript, Sequelize, OpenAPI) · B · Glosario · C · Para seguir después de la clase
