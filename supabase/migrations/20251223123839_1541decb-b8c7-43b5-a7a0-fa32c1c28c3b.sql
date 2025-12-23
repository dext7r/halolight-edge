-- 修复视图安全问题 - 使用 SECURITY INVOKER
DROP VIEW IF EXISTS public.user_statistics;
DROP VIEW IF EXISTS public.role_statistics;
DROP VIEW IF EXISTS public.daily_activity;

-- 重新创建视图，明确使用 SECURITY INVOKER (默认值)
CREATE VIEW public.user_statistics 
WITH (security_invoker = true)
AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS total_users
FROM public.profiles
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

CREATE VIEW public.role_statistics 
WITH (security_invoker = true)
AS
SELECT 
  role,
  COUNT(*) AS user_count
FROM public.user_roles
GROUP BY role;

CREATE VIEW public.daily_activity 
WITH (security_invoker = true)
AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  action,
  COUNT(*) AS count
FROM public.audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at), action
ORDER BY day DESC;

-- 重新授予权限
GRANT SELECT ON public.user_statistics TO authenticated;
GRANT SELECT ON public.role_statistics TO authenticated;
GRANT SELECT ON public.daily_activity TO authenticated;