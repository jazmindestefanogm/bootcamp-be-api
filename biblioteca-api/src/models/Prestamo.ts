import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: prestamos
// ────────────────
// id                 INTEGER PK AUTOINCREMENT
// libro_id           INTEGER      NOT NULL  FK → libros.id
// socio_nombre       VARCHAR(100) NOT NULL
// fecha_prestamo     DATE         NOT NULL   (formato YYYY-MM-DD)
// fecha_devolucion   DATE         NULL       (null = todavía no lo devolvió)

export class Prestamo extends Model<InferAttributes<Prestamo>, InferCreationAttributes<Prestamo>> {
  declare id: CreationOptional<number>;
  declare libro_id: number;
  declare socio_nombre: string;
  declare fecha_prestamo: string;
  declare fecha_devolucion: CreationOptional<string | null>;
}

Prestamo.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    libro_id: { type: DataTypes.INTEGER, allowNull: false },
    socio_nombre: { type: DataTypes.STRING(100), allowNull: false },
    fecha_prestamo: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_devolucion: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
  },
  { sequelize, tableName: "prestamos", timestamps: false }
);
