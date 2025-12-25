import { motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  HelpCircle,
  LogOut,
  FileText,
  ExternalLink,
  Database,
  Clock,
  Key,
  Book,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "仪表盘", path: "/dashboard", permission: "dashboard:read" },
  { icon: Users, label: "用户管理", path: "/users", permission: "users:read" },
  { icon: Shield, label: "角色权限", path: "/roles", permission: "roles:read" },
  { icon: FileText, label: "审计日志", path: "/audit-logs", permission: "roles:read" },
  { icon: Database, label: "数据字典", path: "/data-dictionary", permission: "dashboard:read" },
  { icon: Clock, label: "定时任务", path: "/scheduled-tasks", permission: "roles:read" },
  { icon: Key, label: "API 令牌", path: "/api-tokens", permission: "roles:read" },
  { icon: Book, label: "API 文档", path: "/swagger-docs", permission: "dashboard:read" },
  { icon: Code, label: "SQL 编辑器", path: "/sql-editor", permission: "roles:read" },
  { icon: Settings, label: "系统设置", path: "/settings", permission: "settings:read" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isModerator, signOut } = useAuthContext();

  const filteredItems = menuItems.filter((item) => {
    if (item.permission.includes("roles") || item.path === "/audit-logs") {
      return isAdmin;
    }
    if (item.permission.includes("users")) {
      return isModerator;
    }
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleHelpClick = () => {
    window.open("https://halolight.docs.h7ml.cn", "_blank");
  };

  const renderNavItem = (item: (typeof menuItems)[0], index: number) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    const handleClick = (e: React.MouseEvent) => {
      // 阻止事件冒泡，避免触发其他行为
      e.stopPropagation();
    };

    const linkContent = (
      <NavLink
        to={item.path}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
          )}
        />
        <motion.span
          initial={false}
          animate={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.2 }}
          className="font-medium whitespace-nowrap overflow-hidden"
        >
          {item.label}
        </motion.span>
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {linkContent}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <motion.div
        key={item.path}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        {linkContent}
      </motion.div>
    );
  };

  const helpButton = (
    <button
      onClick={handleHelpClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <HelpCircle className="h-5 w-5 flex-shrink-0" />
      <motion.span
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
        transition={{ duration: 0.2 }}
        className="font-medium whitespace-nowrap overflow-hidden flex items-center gap-2"
      >
        帮助文档
        <ExternalLink className="h-3 w-3" />
      </motion.span>
    </button>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 shadow-sm"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <motion.div
          className="flex items-center gap-3 overflow-hidden"
          animate={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
          >
            <Zap className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              marginLeft: collapsed ? 0 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <span className="font-bold text-lg text-sidebar-foreground whitespace-nowrap tracking-tight">
              RBAC Admin
            </span>
            <p className="text-xs text-muted-foreground">企业级权限管理</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <motion.p
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, height: collapsed ? 0 : "auto" }}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2"
        >
          主导航
        </motion.p>
        {filteredItems.map((item, index) => renderNavItem(item, index))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-2">
        <Separator className="mb-4" />

        {/* Help Button */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{helpButton}</TooltipTrigger>
            <TooltipContent side="right">帮助文档</TooltipContent>
          </Tooltip>
        ) : (
          helpButton
        )}

        {/* Sign Out */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "text-destructive hover:bg-destructive/10",
                )}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">退出登录</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-destructive hover:bg-destructive/10",
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">退出登录</span>
          </button>
        )}

        {/* Collapse Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="w-full justify-center text-muted-foreground hover:text-foreground mt-2"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>收起菜单</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              <span>{collapsed ? "展开菜单" : "收起菜单"}</span>
              <kbd className="h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground inline-flex">
                ⌘B
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Collapsed mode indicator */}
        {collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
