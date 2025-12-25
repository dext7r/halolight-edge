import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const openApiSpec = {"openapi":"3.0.3","info":{"title":"HaloLight RBAC API","description":"HaloLight 权限管理系统 API 文档\n\n## 认证方式\n- **Bearer Token**: 用户登录后获取的 JWT\n- **API Key**: Supabase Anon Key (header: apikey)\n- **X-API-Token**: 自定义 API 令牌 (在管理后台创建)\n\n## 服务器\n此 Swagger UI 作为 API 网关，代理请求到 Supabase 后端","version":"1.0.0","contact":{"name":"HaloLight Team"}},"servers":[],"tags":[{"name":"认证","description":"用户认证相关接口"},{"name":"用户","description":"用户管理"},{"name":"角色","description":"角色与权限管理"},{"name":"审计","description":"审计日志"},{"name":"通知","description":"系统通知"},{"name":"统计","description":"数据统计视图"},{"name":"函数","description":"RPC 函数"},{"name":"系统","description":"系统接口"}],"paths":{"/health":{"get":{"tags":["系统"],"summary":"健康检查","responses":{"200":{"description":"服务正常"}}}},"/spec":{"get":{"tags":["系统"],"summary":"OpenAPI 规范","responses":{"200":{"description":"OpenAPI JSON"}}}},"/auth/v1/signup":{"post":{"tags":["认证"],"summary":"用户注册","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["email","password"],"properties":{"email":{"type":"string","format":"email"},"password":{"type":"string","minLength":6}}}}}},"responses":{"200":{"description":"注册成功"},"400":{"description":"请求参数错误"},"422":{"description":"邮箱已被注册"}}}},"/auth/v1/token":{"post":{"tags":["认证"],"summary":"用户登录","parameters":[{"name":"grant_type","in":"query","required":true,"schema":{"type":"string","enum":["password","refresh_token"]}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["email","password"],"properties":{"email":{"type":"string","format":"email"},"password":{"type":"string"}}}}}},"responses":{"200":{"description":"登录成功"},"400":{"description":"凭证错误"}}}},"/auth/v1/logout":{"post":{"tags":["认证"],"summary":"用户登出","security":[{"bearerAuth":[]}],"responses":{"204":{"description":"登出成功"}}}},"/rest/v1/profiles":{"get":{"tags":["用户"],"summary":"获取用户列表","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"select","in":"query","schema":{"type":"string"}},{"name":"order","in":"query","schema":{"type":"string"}},{"name":"limit","in":"query","schema":{"type":"integer"}},{"name":"offset","in":"query","schema":{"type":"integer"}}],"responses":{"200":{"description":"成功"},"401":{"description":"未授权"}}},"post":{"tags":["用户"],"summary":"创建用户资料","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["user_id"],"properties":{"user_id":{"type":"string","format":"uuid"},"email":{"type":"string"},"full_name":{"type":"string"}}}}}},"responses":{"201":{"description":"创建成功"}}}},"/rest/v1/user_roles":{"get":{"tags":["角色"],"summary":"获取用户角色列表","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"user_id","in":"query","schema":{"type":"string"}},{"name":"role","in":"query","schema":{"type":"string"}}],"responses":{"200":{"description":"成功"}}},"post":{"tags":["角色"],"summary":"分配用户角色","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["user_id"],"properties":{"user_id":{"type":"string","format":"uuid"},"role":{"type":"string","enum":["admin","moderator","user"]}}}}}},"responses":{"201":{"description":"分配成功"}}}},"/rest/v1/permissions":{"get":{"tags":["角色"],"summary":"获取权限列表","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"module","in":"query","schema":{"type":"string"}}],"responses":{"200":{"description":"成功"}}},"post":{"tags":["角色"],"summary":"创建权限","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["name","module"],"properties":{"name":{"type":"string"},"module":{"type":"string"},"description":{"type":"string"}}}}}},"responses":{"201":{"description":"创建成功"}}}},"/rest/v1/role_permissions":{"get":{"tags":["角色"],"summary":"获取角色权限关联","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"role","in":"query","schema":{"type":"string"}}],"responses":{"200":{"description":"成功"}}},"post":{"tags":["角色"],"summary":"添加角色权限","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["role","permission_id"],"properties":{"role":{"type":"string"},"permission_id":{"type":"string","format":"uuid"}}}}}},"responses":{"201":{"description":"添加成功"}}}},"/rest/v1/audit_logs":{"get":{"tags":["审计"],"summary":"获取审计日志","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"action","in":"query","schema":{"type":"string"}},{"name":"user_id","in":"query","schema":{"type":"string"}},{"name":"order","in":"query","schema":{"type":"string","default":"created_at.desc"}},{"name":"limit","in":"query","schema":{"type":"integer","default":50}}],"responses":{"200":{"description":"成功"}}}},"/rest/v1/notifications":{"get":{"tags":["通知"],"summary":"获取通知列表","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"parameters":[{"name":"type","in":"query","schema":{"type":"string"}},{"name":"target_role","in":"query","schema":{"type":"string"}}],"responses":{"200":{"description":"成功"}}},"post":{"tags":["通知"],"summary":"创建通知","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["title","message"],"properties":{"title":{"type":"string"},"message":{"type":"string"},"type":{"type":"string","default":"info"},"target_role":{"type":"string"}}}}}},"responses":{"201":{"description":"创建成功"}}}},"/rest/v1/daily_activity":{"get":{"tags":["统计"],"summary":"获取每日活动统计","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"responses":{"200":{"description":"成功"}}}},"/rest/v1/role_statistics":{"get":{"tags":["统计"],"summary":"获取角色统计","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"responses":{"200":{"description":"成功"}}}},"/rest/v1/user_statistics":{"get":{"tags":["统计"],"summary":"获取用户统计","security":[{"bearerAuth":[]},{"apiKey":[]},{"xApiToken":[]}],"responses":{"200":{"description":"成功"}}}},"/rest/v1/rpc/get_user_role":{"post":{"tags":["函数"],"summary":"获取用户角色","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["_user_id"],"properties":{"_user_id":{"type":"string","format":"uuid"}}}}}},"responses":{"200":{"description":"成功"}}}},"/rest/v1/rpc/has_role":{"post":{"tags":["函数"],"summary":"检查用户角色","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["_user_id","_role"],"properties":{"_user_id":{"type":"string","format":"uuid"},"_role":{"type":"string","enum":["admin","moderator","user"]}}}}}},"responses":{"200":{"description":"成功"}}}},"/rest/v1/rpc/log_audit_event":{"post":{"tags":["函数"],"summary":"记录审计事件","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["p_action"],"properties":{"p_action":{"type":"string","enum":["user_login","user_logout","user_signup","role_change","permission_change","profile_update","password_reset","user_delete"]},"p_details":{"type":"object"},"p_target_user_id":{"type":"string","format":"uuid"}}}}}},"responses":{"200":{"description":"成功"}}}},"/api/create-user":{"post":{"tags":["用户"],"summary":"创建新用户 (Admin)","description":"需要管理员权限","security":[{"bearerAuth":[]}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["email","password"],"properties":{"email":{"type":"string","format":"email"},"password":{"type":"string","minLength":6},"full_name":{"type":"string"}}}}}},"responses":{"200":{"description":"创建成功"},"401":{"description":"未授权"},"403":{"description":"权限不足"}}}},"/api/env":{"get":{"tags":["系统"],"summary":"获取环境变量","responses":{"200":{"description":"成功"}}}},"/api/token/verify":{"post":{"tags":["系统"],"summary":"验证 API Token","requestBody":{"required":true,"content":{"application/json":{"schema":{"type":"object","required":["token"],"properties":{"token":{"type":"string"}}}}}},"responses":{"200":{"description":"Token 有效"},"401":{"description":"Token 无效"}}}}},"components":{"securitySchemes":{"bearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"JWT","description":"Supabase JWT Token"},"apiKey":{"type":"apiKey","in":"header","name":"apikey","description":"Supabase Anon Key"},"xApiToken":{"type":"apiKey","in":"header","name":"X-API-Token","description":"自定义 API 令牌 (在管理后台创建)"}}}}

const swaggerHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HaloLight API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    :root { --bg: #fff; --text: #1f2937; --border: #e5e7eb; --card: #f9fafb; }
    .dark { --bg: #111827; --text: #f3f4f6; --border: #374151; --card: #1f2937; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); transition: all 0.3s; min-height: 100vh; }
    .header { background: var(--card); border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 1.25rem; font-weight: 600; font-family: system-ui; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .nav-links { display: flex; gap: 8px; }
    .nav-link { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 6px; text-decoration: none; font-size: 12px; color: var(--text); background: var(--border); transition: opacity 0.2s; }
    .nav-link:hover { opacity: 0.8; }
    .nav-link svg { width: 14px; height: 14px; }
    .theme-toggle { background: var(--border); border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .swagger-ui { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .swagger-ui .topbar { display: none; }
    .dark .swagger-ui .info .title, .dark .swagger-ui .opblock-tag { color: var(--text) !important; }
    .dark .swagger-ui .opblock .opblock-summary-path { color: var(--text); }
    .dark .swagger-ui .opblock .opblock-summary-description { color: #9ca3af; }
    .dark .swagger-ui .scheme-container { background: var(--card); }
    .dark .swagger-ui input, .dark .swagger-ui textarea, .dark .swagger-ui select { background: var(--bg); border-color: var(--border); color: var(--text); }
  </style>
</head>
<body>
  <div class="header">
    <h1>HaloLight API</h1>
    <div class="header-right">
      <div class="nav-links">
        <a class="nav-link" href="https://halolight-edge.h7ml.cn" target="_blank" title="生产环境">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Live
        </a>
        <a class="nav-link" href="https://dash.deno.com/playground/halolight-edge-api" target="_blank" title="Deno Playground">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.469 6.093c1.16 0 2.156.818 2.156 2.088 0 1.144-.752 1.836-1.734 2.412-.766.45-1.03.722-1.03 1.218v.324h-1.44v-.486c0-.864.534-1.368 1.44-1.89.73-.42 1.062-.738 1.062-1.398 0-.636-.498-1.092-1.272-1.092-.864 0-1.392.522-1.446 1.386H7.86c.06-1.578 1.17-2.562 2.67-2.562zm-.36 7.602c.588 0 1.026.438 1.026 1.014s-.438 1.014-1.026 1.014c-.576 0-1.026-.438-1.026-1.014s.45-1.014 1.026-1.014z"/></svg>
          Deno
        </a>
        <a class="nav-link" href="https://github.com/dext7r/halolight-edge" target="_blank" title="GitHub 仓库">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </a>
      </div>
      <span style="font-size:12px;color:#6b7280;">25+ APIs</span>
      <button class="theme-toggle" onclick="toggleTheme()">🌓</button>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (localStorage.theme === 'dark' || (!localStorage.theme && prefersDark)) document.body.classList.add('dark');
    function toggleTheme() {
      document.body.classList.toggle('dark');
      localStorage.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    }
    SwaggerUIBundle({
      url: '/spec',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
      filter: true,
    });
  </script>
</body>
</html>`

interface ApiTokenRecord {
  id: string
  token: string
  permissions: string[]
  status: string
  expires_at: string | null
}

async function validateApiToken(token: string): Promise<ApiTokenRecord | null> {
  if (!SUPABASE_SERVICE_KEY) return null
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, token, permissions, status, expires_at')
    .eq('token', token)
    .eq('status', 'active')
    .single()
  if (error || !data) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null
  // Update last_used
  await supabase.from('api_tokens').update({ last_used: new Date().toISOString() }).eq('id', data.id)
  return data
}

async function proxyToSupabase(req: Request, path: string): Promise<Response> {
  const url = new URL(path, SUPABASE_URL)
  new URL(req.url).searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('apikey', req.headers.get('apikey') || SUPABASE_ANON_KEY)
  if (req.headers.get('Authorization')) {
    headers.set('Authorization', req.headers.get('Authorization')!)
  }

  const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await req.text() : undefined

  const res = await fetch(url.toString(), { method: req.method, headers, body })
  const data = await res.text()

  return new Response(data, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  })
}

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Swagger UI
  if (req.method === 'GET' && path === '/') {
    return new Response(swaggerHtml, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } })
  }

  // OpenAPI Spec (动态生成 servers)
  if (path === '/spec') {
    const origin = url.origin
    const spec = {
      ...openApiSpec,
      servers: [
        { url: origin, description: 'API Gateway (当前)' },
        ...(SUPABASE_URL ? [{ url: SUPABASE_URL, description: 'Supabase 直连' }] : []),
      ],
    }
    return new Response(JSON.stringify(spec, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Health Check
  if (path === '/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), supabase: !!SUPABASE_URL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get Env
  if (path === '/api/env') {
    return new Response(JSON.stringify({
      SUPABASE_URL: SUPABASE_URL ? '✓ configured' : '✗ missing',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✓ configured' : '✗ missing',
      SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY ? '✓ configured' : '✗ missing',
      DENO_REGION: Deno.env.get('DENO_REGION') || 'unknown',
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify API Token
  if (req.method === 'POST' && path === '/api/token/verify') {
    try {
      const { token } = await req.json()
      if (!token) {
        return new Response(JSON.stringify({ valid: false, error: 'Token required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const record = await validateApiToken(token)
      if (!record) {
        return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ valid: true, permissions: record.permissions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ valid: false, error: (e as Error).message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Create User (Admin)
  if (req.method === 'POST' && path === '/api/create-user') {
    try {
      if (!SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Service key not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).single()
      if (!roleData || roleData.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { email, password, full_name } = await req.json()
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: full_name || email },
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, user: { id: newUser.user.id, email: newUser.user.email } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Proxy to Supabase (支持 X-API-Token 认证)
  if (path.startsWith('/auth/') || path.startsWith('/rest/')) {
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 检查 X-API-Token
    const apiToken = req.headers.get('X-API-Token')
    if (apiToken) {
      const tokenRecord = await validateApiToken(apiToken)
      if (!tokenRecord) {
        return new Response(JSON.stringify({ error: 'Invalid or expired API token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // Token 有效，使用 service key 代理请求（绕过 RLS）
      const proxyUrl = new URL(path, SUPABASE_URL)
      new URL(req.url).searchParams.forEach((v, k) => proxyUrl.searchParams.set(k, v))

      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('apikey', SUPABASE_SERVICE_KEY)
      headers.set('Authorization', `Bearer ${SUPABASE_SERVICE_KEY}`)

      const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await req.text() : undefined
      const res = await fetch(proxyUrl.toString(), { method: req.method, headers, body })
      const data = await res.text()

      return new Response(data, {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
      })
    }

    return proxyToSupabase(req, path)
  }

  return new Response(JSON.stringify({ error: 'Not found', path }), {
    status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
