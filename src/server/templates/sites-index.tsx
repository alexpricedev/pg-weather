import type { JSX } from "react";
import { CompassRose } from "../components/compass-rose";
import { Flash } from "../components/flash";
import { Layout } from "../components/layouts";
import type { Site } from "../services/sites";
import type { User } from "../services/users";
import {
  effectiveSpeedRange,
  type FlyableWindow,
  formatFlyableWindow,
} from "../utils/flyability";
import { formatArcSummary, formatSpeedRange } from "../utils/wind";

export interface SitesIndexState {
  state?: "created" | "updated" | "deleted";
}

export interface SiteCardSummary {
  site: Site;
  forecastOk: boolean;
  hasBounds: boolean;
  window: FlyableWindow | null;
  timezone: string | null;
}

interface SitesIndexProps {
  user: User;
  csrfToken?: string;
  summaries: SiteCardSummary[];
  state: SitesIndexState;
}

const FlyableStatus = ({
  summary,
}: {
  summary: SiteCardSummary;
}): JSX.Element => {
  if (!summary.hasBounds) {
    return (
      <div className="site-card-status is-neutral">
        <span className="site-card-status-label">Set wind limits</span>
        <span className="site-card-status-detail">in settings</span>
      </div>
    );
  }
  if (!summary.forecastOk || !summary.timezone) {
    return (
      <div className="site-card-status is-neutral">
        <span className="site-card-status-label">Forecast unavailable</span>
        <span className="site-card-status-detail">Try again shortly</span>
      </div>
    );
  }
  if (!summary.window) {
    return (
      <div className="site-card-status is-off">
        <span className="site-card-status-label">Not flyable</span>
        <span className="site-card-status-detail">in the next 3 days</span>
      </div>
    );
  }
  const label = formatFlyableWindow(summary.window, summary.timezone);
  return (
    <div
      className={`site-card-status ${summary.window.inProgress ? "is-now" : "is-on"}`}
    >
      <span className="site-card-status-label">
        {summary.window.inProgress ? "Flyable now" : "Flyable"}
      </span>
      <span className="site-card-status-detail">
        {label.replace(/^Flyable\s*/, "")}
      </span>
    </div>
  );
};

export const SitesIndex = ({
  user,
  csrfToken,
  summaries,
  state,
}: SitesIndexProps): JSX.Element => (
  <Layout
    title="Sites — pg-weather"
    name="sites"
    user={user}
    csrfToken={csrfToken}
  >
    <div className="page-header">
      <h1>Your sites</h1>
      <a href="/sites/new" className="btn-primary">
        + Add site
      </a>
    </div>

    {state?.state === "created" && <Flash type="success">Site added.</Flash>}
    {state?.state === "updated" && <Flash type="success">Site updated.</Flash>}
    {state?.state === "deleted" && <Flash type="success">Site deleted.</Flash>}

    {summaries.length === 0 ? (
      <section className="card empty-state">
        <h2>No sites yet</h2>
        <p className="text-tertiary">
          Add your first site to start checking forecasts against its acceptable
          wind directions.
        </p>
        <a href="/sites/new" className="btn-primary">
          Add your first site
        </a>
      </section>
    ) : (
      <ul className="sites-list">
        {summaries.map((summary) => {
          const { site } = summary;
          const range = effectiveSpeedRange(site, user);
          const unit = user.wind_speed_unit;
          return (
            <li key={site.id} className="site-card">
              <a href={`/sites/${site.id}`} className="site-card-link">
                <div className="site-card-rose">
                  <CompassRose arcs={site.wind_arcs} size={72} compact />
                </div>
                <div className="site-card-main">
                  <h2>{site.name}</h2>
                  <p className="site-card-meta">
                    <span className="site-card-arcs">
                      {formatArcSummary(site.wind_arcs)}
                    </span>
                    <span className="site-card-coords">
                      {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                    </span>
                  </p>
                  <p className="site-card-limits">
                    <span>
                      <b>Wind</b>{" "}
                      {formatSpeedRange(
                        range.minWindKph,
                        range.maxWindKph,
                        unit,
                      )}
                    </span>
                    <span>
                      <b>Gusts</b>{" "}
                      {formatSpeedRange(
                        range.minGustKph,
                        range.maxGustKph,
                        unit,
                      )}
                    </span>
                  </p>
                </div>
                <FlyableStatus summary={summary} />
              </a>
            </li>
          );
        })}
      </ul>
    )}
  </Layout>
);
