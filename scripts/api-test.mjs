#!/usr/bin/env node

const BASE_URL = 'https://halolight-edge-api.deno.dev'
const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNicC1zNnRoeHRsNndwdDEydWptIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTg4NzQ5NDcsImV4cCI6MjA3NDQ1MDk0N30.i63p_MV09WenMMugtKbei6nrSF2qrGP1LKhgnJOendc'

const headers = {
  'Content-Type': 'application/json',
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`
}

const results = { success: [], failed: [] }

async function test(name, method, path, body = null) {
  const url = `${BASE_URL}${path}`
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  try {
    const start = Date.now()
    const res = await fetch(url, opts)
    const duration = Date.now() - start
    const data = res.status !== 204 ? await res.text() : null

    const status = res.ok ? '✅' : '❌'
    const info = { name, method, path, status: res.status, duration: `${duration}ms` }

    if (res.ok) {
      results.success.push(info)
      let preview = ''
      if (data) {
        try {
          const json = JSON.parse(data)
          preview = Array.isArray(json)
            ? `[${json.length} items]`
            : typeof json === 'object'
              ? Object.keys(json).slice(0, 3).join(', ') + '...'
              : String(json).slice(0, 50)
        } catch { preview = data.slice(0, 50) }
      }
      console.log(`${status} ${method.padEnd(6)} ${path.padEnd(45)} ${res.status} ${duration}ms ${preview}`)
    } else {
      info.error = data?.slice(0, 100)
      results.failed.push(info)
      console.log(`${status} ${method.padEnd(6)} ${path.padEnd(45)} ${res.status} ${duration}ms ${data?.slice(0, 80)}`)
    }
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    results.failed.push({ name, method, path, error: e.message })
    console.log(`❌ ${method.padEnd(6)} ${path.padEnd(45)} ERROR: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

async function main() {
  console.log('=' .repeat(100))
  console.log('HaloLight RBAC API 接口测试')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`API Key: ${API_KEY.slice(0, 10)}...`)
  console.log('=' .repeat(100))
  console.log()

  // ========== 用户模块 ==========
  console.log('\n📦 用户模块 (profiles)')
  console.log('-'.repeat(80))
  await test('获取用户列表', 'GET', '/rest/v1/profiles?limit=5')
  await test('获取用户列表(select)', 'GET', '/rest/v1/profiles?select=id,email,full_name&limit=3')

  // ========== 角色模块 ==========
  console.log('\n📦 角色模块 (roles)')
  console.log('-'.repeat(80))
  await test('获取用户角色列表', 'GET', '/rest/v1/user_roles?limit=10')
  await test('获取权限列表', 'GET', '/rest/v1/permissions')
  await test('获取角色权限关联', 'GET', '/rest/v1/role_permissions')

  // ========== 审计模块 ==========
  console.log('\n📦 审计模块 (audit)')
  console.log('-'.repeat(80))
  await test('获取审计日志', 'GET', '/rest/v1/audit_logs?order=created_at.desc&limit=10')
  await test('按操作筛选日志', 'GET', '/rest/v1/audit_logs?action=eq.user_login&limit=5')

  // ========== 通知模块 ==========
  console.log('\n📦 通知模块 (notifications)')
  console.log('-'.repeat(80))
  await test('获取通知列表', 'GET', '/rest/v1/notifications?limit=10')

  // ========== 统计视图 ==========
  console.log('\n📦 统计视图 (statistics)')
  console.log('-'.repeat(80))
  await test('每日活动统计', 'GET', '/rest/v1/daily_activity')
  await test('角色统计', 'GET', '/rest/v1/role_statistics')
  await test('用户统计', 'GET', '/rest/v1/user_statistics')

  // ========== RPC 函数 ==========
  console.log('\n📦 RPC 函数')
  console.log('-'.repeat(80))
  // RPC 函数需要 POST 请求
  await test('获取用户角色 (RPC)', 'POST', '/rest/v1/rpc/get_user_role', {
    _user_id: '00000000-0000-0000-0000-000000000000' // 测试用 dummy UUID
  })

  // ========== Edge Function ==========
  console.log('\n📦 Edge Functions')
  console.log('-'.repeat(80))
  await test('获取环境变量', 'GET', '/api/env')
  await test('健康检查', 'GET', '/health')
  await test('创建用户 (需Admin)', 'POST', '/api/create-user', {
    email: 'test@example.com',
    password: 'test123456',
    full_name: 'Test User'
  })

  // ========== 认证接口 (仅测试端点可达性) ==========
  console.log('\n📦 认证接口 (仅测试可达性)')
  console.log('-'.repeat(80))
  await test('登出接口', 'POST', '/auth/v1/logout')

  // ========== 汇总 ==========
  console.log('\n')
  console.log('=' .repeat(100))
  console.log('测试结果汇总')
  console.log('=' .repeat(100))
  console.log(`✅ 成功: ${results.success.length}`)
  console.log(`❌ 失败: ${results.failed.length}`)

  if (results.failed.length > 0) {
    console.log('\n失败详情:')
    results.failed.forEach(f => {
      console.log(`  - ${f.method} ${f.path}: ${f.status || 'N/A'} - ${f.error || ''}`)
    })
  }

  console.log('\n测试完成!')
}

main().catch(console.error)
