import { pick, type Language } from "@/lib/i18n";

interface ContentWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  language?: Language;
}

export function ContentWarningModal({ open, onConfirm, language = "zh" }: ContentWarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-md rounded bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">{pick(language, "内容警示", "Content Warning")}</h3>
        <p className="mt-2 text-sm leading-6">
          {pick(
            language,
            "以下内容可能包含爆炸现场与紧急处置画面，不包含血腥展示。请按需查看。",
            "The following content may include explosions and emergency response scenes. No graphic imagery is displayed. Please view at your discretion."
          )}
        </p>
        <button className="mt-4 rounded bg-teal-700 px-3 py-2 text-sm text-white" onClick={onConfirm}>
          {pick(language, "我已了解，继续查看", "I Understand, Continue")}
        </button>
      </div>
    </div>
  );
}
