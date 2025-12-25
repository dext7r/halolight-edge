-- =====================================================
-- 数据字典相关表
-- =====================================================

-- 数据表定义
CREATE TABLE IF NOT EXISTS data_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  comment TEXT,
  type VARCHAR(50) DEFAULT 'business' CHECK (type IN ('business', 'system')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 字段定义
CREATE TABLE IF NOT EXISTS data_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  length INTEGER,
  nullable BOOLEAN DEFAULT TRUE,
  default_value TEXT,
  comment TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_id, name)
);

-- =====================================================
-- 定时任务相关表
-- =====================================================

-- 定时任务
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers TEXT,
  body TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('success', 'error', 'pending')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务执行历史
CREATE TABLE IF NOT EXISTS task_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- API 令牌相关表
-- =====================================================

-- API 令牌
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  token VARCHAR(255) NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 令牌使用日志
CREATE TABLE IF NOT EXISTS api_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES api_tokens(id) ON DELETE CASCADE,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  ip_address INET,
  user_agent TEXT,
  status INTEGER,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Swagger 文档相关表
-- =====================================================

-- API 文档
CREATE TABLE IF NOT EXISTS api_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  base_url TEXT,
  swagger_json JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 端点（从 swagger_json 解析后存储，便于查询）
CREATE TABLE IF NOT EXISTS api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES api_docs(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  parameters JSONB,
  request_body JSONB,
  responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doc_id, method, path)
);

-- =====================================================
-- 索引优化
-- =====================================================

-- 数据字典索引
CREATE INDEX IF NOT EXISTS idx_data_tables_type ON data_tables(type);
CREATE INDEX IF NOT EXISTS idx_data_tables_created_at ON data_tables(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_fields_table_id ON data_fields(table_id);

-- 定时任务索引
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_execution_history_task_id ON task_execution_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_history_executed_at ON task_execution_history(executed_at DESC);

-- API 令牌索引
CREATE INDEX IF NOT EXISTS idx_api_tokens_status ON api_tokens(status);
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_token_usage_token_id ON api_token_usage(token_id);
CREATE INDEX IF NOT EXISTS idx_api_token_usage_used_at ON api_token_usage(used_at DESC);

-- Swagger 文档索引
CREATE INDEX IF NOT EXISTS idx_api_docs_created_at ON api_docs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_doc_id ON api_endpoints(doc_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_method ON api_endpoints(method);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_tags ON api_endpoints USING GIN(tags);

-- =====================================================
-- RLS (Row Level Security) 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;

-- 数据字典策略
CREATE POLICY "Anyone can view data tables" ON data_tables FOR SELECT USING (true);
CREATE POLICY "Admins can manage data tables" ON data_tables FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Anyone can view data fields" ON data_fields FOR SELECT USING (true);
CREATE POLICY "Admins can manage data fields" ON data_fields FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 定时任务策略
CREATE POLICY "Admins can view scheduled tasks" ON scheduled_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);
CREATE POLICY "Admins can manage scheduled tasks" ON scheduled_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Admins can view task history" ON task_execution_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- API 令牌策略
CREATE POLICY "Admins can view api tokens" ON api_tokens FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);
CREATE POLICY "Admins can manage api tokens" ON api_tokens FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Admins can view token usage" ON api_token_usage FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Swagger 文档策略
CREATE POLICY "Anyone can view api docs" ON api_docs FOR SELECT USING (true);
CREATE POLICY "Admins can manage api docs" ON api_docs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Anyone can view api endpoints" ON api_endpoints FOR SELECT USING (true);
CREATE POLICY "Admins can manage api endpoints" ON api_endpoints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON data_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_fields_updated_at BEFORE UPDATE ON data_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_tokens_updated_at BEFORE UPDATE ON api_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_docs_updated_at BEFORE UPDATE ON api_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 触发器：自动更新令牌过期状态
-- =====================================================

CREATE OR REPLACE FUNCTION update_token_status()
RETURNS void AS $$
BEGIN
  UPDATE api_tokens
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 可以配置定期执行此函数（通过 pg_cron 或应用层）
