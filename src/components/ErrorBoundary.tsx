import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/error-logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // 上报错误到后端
    logError(error, errorInfo, {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-radial-mask" />
          
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 right-[15%] w-64 h-64 bg-destructive/5 rounded-full blur-3xl"
          />

          <div className="relative z-10 max-w-lg w-full text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto mb-8"
              >
                <div className="w-24 h-24 rounded-3xl bg-destructive/10 border border-destructive/20 shadow-lg flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bug className="h-12 w-12 text-destructive" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Error Animation */}
              <motion.div
                animate={{ 
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <span className="text-6xl sm:text-7xl font-bold text-gradient">出错了</span>
              </motion.div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-4">
                应用遇到了问题
              </h1>

              <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                很抱歉，应用发生了意外错误。请尝试刷新页面或返回首页。
              </p>

              {/* Error Details (collapsible) */}
              {this.state.error && (
                <motion.details
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-8 text-left bg-card border border-border rounded-lg overflow-hidden"
                >
                  <summary className="p-4 cursor-pointer flex items-center gap-2 text-sm font-medium hover:bg-muted/50 transition-colors">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    查看错误详情
                  </summary>
                  <div className="p-4 pt-0 border-t border-border">
                    <pre className="text-xs text-destructive bg-destructive/5 p-3 rounded-md overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          {'\n\nComponent Stack:'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </div>
                </motion.details>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  重试
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  刷新页面
                </Button>
                <Button
                  variant="secondary"
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  返回首页
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
