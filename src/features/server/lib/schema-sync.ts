import Database from "@tauri-apps/plugin-sql";
import { Table, Column, ColumnType } from "../store/server-store";
import { generateCreateTableSql } from "./sql-generator";
import { v4 as uuidv4 } from "uuid";

async function recreateTable(db: Database, table: Table, allTables: Table[]) {
  // 1. Rename old
  const tempName = `${table.name}_old_${Date.now()}`;
  try {
    await db.execute(`ALTER TABLE "${table.name}" RENAME TO "${tempName}"`);
  } catch (e) {
    // Table might not exist or busy?
    console.error("Failed to rename table", e);
    return;
  }

  // 2. Create new
  // generateCreateTableSql uses "IF NOT EXISTS", which is fine.
  const createSql = generateCreateTableSql(table, allTables);
  await db.execute(createSql);

  // 3. Copy data
  try {
    const oldColsResult = await db.select<any[]>(
      `PRAGMA table_info("${tempName}")`
    );
    const oldColNames = oldColsResult.map((c) => c.name);
    const newColNames = table.columns.map((c) => c.name);

    const commonCols = newColNames.filter((c) => oldColNames.includes(c));

    if (commonCols.length > 0) {
      const colsStr = commonCols.map((c) => `"${c}"`).join(", ");
      await db.execute(
        `INSERT INTO "${table.name}" (${colsStr}) SELECT ${colsStr} FROM "${tempName}"`
      );
    }
  } catch (e) {
    console.error("Failed to copy data", e);
  }

  // 4. Drop old
  try {
    await db.execute(`DROP TABLE "${tempName}"`);
  } catch (e) {
    console.error("Failed to drop temp table", e);
  }
}

export async function syncSchema(db: Database, tables: Table[]) {
  // 0. Ensure meta table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _awsm_meta (
      table_name TEXT PRIMARY KEY,
      path TEXT,
      pos_x REAL,
      pos_y REAL
    )
  `);

  // 1. Get existing tables
  const existingTablesResult = await db.select<any[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_awsm_meta'"
  );
  const existingTableNames = new Set(existingTablesResult.map((t) => t.name));

  for (const table of tables) {
    // Save metadata
    await db.execute(
      `INSERT INTO _awsm_meta (table_name, path, pos_x, pos_y) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT(table_name) DO UPDATE SET 
         path=excluded.path, pos_x=excluded.pos_x, pos_y=excluded.pos_y`,
      [table.name, table.path || null, table.position.x, table.position.y]
    );

    if (!existingTableNames.has(table.name)) {
      // Create new table
      const sql = generateCreateTableSql(table, tables);
      await db.execute(sql);
    } else {
      // Update existing table
      // We use the recreate strategy to ensure all schema changes (FKs, types, etc.) are applied.
      await recreateTable(db, table, tables);
    }
  }
}

export async function loadSchemaFromDb(db: Database): Promise<Table[]> {
  const tablesResult = await db.select<any[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_awsm_meta'"
  );

  // Load metadata
  let meta: Record<string, any> = {};
  try {
    const metaRows = await db.select<any[]>("SELECT * FROM _awsm_meta");
    metaRows.forEach((r) => {
      meta[r.table_name] = r;
    });
  } catch (e) {
    // Meta table might not exist yet
  }

  const tables: Table[] = [];

  // First pass: Create tables and columns
  for (const t of tablesResult) {
    const tableId = uuidv4();
    const columnsResult = await db.select<any[]>(
      `PRAGMA table_info("${t.name}")`
    );

    const columns: Column[] = columnsResult.map((c) => ({
      id: uuidv4(),
      name: c.name,
      type: c.type as ColumnType,
      isPk: !!c.pk,
      isNotNull: !!c.notnull,
      isUnique: false, // Hard to get from PRAGMA table_info
    }));

    const m = meta[t.name];
    tables.push({
      id: tableId,
      name: t.name,
      path: m?.path,
      columns,
      position: { x: m?.pos_x || 0, y: m?.pos_y || 0 },
    });
  }

  // Second pass: Resolve Foreign Keys
  for (const table of tables) {
    try {
      const fks = await db.select<any[]>(
        `PRAGMA foreign_key_list("${table.name}")`
      );
      // fks: id, seq, table, from, to, on_update, on_delete, match

      for (const fk of fks) {
        const sourceCol = table.columns.find((c) => c.name === fk.from);
        const targetTable = tables.find((t) => t.name === fk.table);

        if (sourceCol && targetTable) {
          sourceCol.fkTargetTableId = targetTable.id;
          // Try to find target column
          // 'to' is the column name in the target table
          if (fk.to) {
            const targetCol = targetTable.columns.find((c) => c.name === fk.to);
            if (targetCol) {
              sourceCol.fkTargetColumnId = targetCol.id;
            }
          } else {
            // If 'to' is null, it defaults to PK of target table
            const targetPk = targetTable.columns.find((c) => c.isPk);
            if (targetPk) {
              sourceCol.fkTargetColumnId = targetPk.id;
            }
          }
        }
      }
    } catch (e) {
      console.error(`Failed to load FKs for table ${table.name}`, e);
    }
  }

  return tables;
}
