import type { JSX } from "react";
import { CompassRose } from "../components/compass-rose";
import { Layout } from "../components/layouts";
import type { DemoCardEntry } from "../services/demos";
import type { User } from "../services/users";

interface HomeProps {
  user: User | null;
  csrfToken?: string;
  demoCards: DemoCardEntry[];
}

const STATUS_CLASS: Record<DemoCardEntry["cardSummary"]["state"], string> = {
  now: "is-now",
  soon: "is-soon",
  off: "is-off",
};

const HOW_STEPS: ReadonlyArray<{
  num: string;
  title: string;
  body: string;
}> = [
  {
    num: "01",
    title: "Add a launch",
    body: "Drop a pin for your site. Set the wind directions that work for that launch and the speed range you'll fly in.",
  },
  {
    num: "02",
    title: "Hourly forecast",
    body: "We pull hourly conditions from Open-Meteo for the next 72 hours and stamp the launch with its current wind.",
  },
  {
    num: "03",
    title: "Green rows fly",
    body: "Direction in arc, speed in range, no rain, daylight hours. Green means fly. That's the whole product.",
  },
];

const FAQS: ReadonlyArray<{ q: string; a: JSX.Element }> = [
  {
    q: "Useful for hang gliders, skydivers, or sailplane pilots?",
    a: (
      <>
        The wind-arc and speed-range model works for most direction-sensitive
        launches. Defaults are tuned for paragliders, so a hang-glider pilot may
        find the gust ceiling conservative and a skydiver cares more about cloud
        base than arc direction. If your sport depends on wind direction at a
        specific spot, give it a try, and tell us what you'd change.
      </>
    ),
  },
  {
    q: "Is it free?",
    a: <>Yes. Free for personal use. No ads, no usage limits today.</>,
  },
  {
    q: "What data source?",
    a: (
      <>
        Hourly forecasts from{" "}
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>
        . Same model data used by major aviation tools, refreshed at the source
        roughly every hour.
      </>
    ),
  },
  {
    q: "Is it open source?",
    a: <>Yes, built in public. Source on GitHub.</>,
  },
  {
    q: "Do you have a mobile app?",
    a: (
      <>
        Not yet. The web app is mobile-first and installs cleanly as a PWA from
        your phone's browser.
      </>
    ),
  },
];

const HeroRose = (): JSX.Element => (
  <svg className="hero-rose" viewBox="0 0 400 400" aria-hidden="true">
    <defs>
      <radialGradient id="hero-rose-fill" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5aa6ff" stopOpacity="0" />
        <stop offset="70%" stopColor="#5aa6ff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#5aa6ff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="200" cy="200" r="200" fill="url(#hero-rose-fill)" />
    <g stroke="#2f80ff" strokeWidth="0.5" fill="none" opacity="0.6">
      <circle cx="200" cy="200" r="180" />
      <circle cx="200" cy="200" r="140" />
      <circle cx="200" cy="200" r="100" />
      <circle cx="200" cy="200" r="60" />
    </g>
    <g fill="#123f99" opacity="0.85">
      <polygon points="200,20 210,200 200,200 190,200" />
      <polygon points="200,380 210,200 200,200 190,200" opacity="0.35" />
      <polygon points="20,200 200,190 200,200 200,210" opacity="0.55" />
      <polygon points="380,200 200,190 200,200 200,210" opacity="0.55" />
    </g>
    <circle cx="200" cy="200" r="6" fill="#123f99" />
    <circle cx="200" cy="200" r="2" fill="#ffffff" />
  </svg>
);

const DemoCard = ({ card }: { card: DemoCardEntry }): JSX.Element => (
  <li className="demo-card">
    <a href={`/demo/${card.slug}`} className="demo-card-link">
      <div className="demo-card-rose">
        <CompassRose arcs={card.arcs} size={64} compact />
      </div>
      <div className="demo-card-body">
        <h3 className="demo-card-name">{card.name}</h3>
        <p className="demo-card-meta">
          <span
            className={`demo-card-status ${STATUS_CLASS[card.cardSummary.state]}`}
          >
            {card.cardSummary.statusLabel}
          </span>
        </p>
        <p className="demo-card-wind">{card.cardSummary.windNowSummary}</p>
      </div>
    </a>
  </li>
);

export const Home = ({
  user,
  csrfToken,
  demoCards,
}: HomeProps): JSX.Element => {
  const flyableSlug =
    demoCards.find((c) => c.cardSummary.state === "now")?.slug ??
    demoCards[0]?.slug ??
    "";
  return (
    <Layout title="Windrose" name="home" user={user} csrfToken={csrfToken}>
      <section className="hero" aria-labelledby="hero-heading">
        <HeroRose />
        <div className="hero-grid">
          <div className="hero-body">
            <h1 id="hero-heading" className="hero-headline">
              Your launches.
              <br />
              Your limits.
              <br />
              Today's <span>verdict</span>.
            </h1>
            <p className="lead">
              Add the launches you fly. Set the wind arcs that work for each
              one. Get an honest hourly verdict for the next 72 hours.
            </p>
            <div className="hero-actions">
              <a href="/login" className="btn-primary">
                Add your first site
                <span className="btn-arrow" aria-hidden="true" />
              </a>
              {flyableSlug && (
                <a href={`/demo/${flyableSlug}`} className="btn-ghost">
                  See a sample
                </a>
              )}
            </div>
          </div>
          <div className="hero-meta">
            <span className="stamp">N 46°32'</span>
            <span className="stamp">E 008°12'</span>
            <span className="stamp">ALT 2400 m</span>
            <span className="stamp">WIND 14 KPH</span>
            <span className="stamp stamp-accent">VFR · GOOD</span>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="demos-heading">
        <p className="section-eyebrow">SAMPLE FORECASTS</p>
        <h2 id="demos-heading" className="section-heading">
          Three launches. Three verdicts. Right now.
        </h2>
        <ul className="demo-cards">
          {demoCards.map((card) => (
            <DemoCard key={card.slug} card={card} />
          ))}
        </ul>
      </section>

      <section
        className="home-section how-section"
        aria-labelledby="how-heading"
      >
        <p className="section-eyebrow">HOW IT WORKS</p>
        <h2 id="how-heading" className="section-heading">
          Three steps. No interpretation.
        </h2>
        <ol className="how-steps">
          {HOW_STEPS.map((step) => (
            <li key={step.num} className="how-step">
              <span className="how-step-num">{step.num}</span>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="home-section why-section"
        aria-labelledby="why-heading"
      >
        <p className="section-eyebrow">WINDROSE vs WINDY</p>
        <h2 id="why-heading" className="section-heading">
          Windy is the map. Windrose is the verdict.
        </h2>
        <p className="why-body">
          Windy is one of the best general-purpose weather apps in the world. We
          use it too. But it tells you what the atmosphere is doing — wind,
          pressure, rain, everywhere on Earth. Windrose tells you whether{" "}
          <em>your</em> launch will fly, <em>today</em>, given <em>your</em>{" "}
          wind range. Add Forclaz once. Set the south-southwest arcs that work.
          Set the speed range that suits your wing. Every morning the answer is
          one screen. No interpretation required.
        </p>
      </section>

      <section
        className="home-section faq-section"
        aria-labelledby="faq-heading"
      >
        <p className="section-eyebrow">FAQ</p>
        <h2 id="faq-heading" className="section-heading">
          Asked enough times to answer in print.
        </h2>
        <dl className="faq-list">
          {FAQS.map((item) => (
            <div key={item.q} className="faq-item">
              <dt className="faq-question">{item.q}</dt>
              <dd className="faq-answer">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="home-footer">
        <p className="home-footer-credit">
          Made by paragliders · Windrose 2026
        </p>
        <p className="home-footer-attribution">
          Hourly data from{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
        </p>
      </footer>
    </Layout>
  );
};
