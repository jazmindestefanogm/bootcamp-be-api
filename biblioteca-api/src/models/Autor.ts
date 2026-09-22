import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: autores
// ──────────────
// id             INTEGER PK AUTOINCREMENT
// nombre         VARCHAR(100) NOT NULL
// nacionalidad   VARCHAR(50)  NOT NULL

export class Autor extends Model<InferAttributes<Autor>, InferCreationAttributes<Autor>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare nacionalidad: string;
}

Autor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    nacionalidad: { type: DataTypes.STRING(50), allowNull: false },
  },
  { sequelize, tableName: "autores", timestamps: false }
);
