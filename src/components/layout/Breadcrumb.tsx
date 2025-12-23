import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const routeNames: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  roles: '角色权限',
  settings: '系统设置',
  'audit-logs': '审计日志',
};

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center text-sm"
    >
      <Link 
        to="/dashboard" 
        className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNames[name] || name;

        return (
          <span key={name} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            {isLast ? (
              <span className="text-foreground font-medium">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
            )}
          </span>
        );
      })}
    </motion.nav>
  );
}
