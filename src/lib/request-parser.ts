/**
 * curl/fetch 请求解析器
 * 支持将 curl 命令和 fetch 代码转换为结构化的请求对象
 */

export interface ParsedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
}

/**
 * 解析 curl 命令
 */
export function parseCurl(curlCommand: string): ParsedRequest {
  let url = '';
  let method = 'GET';
  const headers: Record<string, string> = {};
  let body: string | undefined;

  // 移除换行符和多余空格
  const cleanCommand = curlCommand
    .replace(/\\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 提取 URL
  const urlMatch = cleanCommand.match(/curl\s+(?:-[A-Za-z]\s+\S+\s+)*(?:'|")?([^'">\s]+)(?:'|")?/);
  if (urlMatch) {
    url = urlMatch[1];
  }

  // 提取 method
  const methodMatch = cleanCommand.match(/-X\s+([A-Z]+)/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // 提取 headers
  const headerMatches = cleanCommand.matchAll(/-H\s+['"](.*?)['"]/g);
  for (const match of headerMatches) {
    const headerLine = match[1];
    const colonIndex = headerLine.indexOf(':');
    if (colonIndex !== -1) {
      const key = headerLine.substring(0, colonIndex).trim();
      const value = headerLine.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  // 提取 body
  const dataMatch = cleanCommand.match(/(?:--data-raw|--data|-d)\s+['"](.*)['"]$/);
  if (dataMatch) {
    body = dataMatch[1].replace(/\\"/g, '"');
  }

  // 提取查询参数
  const queryParams = extractQueryParams(url);

  return {
    url: url.split('?')[0], // 移除查询参数部分
    method,
    headers,
    body,
    queryParams,
  };
}

/**
 * 解析 fetch 代码
 */
export function parseFetch(fetchCode: string): ParsedRequest {
  let url = '';
  let method = 'GET';
  const headers: Record<string, string> = {};
  let body: string | undefined;

  // 移除换行符和多余空格
  const cleanCode = fetchCode.replace(/\s+/g, ' ').trim();

  // 提取 URL
  const urlMatch = cleanCode.match(/fetch\s*\(\s*['"](.*?)['"]/);
  if (urlMatch) {
    url = urlMatch[1];
  }

  // 提取 method
  const methodMatch = cleanCode.match(/method\s*:\s*['"](.*?)['"]/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // 提取 headers
  const headersMatch = cleanCode.match(/headers\s*:\s*\{([^}]+)\}/);
  if (headersMatch) {
    const headersStr = headersMatch[1];
    const headerPairs = headersStr.split(',');
    for (const pair of headerPairs) {
      const [key, value] = pair.split(':').map((s) => s.trim());
      if (key && value) {
        // 移除引号
        const cleanKey = key.replace(/['"]/g, '');
        const cleanValue = value.replace(/['"]/g, '');
        headers[cleanKey] = cleanValue;
      }
    }
  }

  // 提取 body
  const bodyMatch = cleanCode.match(/body\s*:\s*(?:JSON\.stringify\s*\()?(.*?)(?:\))?(?:,|\})/);
  if (bodyMatch) {
    let bodyContent = bodyMatch[1].trim();
    // 如果是 JSON.stringify 包裹的，尝试格式化
    if (cleanCode.includes('JSON.stringify')) {
      try {
        // 移除外层引号
        bodyContent = bodyContent.replace(/^['"]|['"]$/g, '');
        // 尝试解析并重新格式化
        const parsed = JSON.parse(bodyContent);
        body = JSON.stringify(parsed, null, 2);
      } catch {
        body = bodyContent;
      }
    } else {
      body = bodyContent;
    }
  }

  // 提取查询参数
  const queryParams = extractQueryParams(url);

  return {
    url: url.split('?')[0],
    method,
    headers,
    body,
    queryParams,
  };
}

/**
 * 提取 URL 中的查询参数
 */
function extractQueryParams(url: string): Record<string, string> {
  const queryParams: Record<string, string> = {};
  const queryStart = url.indexOf('?');

  if (queryStart !== -1) {
    const queryString = url.substring(queryStart + 1);
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
  }

  return queryParams;
}

/**
 * 自动检测并解析请求
 */
export function parseRequest(input: string): ParsedRequest | null {
  const trimmed = input.trim();

  // 检测是否为 curl 命令
  if (trimmed.startsWith('curl ')) {
    try {
      return parseCurl(trimmed);
    } catch (error) {
      console.error('Failed to parse curl:', error);
      return null;
    }
  }

  // 检测是否为 fetch 代码
  if (trimmed.includes('fetch(')) {
    try {
      return parseFetch(trimmed);
    } catch (error) {
      console.error('Failed to parse fetch:', error);
      return null;
    }
  }

  return null;
}

/**
 * 格式化 headers 为字符串
 */
export function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * 解析 headers 字符串为对象
 */
export function parseHeaders(headersStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = headersStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  return headers;
}

/**
 * 示例用法：
 *
 * const curlExample = `curl 'https://api.example.com/users?page=1' \
 *   -H 'Authorization: Bearer token123' \
 *   -H 'Content-Type: application/json' \
 *   -X POST \
 *   --data-raw '{"name":"John","email":"john@example.com"}'`;
 *
 * const fetchExample = `fetch('https://api.example.com/users?page=1', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Bearer token123',
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({ name: 'John', email: 'john@example.com' })
 * })`;
 *
 * const curlResult = parseCurl(curlExample);
 * const fetchResult = parseFetch(fetchExample);
 * const autoResult = parseRequest(curlExample); // 自动检测
 */
