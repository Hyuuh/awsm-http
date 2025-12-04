import { Table } from "../store/server-store";
import { faker } from "@faker-js/faker";

export function generateCreateTableSql(
  table: Table,
  allTables: Table[]
): string {
  const columnsSql = table.columns.map((col) => {
    let sql = `"${col.name}" ${col.type}`;
    if (col.isPk) sql += " PRIMARY KEY";
    if (col.isNotNull) sql += " NOT NULL";
    if (col.isUnique && !col.isPk) sql += " UNIQUE";

    if (col.fkTargetTableId) {
      const targetTable = allTables.find((t) => t.id === col.fkTargetTableId);
      if (targetTable) {
        // Assuming target PK is the first PK column or 'id'
        const targetPk =
          targetTable.columns.find((c) => c.isPk) || targetTable.columns[0];
        if (targetPk) {
          sql += ` REFERENCES "${targetTable.name}"("${targetPk.name}")`;
        }
      }
    }

    return sql;
  });

  return `CREATE TABLE IF NOT EXISTS "${table.name}" (\n  ${columnsSql.join(
    ",\n  "
  )}\n);`;
}

export function generateInsertSql(table: Table, count: number = 10): string[] {
  const statements: string[] = [];

  for (let i = 0; i < count; i++) {
    const values = table.columns.map((col) => {
      if (col.isPk && col.type === "INTEGER") {
        // Let SQLite handle auto-increment if it's INTEGER PRIMARY KEY
        // But if we are generating inserts, we might want to skip it or provide null
        return "NULL";
      }

      if (col.fakerExpression) {
        try {
          const expr = col.fakerExpression.includes("{{")
            ? col.fakerExpression
            : `{{${col.fakerExpression}}}`;
          return `'${faker.helpers.fake(expr).replace(/'/g, "''")}'`;
        } catch (e) {
          console.warn(`Failed to generate fake data for ${col.name}:`, e);
          return "NULL";
        }
      }

      // Default fallbacks based on type
      switch (col.type) {
        case "INTEGER":
          return Math.floor(Math.random() * 1000).toString();
        case "REAL":
          return (Math.random() * 1000).toFixed(2);
        case "BOOLEAN":
          return Math.random() > 0.5 ? "1" : "0";
        case "TEXT":
          return `'${faker.lorem.word()}'`;
        case "BLOB":
          return "NULL";
        default:
          return "NULL";
      }
    });

    statements.push(
      `INSERT INTO "${table.name}" (${table.columns
        .map((c) => `"${c.name}"`)
        .join(", ")}) VALUES (${values.join(", ")});`
    );
  }

  return statements;
}
