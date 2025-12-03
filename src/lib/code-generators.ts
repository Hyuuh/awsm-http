import { RequestData, RequestAuth, RequestHeader, RequestParam } from "@/types";

function buildUrl(url: string, params: RequestParam[]): string {
  const enabledParams = params.filter((p) => p.enabled && p.key);
  if (enabledParams.length === 0) return url;

  const queryString = enabledParams
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
}

function getHeaders(
  headers: RequestHeader[],
  auth: RequestAuth
): Record<string, string> {
  const headerMap: Record<string, string> = {};

  headers.forEach((h) => {
    if (h.enabled && h.key) {
      headerMap[h.key] = h.value;
    }
  });

  if (auth.type === "basic") {
    const username = auth.basic?.username || "";
    const password = auth.basic?.password || "";
    const encoded = btoa(`${username}:${password}`);
    headerMap["Authorization"] = `Basic ${encoded}`;
  } else if (auth.type === "bearer") {
    headerMap["Authorization"] = `Bearer ${auth.bearer?.token || ""}`;
  } else if (
    auth.type === "apikey" &&
    auth.apikey?.addTo === "header" &&
    auth.apikey?.key
  ) {
    headerMap[auth.apikey.key] = auth.apikey.value || "";
  }

  return headerMap;
}

export function generateCurl(data: RequestData): string {
  const url = buildUrl(data.url, data.params);
  const headers = getHeaders(data.headers, data.auth);

  let cmd = `curl -X ${data.method} "${url}"`;

  Object.entries(headers).forEach(([key, value]) => {
    cmd += ` \\\n  -H "${key}: ${value}"`;
  });

  if (data.method !== "GET") {
    if (data.body.type === "json") {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '${data.body.content}'`;
    } else if (data.body.type === "text") {
      cmd += ` \\\n  -H "Content-Type: text/plain"`;
      cmd += ` \\\n  -d '${data.body.content}'`;
    } else if (data.body.type === "x-www-form-urlencoded") {
      cmd += ` \\\n  -H "Content-Type: application/x-www-form-urlencoded"`;
      const formParams = data.body.formUrlEncoded || [];
      const enabledParams = formParams.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const dataStr = enabledParams
          .map(
            (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
          )
          .join("&");
        cmd += ` \\\n  -d "${dataStr}"`;
      }
    } else if (data.body.type === "form-data") {
      // curl -F "key=value"
      const formData = data.body.formData || [];
      formData.forEach((item) => {
        if (item.enabled && item.key) {
          if (item.type === "file") {
            cmd += ` \\\n  -F "${item.key}=@${item.value}"`;
          } else {
            cmd += ` \\\n  -F "${item.key}=${item.value}"`;
          }
        }
      });
    }
  }
  return cmd;
}

export function generateJsFetch(data: RequestData): string {
  const url = buildUrl(data.url, data.params);
  const headers = getHeaders(data.headers, data.auth);

  const options: any = {
    method: data.method,
    headers: headers,
  };

  if (data.method !== "GET") {
    if (data.body.type === "json") {
      options.headers["Content-Type"] = "application/json";
      try {
        options.body = JSON.parse(data.body.content);
      } catch {}
    } else if (data.body.type === "text") {
      options.headers["Content-Type"] = "text/plain";
    } else if (data.body.type === "x-www-form-urlencoded") {
      options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
  }

  let code = `fetch("${url}", {\n`;
  code += `  method: "${data.method}",\n`;

  if (Object.keys(options.headers).length > 0) {
    code += `  headers: {\n`;
    Object.entries(options.headers).forEach(([k, v]) => {
      code += `    "${k}": "${v}",\n`;
    });
    code += `  },\n`;
  }

  if (data.method !== "GET") {
    if (data.body.type === "json") {
      try {
        const parsed = JSON.parse(data.body.content);
        const formatted = JSON.stringify(parsed, null, 2);
        const indented = formatted
          .split("\n")
          .map((line, i) => {
            if (i === 0) return line;
            return "    " + line;
          })
          .join("\n");
        code += `  body: JSON.stringify(${indented}),\n`;
      } catch {
        code += `  body: JSON.stringify(${data.body.content}),\n`;
      }
    } else if (data.body.type === "text") {
      code += `  body: ${JSON.stringify(data.body.content)},\n`;
    } else if (data.body.type === "x-www-form-urlencoded") {
      const formParams = data.body.formUrlEncoded || [];
      const enabledParams = formParams.filter((p) => p.enabled && p.key);
      const paramsObj: Record<string, string> = {};
      enabledParams.forEach((p) => (paramsObj[p.key] = p.value));
      code += `  body: new URLSearchParams(${JSON.stringify(paramsObj)}),\n`;
    } else if (data.body.type === "form-data") {
    }
  }

  code += `});`;

  if (data.body.type === "form-data") {
    let preCode = `const formData = new FormData();\n`;
    const formData = data.body.formData || [];
    formData.forEach((item) => {
      if (item.enabled && item.key) {
        preCode += `formData.append("${item.key}", "${item.value}");\n`;
      }
    });

    code =
      preCode +
      `\nfetch("${url}", {\n  method: "${data.method}",\n  headers: {\n`;
    Object.entries(headers).forEach(([k, v]) => {
      code += `    "${k}": "${v}",\n`;
    });
    code += `  },\n  body: formData\n});`;
  }

  return code;
}

export function generatePythonRequests(data: RequestData): string {
  const url = buildUrl(data.url, data.params);
  const headers = getHeaders(data.headers, data.auth);

  let code = `import requests\n\n`;
  code += `url = "${url}"\n\n`;

  if (Object.keys(headers).length > 0) {
    code += `headers = {\n`;
    Object.entries(headers).forEach(([k, v]) => {
      code += `    "${k}": "${v}",\n`;
    });
    code += `}\n\n`;
  } else {
    code += `headers = {}\n\n`;
  }

  let dataArg = "";

  if (data.method !== "GET") {
    if (data.body.type === "json") {
      code += `json_data = ${data.body.content}\n\n`;
      dataArg = ", json=json_data";
    } else if (data.body.type === "text") {
      code += `data = ${JSON.stringify(data.body.content)}\n\n`;
      dataArg = ", data=data";
    } else if (data.body.type === "x-www-form-urlencoded") {
      const formParams = data.body.formUrlEncoded || [];
      const enabledParams = formParams.filter((p) => p.enabled && p.key);
      const paramsObj: Record<string, string> = {};
      enabledParams.forEach((p) => (paramsObj[p.key] = p.value));
      code += `data = ${JSON.stringify(paramsObj)}\n\n`;
      dataArg = ", data=data";
    } else if (data.body.type === "form-data") {
      const formData = data.body.formData || [];
      const filesObj: Record<string, any> = {};

      formData.forEach((item) => {
        if (item.enabled && item.key) {
          filesObj[item.key] = item.value;
        }
      });
      code += `files = ${JSON.stringify(filesObj)}\n\n`;
      dataArg = ", files=files";
    }
  }

  code += `response = requests.${data.method.toLowerCase()}(url, headers=headers${dataArg})\n\n`;
  code += `print(response.text)`;

  return code;
}

export function generateTypescriptInterfaces(
  json: any,
  rootName: string = "Root"
): string {
  const interfaces: Map<string, string> = new Map();

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getInterfaceName(key: string) {
    return capitalize(key.replace(/[^a-zA-Z0-9]/g, ""));
  }

  function parseObject(obj: any, name: string) {
    let content = `export interface ${name} {\n`;
    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];
      let type: string = typeof value;

      if (value === null) {
        type = "any"; // null is usually any or null
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          const firstItem = value[0];
          if (typeof firstItem === "object" && firstItem !== null) {
            const itemName = getInterfaceName(key);
            const singularName = itemName.endsWith("s")
              ? itemName.slice(0, -1)
              : itemName + "Item";

            parseObject(firstItem, singularName);
            type = `${singularName}[]`;
          } else {
            type = `${typeof firstItem}[]`;
          }
        } else {
          type = "any[]";
        }
      } else if (typeof value === "object") {
        const nestedName = getInterfaceName(key);
        parseObject(value, nestedName);
        type = nestedName;
      }

      content += `  ${key}: ${type};\n`;
    }
    content += "}";
    interfaces.set(name, content);
  }

  if (Array.isArray(json)) {
    if (json.length > 0 && typeof json[0] === "object") {
      parseObject(json[0], rootName);
      return (
        Array.from(interfaces.values()).reverse().join("\n\n") +
        `\n\nexport type ${rootName}List = ${rootName}[];`
      );
    }
    return `export type ${rootName} = ${typeof json[0]}[];`;
  } else if (typeof json === "object" && json !== null) {
    parseObject(json, rootName);
    return Array.from(interfaces.values()).reverse().join("\n\n");
  } else {
    return `export type ${rootName} = ${typeof json};`;
  }
}
