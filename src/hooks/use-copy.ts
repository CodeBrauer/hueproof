import { toast } from "sonner";
import { useT } from "@/i18n/context";

/** Returns a function that copies text and confirms it with a toast; `what` names the copied thing in the toast. */
export function useCopy(): (text: string, what?: string) => Promise<void> {
  const t = useT();
  return async (text, what = text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.common.copied(what));
    } catch {
      toast.error(t.common.copyFailed);
    }
  };
}
