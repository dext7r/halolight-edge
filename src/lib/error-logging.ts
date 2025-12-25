import { supabase } from '@/integrations/supabase/client';

export interface ErrorLog {
  id: string;
  user_id: string | null;
  error_message: string;
  error_stack: string | null;
  component_stack: string | null;
  url: string;
  user_agent: string;
  timestamp: string;
  additional_info: Record<string, any> | null;
}

/**
 * 记录前端错误到后端
 */
export async function logError(
  error: Error,
  errorInfo?: { componentStack?: string },
  additionalInfo?: Record<string, any>
): Promise<void> {
  try {
    // 获取当前用户信息
    const { data: { user } } = await supabase.auth.getUser();

    // 构建错误日志数据
    const errorLog = {
      user_id: user?.id || null,
      error_message: error.message || error.toString(),
      error_stack: error.stack || null,
      component_stack: errorInfo?.componentStack || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additional_info: additionalInfo || null,
    };

    // 记录到 Supabase
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert(errorLog);

    if (insertError) {
      console.error('Failed to log error to backend:', insertError);
    }
  } catch (err) {
    // 错误上报失败不应影响用户体验，仅在控制台记录
    console.error('Error logging failed:', err);
  }
}

/**
 * 记录未捕获的全局错误
 */
export function setupGlobalErrorHandling(): void {
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      undefined,
      {
        type: 'unhandledrejection',
        reason: event.reason,
      }
    );
  });

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    logError(
      new Error(event.message),
      undefined,
      {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}
