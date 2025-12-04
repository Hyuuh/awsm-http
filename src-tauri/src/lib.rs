mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(commands::mock_server::MockServerState::default())
        .invoke_handler(tauri::generate_handler![
            commands::http_client::make_request,
            commands::mock_server::start_mock_server,
            commands::mock_server::stop_mock_server,
            commands::mock_server::restart_mock_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
