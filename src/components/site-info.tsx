import { SourceLink } from "@/components/source-link";
import { StartButton } from "@/components/start-button";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { REFERENCES } from "@/lib/references";
import { SITE_NAME } from "@/lib/site";

/** Heading in the first column, content beside it, as in the analysis tabs. */
const SECTION = "grid gap-x-8 gap-y-6 border-t border-border py-12 md:grid-cols-4";

/** Static content below the tool: explains what it does, for visitors and for search engines. */
export function SiteInfo({ locale }: { locale: Locale }) {
  const { info } = getDictionary(locale);
  const faq: readonly { question: string; answer: React.ReactNode }[] = [
    info.faq.storage,
    {
      question: info.faq.method.question,
      answer: info.faq.method.answer(
        <SourceLink reference={REFERENCES.wcagContrast} />,
        <SourceLink reference={REFERENCES.apca} />,
      ),
    },
    {
      question: info.faq.simulation.question,
      answer: info.faq.simulation.answer(<SourceLink reference={REFERENCES.visionModel} />),
    },
    info.faq.fix,
  ];

  return (
    <div className="border-t border-foreground">
      <section className="py-14 lg:py-20">
        <p className="font-display uppercase">
          <span className="block text-2xl leading-none">{info.kicker}</span>
          <span className="block text-[clamp(3.25rem,16.5vw,9.5rem)] leading-[0.9] whitespace-nowrap">
            {SITE_NAME}
            <span
              className="ml-[0.05em] inline-block size-[0.2em] rounded-full"
              style={{ backgroundColor: "var(--palette-accent, currentColor)" }}
              aria-hidden="true"
            />
          </span>
        </p>
        <h1 className="mt-8 max-w-3xl font-display text-2xl leading-tight text-balance sm:text-4xl">{info.heading}</h1>
        <p className="mt-4 mb-6 max-w-[60ch] text-lg text-muted-foreground">{info.intro}</p>
        <StartButton>{info.start}</StartButton>
      </section>

      <section className={SECTION}>
        <h2 className="font-display text-3xl leading-tight">{info.featuresLabel}</h2>
        <ul className="grid gap-x-8 gap-y-9 sm:grid-cols-2 md:col-span-3 lg:grid-cols-3">
          {info.features.map((feature, index) => (
            <li key={feature.title} className="space-y-1.5">
              <span className="block font-display text-lg text-quiet tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-xl leading-snug">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="font-display text-3xl leading-tight">{info.questions}</h2>
        <dl className="divide-y divide-border md:col-span-3">
          {faq.map(({ question, answer }) => (
            <div key={question} className="grid gap-x-8 gap-y-1.5 py-5 first:pt-0 last:pb-0 md:grid-cols-3">
              <dt className="font-semibold">{question}</dt>
              <dd className="text-muted-foreground md:col-span-2">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
