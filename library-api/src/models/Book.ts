import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: books
// ────────────
// id          INTEGER PK AUTOINCREMENT
// title       VARCHAR(200) NOT NULL
// year        INTEGER      NOT NULL
// author_id   INTEGER      NOT NULL  FK → authors.id
// available   BOOLEAN      NOT NULL  DEFAULT true

export class Book extends Model<InferAttributes<Book>, InferCreationAttributes<Book>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare year: number;
  declare author_id: number;
  declare available: CreationOptional<boolean>;
}

Book.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: "books", timestamps: false }
);
