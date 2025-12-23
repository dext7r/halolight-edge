import { motion } from 'framer-motion';
import { Heart, Github, ExternalLink } from 'lucide-react';
import { useThemeSettings } from '@/contexts/ThemeContext';

export function Footer() {
  const { settings } = useThemeSettings();

  if (!settings.showFooter) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-t border-border bg-card/50 backdrop-blur-sm ${
        settings.footerFixed ? 'sticky bottom-0 z-30' : ''
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left - Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} RBAC Admin.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>

          {/* Center - Made with love */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse" />
            <span>by</span>
            <a
              href="https://lovable.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Lovable
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Right - Links */}
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://docs.lovable.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              文档
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
