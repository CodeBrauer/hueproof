"use client";

import { Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Segmented } from "@/components/segmented";
import { useCopy } from "@/hooks/use-copy";
import { useT } from "@/i18n/context";
import { downloadBlob, svgToPng } from "@/lib/download";
import { EXPORT_FORMATS, type ExportColor } from "@/lib/export";

const IMAGE_FORMAT_ID = "svg";
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colors: ExportColor[];
}

export function ExportDialog({ open, onOpenChange, colors }: ExportDialogProps) {
  const t = useT();
  const copy = useCopy();
  const [formatId, setFormatId] = useState(EXPORT_FORMATS[0].id);
  const format = EXPORT_FORMATS.find((candidate) => candidate.id === formatId) ?? EXPORT_FORMATS[0];
  const output = open ? format.build(colors) : "";
  const isImage = format.id === IMAGE_FORMAT_ID;

  async function downloadPng() {
    try {
      downloadBlob(await svgToPng(output, IMAGE_WIDTH, IMAGE_HEIGHT), "palette.png");
    } catch {
      toast.error(t.exportDialog.imageFailed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.exportDialog.title}</DialogTitle>
          <DialogDescription>{t.exportDialog.description}</DialogDescription>
        </DialogHeader>
        <Segmented
          label={t.exportDialog.format}
          value={format.id}
          onChange={setFormatId}
          options={EXPORT_FORMATS.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
        />

        {isImage ? (
          // A data URL of markup generated here; next/image has nothing to optimize.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(output)}`}
            alt={t.exportDialog.previewAlt}
            className="w-full rounded-lg ring-1 ring-foreground/15"
          />
        ) : (
          <pre className="max-h-72 min-w-0 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs">
            <code>{output}</code>
          </pre>
        )}

        <DialogFooter>
          {isImage && (
            <Button variant="outline" onClick={downloadPng}>
              <Download />
              {t.exportDialog.downloadPng}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => downloadBlob(new Blob([output], { type: format.mimeType }), format.filename)}
          >
            <Download />
            {t.exportDialog.download(format.filename)}
          </Button>
          <Button onClick={() => copy(output, t.exportDialog.copiedWhat(format.label))}>
            <Copy />
            {t.exportDialog.copy}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
