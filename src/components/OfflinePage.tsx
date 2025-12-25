import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-mask" />

      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 right-[15%] w-64 h-64 bg-warning/5 rounded-full blur-3xl"
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
            <div className="w-24 h-24 rounded-3xl bg-warning/10 border border-warning/20 shadow-lg flex items-center justify-center mx-auto">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <WifiOff className="h-12 w-12 text-warning" />
              </motion.div>
            </div>
          </motion.div>

          {/* Network Animation */}
          <motion.div
            animate={{
              opacity: [1, 0.5, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-4"
          >
            <span className="text-6xl sm:text-7xl font-bold text-gradient">离线</span>
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            网络连接已断开
          </h1>

          <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
            请检查您的网络连接，确保已连接到互联网后再试。
          </p>

          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-full text-sm text-warning">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span>等待网络连接...</span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重新加载
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
