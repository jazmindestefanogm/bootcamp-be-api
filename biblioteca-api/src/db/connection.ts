import { Sequelize } from "sequelize";

// Conexión a PostgreSQL.
// Antes de usarla, creá en pgAdmin una base vacía llamada `biblioteca`.
// 👇 Cambiá estos datos por los de tu instalación de Postgres.
const BASE = "biblioteca";
const USUARIO = "postgres";
const CONTRASENIA = "postgres"; // la que elegiste al instalar Postgres
const HOST = "localhost";
const PUERTO = 5432;

export const sequelize = new Sequelize(BASE, USUARIO, CONTRASENIA, {
  dialect: "postgres",
  host: HOST,
  port: PUERTO,
  logging: false, // poné `console.log` si querés ver el SQL que genera Sequelize
});
