import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: libros
// ─────────────
// id           INTEGER PK AUTOINCREMENT
// titulo       VARCHAR(200) NOT NULL
// anio         INTEGER      NOT NULL
// autor_id     INTEGER      NOT NULL  FK → autores.id
// disponible   BOOLEAN      NOT NULL  DEFAULT true

export class Libro extends Model<InferAttributes<Libro>, InferCreationAttributes<Libro>> {
  declare id: CreationOptional<number>;
  declare titulo: string;
  declare anio: number;
  declare autor_id: number;
  declare disponible: CreationOptional<boolean>;
}

Libro.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    anio: { type: DataTypes.INTEGER, allowNull: false },
    autor_id: { type: DataTypes.INTEGER, allowNull: false },
    disponible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: "libros", timestamps: false }
);
