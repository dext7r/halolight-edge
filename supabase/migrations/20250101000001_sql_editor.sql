-- =====================================================
-- SQL 编辑器功能
-- =====================================================

-- 创建执行 SQL 的函数（仅管理员可用）
CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  is_admin BOOLEAN;
BEGIN
  -- 检查是否为管理员
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION '权限不足：仅管理员可以执行 SQL';
  END IF;

  -- 禁止危险操作（可选，根据需求调整）
  IF query ~* '\s*(DROP\s+DATABASE|DROP\s+SCHEMA|TRUNCATE\s+auth\.)\s*' THEN
    RAISE EXCEPTION '禁止执行危险操作';
  END IF;

  -- 执行查询并返回 JSONB 格式
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;

  RETURN COALESCE(result, '[]'::JSONB);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '执行失败: %', SQLERRM;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;

-- =====================================================
-- SQL 执行历史表（可选）
-- =====================================================

CREATE TABLE IF NOT EXISTS sql_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sql_query TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  result JSONB,
  error_message TEXT,
  execution_time INTEGER, -- 毫秒
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sql_execution_history_user_id ON sql_execution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_execution_history_executed_at ON sql_execution_history(executed_at DESC);

-- RLS 策略
ALTER TABLE sql_execution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SQL history" ON sql_execution_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own SQL history" ON sql_execution_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 日志记录函数（可选，自动记录 SQL 执行）
-- =====================================================

CREATE OR REPLACE FUNCTION execute_sql_with_logging(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  is_admin BOOLEAN;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  exec_time INTEGER;
  exec_status VARCHAR(20);
  exec_error TEXT;
BEGIN
  start_time := clock_timestamp();

  -- 检查权限
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator')
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION '权限不足：仅管理员可以执行 SQL';
  END IF;

  -- 执行查询
  BEGIN
    EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
    exec_status := 'success';
    result := COALESCE(result, '[]'::JSONB);
  EXCEPTION
    WHEN OTHERS THEN
      exec_status := 'error';
      exec_error := SQLERRM;
  END;

  -- 计算执行时间
  end_time := clock_timestamp();
  exec_time := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

  -- 记录到历史表
  INSERT INTO sql_execution_history (
    user_id,
    sql_query,
    status,
    result,
    error_message,
    execution_time
  ) VALUES (
    auth.uid(),
    query,
    exec_status,
    result,
    exec_error,
    exec_time
  );

  -- 如果执行失败，抛出错误
  IF exec_status = 'error' THEN
    RAISE EXCEPTION '执行失败: %', exec_error;
  END IF;

  RETURN result;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION execute_sql_with_logging(TEXT) TO authenticated;
