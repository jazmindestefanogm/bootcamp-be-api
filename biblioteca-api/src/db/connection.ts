import { Sequelize } from "sequelize";

// Base de datos SQLite: un solo archivo en la raíz del proyecto.
// Se crea solo la primera vez que corrés `npm run seed`.
export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./biblioteca.sqlite",
  logging: false, // poné `console.log` si querés ver el SQL que genera Sequelize
});
