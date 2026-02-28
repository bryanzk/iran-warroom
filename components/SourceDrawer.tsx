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

export function SourceDrawer({ open, title, sources, onClose, language = "zh" }: SourceDrawerProps) {
  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-full w-full max-w-md transform border-l border-slate-200 bg-white p-4 shadow-xl transition ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      <div className="mb-4 flex items-start justify-between">
        <h4 className="text-lg font-semibold">
          {pick(language, "来源与证据", "Sources & Evidence")}: {title}
        </h4>
        <button onClick={onClose} className="rounded border border-slate-300 px-2 py-1 text-xs">
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
  );
}
