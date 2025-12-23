-- 创建操作日志类型枚举
CREATE TYPE public.audit_action AS ENUM (
  'user_login',
  'user_logout', 
  'user_signup',
  'role_change',
  'permission_change',
  'profile_update',
  'password_reset',
  'user_delete'
);

-- 创建操作日志表
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建索引优化查询
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target_user ON public.audit_logs(target_user_id);

-- 启用 RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：管理员可以查看所有日志
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS 策略：用户可以查看自己的日志
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS 策略：系统可以插入日志（通过 service role）
CREATE POLICY "Service can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 创建记录审计日志的函数
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action audit_action,
  p_target_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, target_user_id, details)
  VALUES (auth.uid(), p_action, p_target_user_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 创建角色变更触发器
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, target_user_id, details)
    VALUES (
      auth.uid(), 
      'role_change', 
      NEW.user_id, 
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, target_user_id, details)
    VALUES (
      COALESCE(auth.uid(), NEW.user_id), 
      'role_change', 
      NEW.user_id, 
      jsonb_build_object('new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_role_change
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- 创建用户统计视图
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS total_users
FROM public.profiles
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- 创建角色统计视图
CREATE OR REPLACE VIEW public.role_statistics AS
SELECT 
  role,
  COUNT(*) AS user_count
FROM public.user_roles
GROUP BY role;

-- 创建每日活动统计视图
CREATE OR REPLACE VIEW public.daily_activity AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  action,
  COUNT(*) AS count
FROM public.audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at), action
ORDER BY day DESC;

-- 为视图设置权限
GRANT SELECT ON public.user_statistics TO authenticated;
GRANT SELECT ON public.role_statistics TO authenticated;
GRANT SELECT ON public.daily_activity TO authenticated;