import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: authors
// ──────────────
// id            INTEGER PK AUTOINCREMENT
// name          VARCHAR(100) NOT NULL
// nationality   VARCHAR(50)  NOT NULL

export class Author extends Model<InferAttributes<Author>, InferCreationAttributes<Author>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare nationality: string;
}

Author.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    nationality: { type: DataTypes.STRING(50), allowNull: false },
  },
  { sequelize, tableName: "authors", timestamps: false }
);
