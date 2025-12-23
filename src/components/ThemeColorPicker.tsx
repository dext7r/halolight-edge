import { motion } from 'framer-motion';
import { Check, Palette, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useThemeSettings, themeColors, ColorTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeColorPicker() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useThemeSettings();

  const modeOptions = [
    { value: 'light', label: '亮色', icon: Sun },
    { value: 'dark', label: '暗色', icon: Moon },
    { value: 'system', label: '系统', icon: Monitor },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span 
            className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${themeColors[settings.colorTheme].primary})` }}
          />
          <span className="sr-only">主题设置</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">主题设置</p>
            <p className="text-xs text-muted-foreground">选择您喜欢的颜色和模式</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Mode Selector */}
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">显示模式</p>
          <div className="flex gap-1">
            {modeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors",
                    theme === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Color Selector */}
        <div className="py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">主题颜色</p>
          <div className="grid grid-cols-6 gap-2">
            {(Object.entries(themeColors) as [ColorTheme, typeof themeColors[ColorTheme]][]).map(
              ([key, color]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateSettings({ colorTheme: key })}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    settings.colorTheme === key && "ring-2 ring-offset-2"
                  )}
                  style={{ backgroundColor: `hsl(${color.primary})` }}
                  title={color.name}
                >
                  {settings.colorTheme === key && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </motion.button>
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            当前: {themeColors[settings.colorTheme].name}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
