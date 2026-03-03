import { useEffect, useRef } from "react";
import type { EvidenceItem } from "@/lib/types";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { localizeContent, pick, type Language } from "@/lib/i18n";

interface SourceDrawerProps {
  open: boolean;
  title: string;
  sources: EvidenceItem[];
  onClose: () => void;
  language?: Language;
}

export function SourceDrawer({ open, title, sources, onClose, language = "en" }: SourceDrawerProps) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const container = drawerRef.current;
      if (!container) {
        return;
      }
      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label={pick(language, "关闭来源抽屉", "Close source drawer")}
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-slate-900/35 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${pick(language, "来源与证据", "Sources & Evidence")}: ${title}`}
        className={`absolute right-0 top-0 h-full w-full max-w-md transform border-l border-slate-200 bg-white p-4 shadow-xl transition ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <h4 className="text-lg font-semibold">
            {pick(language, "来源与证据", "Sources & Evidence")}: {title}
          </h4>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            {pick(language, "关闭", "Close")}
          </button>
        </div>
        <ul className="space-y-3 text-sm">
          {sources.map((source) => (
            <li key={`${source.source_url}-${source.source_time}`} className="rounded border border-slate-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <strong>{localizeContent(source.title, language)}</strong>
                <UnverifiedBadge status={source.verification_status} language={language} />
              </div>
              <p className="small-muted">
                {pick(language, "发布时间", "Published")}: {source.source_time}
              </p>
              {source.note ? <p className="mt-1 leading-6">{localizeContent(source.note, language)}</p> : null}
              <a className="mt-2 inline-block text-sm text-teal-700 underline" href={source.source_url} target="_blank" rel="noreferrer">
                {pick(language, "查看原文", "View Source")}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
