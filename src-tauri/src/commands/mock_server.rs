use axum::{
    extract::State as AxumState,
    http::{header, Method, StatusCode, Uri},
    response::{IntoResponse, Response},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::{
    sqlite::{SqlitePool, SqliteRow},
    Column, Row, TypeInfo,
};
use std::collections::HashMap;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;

#[derive(Debug, Deserialize, Clone)]
pub struct RouteConfig {
    path: String,
    table_name: String,
}

#[derive(Deserialize)]
struct PaginationParams {
    page: Option<u32>,
    #[serde(rename = "pageSize")]
    page_size: Option<u32>,
}

#[derive(Default)]
pub struct MockServerState {
    pub server_handle: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    routes: HashMap<String, String>,
    default_page_size: u32,
}

#[tauri::command]
pub async fn start_mock_server(
    app: AppHandle,
    state: State<'_, MockServerState>,
    port: u16,
    db_path: String,
    routes: Vec<RouteConfig>,
    default_page_size: u32,
) -> Result<String, String> {
    let mut handle = state.server_handle.lock().await;
    if handle.is_some() {
        // Stop existing
        if let Some(tx) = handle.take() {
            let _ = tx.send(());
        }
    }

    let mut route_map = HashMap::new();
    for route in routes {
        // Ensure path starts with / and doesn't end with / unless it's root
        let clean_path = if !route.path.starts_with('/') {
            format!("/{}", route.path)
        } else {
            route.path
        };
        route_map.insert(clean_path, route.table_name);
    }

    // Resolve DB path relative to AppConfig if it's just a filename
    let db_file_path = if db_path.contains('/') || db_path.contains('\\') {
        std::path::PathBuf::from(db_path)
    } else {
        app.path()
            .app_config_dir()
            .map_err(|e| e.to_string())?
            .join(db_path)
    };

    let conn_str = format!("sqlite:{}", db_file_path.to_string_lossy());
    let pool = SqlitePool::connect(&conn_str).await.map_err(|e| {
        format!(
            "Failed to connect to DB at {}: {}",
            db_file_path.display(),
            e
        )
    })?;

    let app_state = AppState {
        db: pool,
        routes: route_map,
        default_page_size,
    };

    let app = Router::new()
        .fallback(handle_request)
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| format!("Failed to bind port {}: {}", port, e))?;

    let (tx, rx) = tokio::sync::oneshot::channel();

    tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                rx.await.ok();
            })
            .await
            .unwrap();
    });

    *handle = Some(tx);

    Ok(format!("Server started on port {}", port))
}

#[tauri::command]
pub async fn restart_mock_server(
    app: AppHandle,
    state: State<'_, MockServerState>,
    port: u16,
    db_path: String,
    routes: Vec<RouteConfig>,
    default_page_size: u32,
) -> Result<String, String> {
    let _ = stop_mock_server(state.clone()).await;
    start_mock_server(app, state, port, db_path, routes, default_page_size).await
}

#[tauri::command]
pub async fn stop_mock_server(state: State<'_, MockServerState>) -> Result<String, String> {
    let mut handle = state.server_handle.lock().await;
    if let Some(tx) = handle.take() {
        let _ = tx.send(());
        Ok("Server stopped".to_string())
    } else {
        Ok("No server running".to_string())
    }
}

async fn handle_request(
    AxumState(state): AxumState<AppState>,
    uri: Uri,
    method: Method,
    body: String,
) -> Response {
    let json_body = if !body.is_empty() {
        match serde_json::from_str::<Value>(&body) {
            Ok(v) => Some(Json(v)),
            Err(_) => None,
        }
    } else {
        None
    };

    let mut response = handle_request_inner(state, uri, method, json_body)
        .await
        .into_response();
    response
        .headers_mut()
        .insert(header::CONTENT_TYPE, "application/json".parse().unwrap());
    response
}

async fn handle_request_inner(
    state: AppState,
    uri: Uri,
    method: Method,
    body: Option<Json<Value>>,
) -> impl IntoResponse {
    let path = uri.path();

    // Find matching route
    // We look for the longest prefix match
    let mut matched_table = None;
    let mut matched_prefix = "";

    for (route_path, table) in &state.routes {
        if path == *route_path || path.starts_with(&format!("{}/", route_path)) {
            if route_path.len() > matched_prefix.len() {
                matched_prefix = route_path;
                matched_table = Some(table);
            }
        }
    }

    let table_name = match matched_table {
        Some(t) => t,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Route not found"})),
            )
                .into_response()
        }
    };

    // Extract ID if present
    // path: /users/123 -> prefix: /users -> suffix: /123
    let suffix = &path[matched_prefix.len()..];
    let id = suffix.trim_start_matches('/');

    match method {
        Method::GET => {
            if id.is_empty() {
                // List with pagination
                let params: PaginationParams = uri
                    .query()
                    .map(|q| {
                        serde_urlencoded::from_str(q).unwrap_or(PaginationParams {
                            page: None,
                            page_size: None,
                        })
                    })
                    .unwrap_or(PaginationParams {
                        page: None,
                        page_size: None,
                    });

                let page = params.page.unwrap_or(1).max(1);
                let page_size = params.page_size.unwrap_or(state.default_page_size).max(1);
                let offset = (page - 1) * page_size;

                // Get total count
                let count_query = format!("SELECT COUNT(*) as count FROM \"{}\"", table_name);
                let total: i64 = match sqlx::query(&count_query).fetch_one(&state.db).await {
                    Ok(row) => row.try_get("count").unwrap_or(0),
                    Err(_) => 0,
                };

                let page_count = (total as f64 / page_size as f64).ceil() as u32;

                let query = format!("SELECT * FROM \"{}\" LIMIT ? OFFSET ?", table_name);
                match sqlx::query(&query)
                    .bind(page_size)
                    .bind(offset)
                    .fetch_all(&state.db)
                    .await
                {
                    Ok(rows) => {
                        let result: Vec<Value> = rows.iter().map(row_to_json).collect();
                        let response = json!({
                            "data": result,
                            "meta": {
                                "pagination": {
                                    "page": page,
                                    "pageSize": page_size,
                                    "pageCount": page_count,
                                    "total": total
                                }
                            }
                        });
                        (StatusCode::OK, Json(response)).into_response()
                    }
                    Err(e) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({"error": e.to_string()})),
                    )
                        .into_response(),
                }
            } else {
                // Get one
                let query = format!("SELECT * FROM \"{}\" WHERE id = ?", table_name);
                match sqlx::query(&query).bind(id).fetch_optional(&state.db).await {
                    Ok(Some(row)) => (StatusCode::OK, Json(row_to_json(&row))).into_response(),
                    Ok(None) => {
                        (StatusCode::NOT_FOUND, Json(json!({"error": "Not found"}))).into_response()
                    }
                    Err(e) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({"error": e.to_string()})),
                    )
                        .into_response(),
                }
            }
        }
        Method::POST => {
            if let Some(Json(data)) = body {
                if let Value::Object(map) = data {
                    let columns: Vec<String> = map.keys().cloned().collect();
                    let values: Vec<String> = (0..columns.len()).map(|_| "?".to_string()).collect();
                    let sql = format!(
                        "INSERT INTO \"{}\" ({}) VALUES ({}) RETURNING *",
                        table_name,
                        columns
                            .iter()
                            .map(|c| format!("\"{}\"", c))
                            .collect::<Vec<_>>()
                            .join(", "),
                        values.join(", ")
                    );

                    let mut query = sqlx::query(&sql);
                    for key in &columns {
                        let val = &map[key];
                        query = bind_json_value(query, val);
                    }

                    match query.fetch_one(&state.db).await {
                        Ok(row) => (StatusCode::CREATED, Json(row_to_json(&row))).into_response(),
                        Err(e) => (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({"error": e.to_string()})),
                        )
                            .into_response(),
                    }
                } else {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(json!({"error": "Body must be an object"})),
                    )
                        .into_response()
                }
            } else {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "Missing body"})),
                )
                    .into_response()
            }
        }
        Method::PUT => {
            if id.is_empty() {
                return (
                    StatusCode::METHOD_NOT_ALLOWED,
                    Json(json!({"error": "Method not allowed on collection"})),
                )
                    .into_response();
            }
            if let Some(Json(data)) = body {
                if let Value::Object(map) = data {
                    let columns: Vec<String> = map.keys().cloned().collect();
                    let set_clause = columns
                        .iter()
                        .map(|c| format!("\"{}\" = ?", c))
                        .collect::<Vec<_>>()
                        .join(", ");

                    let sql = format!(
                        "UPDATE \"{}\" SET {} WHERE id = ? RETURNING *",
                        table_name, set_clause
                    );

                    let mut query = sqlx::query(&sql);
                    for key in &columns {
                        let val = &map[key];
                        query = bind_json_value(query, val);
                    }
                    query = query.bind(id);

                    match query.fetch_optional(&state.db).await {
                        Ok(Some(row)) => (StatusCode::OK, Json(row_to_json(&row))).into_response(),
                        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({"error": "Not found"})))
                            .into_response(),
                        Err(e) => (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({"error": e.to_string()})),
                        )
                            .into_response(),
                    }
                } else {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(json!({"error": "Body must be an object"})),
                    )
                        .into_response()
                }
            } else {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "Missing body"})),
                )
                    .into_response()
            }
        }
        Method::DELETE => {
            if id.is_empty() {
                return (
                    StatusCode::METHOD_NOT_ALLOWED,
                    Json(json!({"error": "Method not allowed on collection"})),
                )
                    .into_response();
            }
            let sql = format!("DELETE FROM \"{}\" WHERE id = ?", table_name);
            match sqlx::query(&sql).bind(id).execute(&state.db).await {
                Ok(res) => {
                    if res.rows_affected() > 0 {
                        (StatusCode::OK, Json(json!({"success": true}))).into_response()
                    } else {
                        (StatusCode::NOT_FOUND, Json(json!({"error": "Not found"}))).into_response()
                    }
                }
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": e.to_string()})),
                )
                    .into_response(),
            }
        }
        _ => (
            StatusCode::METHOD_NOT_ALLOWED,
            Json(json!({"error": "Method not allowed"})),
        )
            .into_response(),
    }
}

fn row_to_json(row: &SqliteRow) -> Value {
    let mut map = serde_json::Map::new();
    for col in row.columns() {
        let name = col.name();
        let type_info = col.type_info();
        let type_name = type_info.name();

        let value: Value = match type_name {
            "INTEGER" => {
                if let Ok(v) = row.try_get::<Option<i64>, _>(name) {
                    match v {
                        Some(i) => json!(i),
                        None => Value::Null,
                    }
                } else {
                    Value::Null
                }
            }
            "REAL" => {
                if let Ok(v) = row.try_get::<Option<f64>, _>(name) {
                    match v {
                        Some(f) => json!(f),
                        None => Value::Null,
                    }
                } else {
                    Value::Null
                }
            }
            "TEXT" => {
                if let Ok(v) = row.try_get::<Option<String>, _>(name) {
                    match v {
                        Some(s) => json!(s),
                        None => Value::Null,
                    }
                } else {
                    Value::Null
                }
            }
            "BOOLEAN" => {
                if let Ok(v) = row.try_get::<Option<bool>, _>(name) {
                    match v {
                        Some(b) => json!(b),
                        None => Value::Null,
                    }
                } else {
                    Value::Null
                }
            }
            _ => Value::Null,
        };
        map.insert(name.to_string(), value);
    }
    Value::Object(map)
}

fn bind_json_value<'q>(
    query: sqlx::query::Query<'q, sqlx::Sqlite, sqlx::sqlite::SqliteArguments<'q>>,
    value: &'q Value,
) -> sqlx::query::Query<'q, sqlx::Sqlite, sqlx::sqlite::SqliteArguments<'q>> {
    match value {
        Value::Null => query.bind(Option::<String>::None),
        Value::Bool(b) => query.bind(b),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                query.bind(i)
            } else if let Some(f) = n.as_f64() {
                query.bind(f)
            } else {
                query.bind(n.to_string())
            }
        }
        Value::String(s) => query.bind(s),
        Value::Array(_) | Value::Object(_) => query.bind(value.to_string()),
    }
}
