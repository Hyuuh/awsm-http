use serde::Serialize;
use std::collections::HashMap;
use std::str::FromStr;
use std::time::Instant;

#[derive(Debug, Serialize)]
pub struct HttpResponse {
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
    time: u64,
    size: u64,
}

#[tauri::command]
async fn make_request(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    let method = reqwest::Method::from_str(&method).map_err(|e| e.to_string())?;

    let mut request_builder = client.request(method, &url);

    for (key, value) in headers {
        request_builder = request_builder.header(key, value);
    }

    if let Some(body_content) = body {
        request_builder = request_builder.body(body_content);
    }

    let start_time = Instant::now();
    let response = request_builder.send().await.map_err(|e| e.to_string())?;
    let time = start_time.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("")
        .to_string();

    let mut response_headers = HashMap::new();
    for (key, value) in response.headers() {
        response_headers.insert(
            key.as_str().to_string(),
            value.to_str().unwrap_or("").to_string(),
        );
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let size = bytes.len() as u64;
    let body_str = String::from_utf8_lossy(&bytes).to_string();

    Ok(HttpResponse {
        status,
        status_text,
        headers: response_headers,
        body: body_str,
        time,
        size,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![make_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
