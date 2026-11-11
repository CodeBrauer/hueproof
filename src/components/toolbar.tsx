"use client";

import {
  Bookmark,
  ClipboardPaste,
  Download,
  Ellipsis,
  Eye,
  Link2,
  Plus,
  Redo2,
  Shuffle,
  SunMoon,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale, useT } from "@/i18n/context";
import { LOCALE_PATHS, SWITCH_LABELS, type Locale } from "@/i18n/locales";
import { DEFAULT_PALETTE, MAX_COLORS } from "@/lib/color/types";
import { VISION_GROUPS, VISION_TYPES, type VisionId } from "@/lib/color/vision";
import { paletteActions, type PaletteSnapshot } from "@/lib/palette-store";
import { SITE_NAME } from "@/lib/site";

export type DialogId = "import" | "library" | "export";

const DIALOG_ICONS: readonly { id: DialogId; icon: typeof Download }[] = [
  { id: "import", icon: ClipboardPaste },
  { id: "library", icon: Bookmark },
  { id: "export", icon: Download },
];

function IconAction({
  label,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; shortcut?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <kbd className="ml-2 font-sans opacity-70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Links to the other language and takes the current palette along. */
function LanguageSwitch() {
  const router = useRouter();
  const target: Locale = useLocale() === "en" ? "de" : "en";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <a
            href={LOCALE_PATHS[target]}
            hrefLang={target}
            lang={target}
            aria-label={SWITCH_LABELS[target]}
            onClick={(event) => {
              event.preventDefault();
              router.push(`${LOCALE_PATHS[target]}${window.location.hash}`);
            }}
          >
            {target.toUpperCase()}
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span lang={target}>{SWITCH_LABELS[target]}</span>
      </TooltipContent>
    </Tooltip>
  );
}

interface ToolbarProps {
  snapshot: PaletteSnapshot | null;
  vision: VisionId;
  onVisionChange: (vision: VisionId) => void;
  onOpenDialog: (dialog: DialogId) => void;
  onAdd: () => void;
  onShare: () => void;
}

export function Toolbar({ snapshot, vision, onVisionChange, onOpenDialog, onAdd, onShare }: ToolbarProps) {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const ready = snapshot !== null;
  const isFull = (snapshot?.colors.length ?? 0) >= MAX_COLORS;
  const dialogLabels: Record<DialogId, string> = {
    import: t.toolbar.import,
    library: t.toolbar.saved,
    export: t.toolbar.export,
  };

  return (
    <header className="flex h-[4.5rem] shrink-0 items-center gap-x-1">
      <div className="flex items-center sm:mr-4" role="img" aria-label={SITE_NAME}>
        {/* The logo wears the current palette. */}
        <Logo className="size-9" colors={(snapshot?.colors ?? DEFAULT_PALETTE).map((color) => color.hex)} />
      </div>

      {/* Quiet words instead of buttons; the one button in the bar is Generate. */}
      <div className="hidden items-center md:flex">
        {DIALOG_ICONS.map(({ id }) => (
          <Button key={id} variant="ghost" className="px-3" disabled={!ready} onClick={() => onOpenDialog(id)}>
            {dialogLabels[id]}
          </Button>
        ))}
        <Button variant="ghost" className="px-3" disabled={!ready} onClick={onShare}>
          {t.toolbar.share}
        </Button>
      </div>

      <div className="ml-auto flex items-center sm:gap-x-1">
        <IconAction label={t.toolbar.undo} shortcut="⌘Z" disabled={!snapshot?.canUndo} onClick={paletteActions.undo}>
          <Undo2 />
        </IconAction>
        {/* On phones redo moves into the menu, so the bar still fits a 320 px wide screen. */}
        <IconAction
          label={t.toolbar.redo}
          shortcut="⇧⌘Z"
          className="max-sm:hidden"
          disabled={!snapshot?.canRedo}
          onClick={paletteActions.redo}
        >
          <Redo2 />
        </IconAction>
        <IconAction label={t.toolbar.addColor} disabled={!ready || isFull} onClick={onAdd}>
          <Plus />
        </IconAction>

        <Select value={vision} onValueChange={(value) => onVisionChange(value as VisionId)}>
          {/* A fixed width keeps the toolbar from shifting when the selected label changes. */}
          <SelectTrigger
            aria-label={t.toolbar.simulate}
            className="justify-start gap-1.5 border-0 bg-transparent px-2 text-[13px] font-bold tracking-[0.03em] text-muted-foreground uppercase hover:text-foreground data-[size=default]:h-9 sm:w-56 dark:bg-transparent dark:hover:bg-transparent"
          >
            <Eye className="shrink-0" />
            <span className="truncate max-sm:hidden">
              <SelectValue />
            </span>
          </SelectTrigger>
          {/* Opens below the trigger instead of aligning the selected entry over it. */}
          <SelectContent position="popper" align="end" sideOffset={6} className="min-w-(--radix-select-trigger-width)">
            {VISION_GROUPS.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{t.vision.groups[group]}</SelectLabel>
                {VISION_TYPES.filter((type) => type.group === group).map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {t.vision.types[type.id].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label={t.toolbar.more} disabled={!ready}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60">
            <DropdownMenuItem className="sm:hidden" disabled={!snapshot?.canRedo} onSelect={paletteActions.redo}>
              <Redo2 />
              {t.toolbar.redo}
            </DropdownMenuItem>
            {DIALOG_ICONS.map(({ id, icon: Icon }) => (
              <DropdownMenuItem key={id} onSelect={() => onOpenDialog(id)}>
                <Icon />
                {dialogLabels[id]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={onShare}>
              <Link2 />
              {t.toolbar.shareLink}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              <SunMoon />
              {t.toolbar.theme}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LanguageSwitch />
        {/* On phones the toggle lives in the menu above; the bar has no room for it. */}
        <ThemeToggle className="max-md:hidden" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!ready}
              onClick={paletteActions.generate}
              aria-label={t.toolbar.generateLabel}
              className="ml-2 max-sm:size-10 max-sm:px-0"
            >
              <Shuffle className="sm:hidden" />
              <span className="max-sm:hidden">{t.toolbar.generate}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t.toolbar.generateHint} <kbd className="ml-2 font-sans opacity-70">{t.toolbar.spaceKey}</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
