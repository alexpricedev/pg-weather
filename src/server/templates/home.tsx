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
    body: "Add a launch by name and coordinates. Set the wind arcs that work and the speed range you'll fly in.",
  },
  {
    num: "02",
    title: "Hourly forecast",
    body: "We pull hourly conditions from Open-Meteo for the next 72 hours and stamp the launch with its current wind.",
  },
  {
    num: "03",
    title: "See when it's flyable",
    body: "Direction in arc, speed in range, no rain, daylight hours. See your personal forecast.",
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
    a: (
      <>
        Yes, built in public. Source on{" "}
        <a
          href="https://github.com/alexpricedev/pg-weather"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </>
    ),
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

const HeroPreviewImage = (): JSX.Element => (
  <img
    className="hero-preview"
    src="/hero-preview.png"
    alt=""
    aria-hidden="true"
  />
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
    <Layout title="Flyable Today" name="home" user={user} csrfToken={csrfToken}>
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-grid">
          <div className="hero-body">
            <h1 id="hero-heading" className="hero-headline">
              Your launches.
              <br />
              Your limits.
              <br />
              Fly <span>more</span>.
            </h1>
            <p className="lead">
              Add the launches you fly. Set the wind arcs that work for each
              one. Instant clarity on the next 72 hours at every launch you fly.
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
        </div>
        <HeroPreviewImage />
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
        <p className="section-eyebrow">FLYABLE TODAY vs WINDY</p>
        <h2 id="why-heading" className="section-heading">
          Windy is the map. But is it Flyable Today?
        </h2>
        <p className="why-body">
          Windy is one of the best general-purpose weather apps in the world. We
          use it too. But it tells you what the atmosphere is doing — wind,
          pressure, rain, everywhere on Earth. Flyable Today tells you whether{" "}
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
          Things people ask.
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
          Made by{" "}
          <a
            href="https://alexprice.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Alex Price
          </a>{" "}
          · Flyable Today 2026
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
