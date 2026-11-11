"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/context";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={t.toolbar.theme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons are rendered and toggled in CSS, so the markup does not depend on the theme. */}
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
