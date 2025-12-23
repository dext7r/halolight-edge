import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ColorTheme = 
  | 'blue' | 'green' | 'purple' | 'rose' | 'orange' | 'cyan' 
  | 'emerald' | 'violet' | 'amber' | 'pink' | 'teal' | 'indigo';

export interface ThemeSettings {
  colorTheme: ColorTheme;
  animationsEnabled: boolean;
  animationType: 'subtle' | 'normal' | 'expressive';
  headerFixed: boolean;
  footerFixed: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showTabBar: boolean;
}

const defaultSettings: ThemeSettings = {
  colorTheme: 'blue',
  animationsEnabled: true,
  animationType: 'normal',
  headerFixed: true,
  footerFixed: false,
  showHeader: true,
  showFooter: true,
  showTabBar: true,
};

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (updates: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'rbac_admin.theme_settings';

// Theme color configurations
export const themeColors: Record<ColorTheme, { 
  name: string; 
  primary: string; 
  primaryLight: string;
  primaryDark: string;
}> = {
  blue: { 
    name: '海洋蓝', 
    primary: '213 94% 50%', 
    primaryLight: '213 94% 55%',
    primaryDark: '213 94% 45%'
  },
  green: { 
    name: '森林绿', 
    primary: '142 71% 45%', 
    primaryLight: '142 71% 50%',
    primaryDark: '142 71% 40%'
  },
  purple: { 
    name: '优雅紫', 
    primary: '262 83% 58%', 
    primaryLight: '262 83% 63%',
    primaryDark: '262 83% 53%'
  },
  rose: { 
    name: '玫瑰红', 
    primary: '346 77% 50%', 
    primaryLight: '346 77% 55%',
    primaryDark: '346 77% 45%'
  },
  orange: { 
    name: '活力橙', 
    primary: '24 95% 53%', 
    primaryLight: '24 95% 58%',
    primaryDark: '24 95% 48%'
  },
  cyan: { 
    name: '清新青', 
    primary: '189 94% 43%', 
    primaryLight: '189 94% 48%',
    primaryDark: '189 94% 38%'
  },
  emerald: { 
    name: '翡翠绿', 
    primary: '160 84% 39%', 
    primaryLight: '160 84% 44%',
    primaryDark: '160 84% 34%'
  },
  violet: { 
    name: '梦幻紫', 
    primary: '270 76% 62%', 
    primaryLight: '270 76% 67%',
    primaryDark: '270 76% 57%'
  },
  amber: { 
    name: '琥珀黄', 
    primary: '38 92% 50%', 
    primaryLight: '38 92% 55%',
    primaryDark: '38 92% 45%'
  },
  pink: { 
    name: '粉色梦', 
    primary: '330 81% 60%', 
    primaryLight: '330 81% 65%',
    primaryDark: '330 81% 55%'
  },
  teal: { 
    name: '深海蓝', 
    primary: '173 80% 40%', 
    primaryLight: '173 80% 45%',
    primaryDark: '173 80% 35%'
  },
  indigo: { 
    name: '靛蓝色', 
    primary: '239 84% 67%', 
    primaryLight: '239 84% 72%',
    primaryDark: '239 84% 62%'
  },
};

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  });

  // Apply color theme to CSS variables
  useEffect(() => {
    const theme = themeColors[settings.colorTheme];
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--accent', theme.primary);
      root.style.setProperty('--ring', theme.primary);
      root.style.setProperty('--sidebar-primary', theme.primary);
      root.style.setProperty('--sidebar-ring', theme.primary);
    }
  }, [settings.colorTheme]);

  // Apply animation settings
  useEffect(() => {
    const root = document.documentElement;
    if (!settings.animationsEnabled) {
      root.style.setProperty('--transition-fast', '0ms');
      root.style.setProperty('--transition-normal', '0ms');
      root.style.setProperty('--transition-slow', '0ms');
      root.classList.add('no-animations');
    } else {
      const speeds = {
        subtle: { fast: '100ms', normal: '200ms', slow: '300ms' },
        normal: { fast: '150ms', normal: '250ms', slow: '400ms' },
        expressive: { fast: '200ms', normal: '350ms', slow: '500ms' },
      };
      const speed = speeds[settings.animationType];
      root.style.setProperty('--transition-fast', speed.fast);
      root.style.setProperty('--transition-normal', speed.normal);
      root.style.setProperty('--transition-slow', speed.slow);
      root.classList.remove('no-animations');
    }
  }, [settings.animationsEnabled, settings.animationType]);

  const updateSettings = (updates: Partial<ThemeSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch {
        // ignore
      }
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  }
  return context;
}
