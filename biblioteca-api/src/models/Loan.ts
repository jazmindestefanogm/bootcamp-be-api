import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../db/connection.js";

// Tabla: loans (préstamos)
// ────────────────────────
// id            INTEGER PK AUTOINCREMENT
// book_id       INTEGER      NOT NULL  FK → books.id
// member_name   VARCHAR(100) NOT NULL  (nombre del socio)
// loan_date     DATE         NOT NULL  (formato YYYY-MM-DD)
// return_date   DATE         NULL      (null = todavía no lo devolvió)

export class Loan extends Model<InferAttributes<Loan>, InferCreationAttributes<Loan>> {
  declare id: CreationOptional<number>;
  declare book_id: number;
  declare member_name: string;
  declare loan_date: string;
  declare return_date: CreationOptional<string | null>;
}

Loan.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    book_id: { type: DataTypes.INTEGER, allowNull: false },
    member_name: { type: DataTypes.STRING(100), allowNull: false },
    loan_date: { type: DataTypes.DATEONLY, allowNull: false },
    return_date: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null },
  },
  { sequelize, tableName: "loans", timestamps: false }
);
