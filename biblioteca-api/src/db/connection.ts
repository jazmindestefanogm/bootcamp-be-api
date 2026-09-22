import { Sequelize } from "sequelize";

// Conexión a PostgreSQL.
// Antes de usarla, creá en pgAdmin una base vacía llamada `library`.
// 👇 Cambiá estos datos por los de tu instalación de Postgres.
const DATABASE = "library";
const USER = "postgres";
const PASSWORD = "postgres"; // la que elegiste al instalar Postgres
const HOST = "localhost";
const PORT = 5432;

export const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
  dialect: "postgres",
  host: HOST,
  port: PORT,
  logging: false, // poné `console.log` si querés ver el SQL que genera Sequelize
});
