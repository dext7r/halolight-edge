import { motion } from "framer-motion";
import { Heart, ExternalLink, Globe, FileCode } from "lucide-react";
import { useThemeSettings } from "@/contexts/ThemeContext";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const links = [
  { href: "https://halolight-edge.h7ml.cn", label: "Live", icon: Globe },
  { href: "https://dash.deno.com/playground/halolight-edge-api", label: "Deno", icon: FileCode },
  { href: "https://github.com/dext7r/halolight-edge", label: "GitHub", icon: GithubIcon },
];

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
        settings.footerFixed ? "sticky bottom-0 z-30" : ""
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left - Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} HaloLight.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>

          {/* Center - Made with love */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse" />
            <span>by</span>
            <a
              href="https://halolight.h7ml.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              HaloLight
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Right - Links */}
          <div className="flex items-center gap-4 text-sm">
            {links.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
