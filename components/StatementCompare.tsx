import type { Statement } from "@/lib/types";
import { localizeContent, pick, type Language } from "@/lib/i18n";

function bucketParty(party: string): "iran" | "actors" | "intl" | "third" {
  const lowered = party.toLowerCase();
  if (lowered.includes("iran")) return "iran";
  if (lowered.includes("uk") || lowered.includes("france") || lowered.includes("germany")) return "third";
  if (lowered.includes("un")) return "intl";
  return "actors";
}

const LABELS = {
  iran: { zh: "伊朗官方", en: "Iranian Official" },
  actors: { zh: "参与行动方官方", en: "Acting Parties" },
  intl: { zh: "国际组织", en: "International Organizations" },
  third: { zh: "第三方政府", en: "Third-party Governments" }
};

export function StatementCompare({ statements, language = "zh" }: { statements: Statement[]; language?: Language }) {
  const grouped = {
    iran: [] as Statement[],
    actors: [] as Statement[],
    intl: [] as Statement[],
    third: [] as Statement[]
  };

  for (const statement of statements) {
    grouped[bucketParty(statement.party)].push(statement);
  }

  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "官方声明与各方回应", "Official Statements & Responses")}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(grouped).map(([key, list]) => (
          <div key={key} className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">{LABELS[key as keyof typeof LABELS][language]}</h3>
            <ul className="space-y-3 text-sm">
              {list.map((item) => (
                <li key={`${item.party}-${item.timestamp}`}>
                  <p className="font-medium">{item.party}</p>
                  <p className="mt-1 italic">“{item.quote}”</p>
                  <p className="mt-1 leading-6">{localizeContent(item.summary, language)}</p>
                  <p className="small-muted">{item.timestamp}</p>
                  <a className="text-teal-700 underline" href={item.source_url} target="_blank" rel="noreferrer">
                    {pick(language, "来源链接", "Source Link")}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
