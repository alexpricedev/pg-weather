import type { JSX } from "react";
import { CompassRose } from "../components/compass-rose";
import { Layout } from "../components/layouts";
import type { ForecastHour } from "../services/open-meteo";
import type { Site } from "../services/sites";
import type { User, WindSpeedUnit } from "../services/users";
import {
  effectiveSpeedRange,
  isFlyableHour,
  type SpeedRange,
} from "../utils/flyability";
import {
  classifyHour,
  type ForecastDay,
  formatHourLabel,
} from "../utils/forecast-day";
import { weatherCodeInfo } from "../utils/weather-code";
import {
  degreesToCardinal,
  formatArcSummary,
  formatSpeedRange,
  formatWindSpeed,
  isDegreeInAnyArc,
} from "../utils/wind";

export interface SiteShowState {
  state?: "created" | "updated";
}

export type HeaderStatus =
  | { kind: "now"; label: string; headline: string; detail: string }
  | { kind: "soon"; label: string; headline: string; detail: string }
  | { kind: "off"; label: string; headline: string; detail?: string }
  | { kind: "no-bounds"; label: string; headline: string; detail?: string }
  | {
      kind: "forecast-error";
      label: string;
      headline: string;
      detail?: string;
    };

interface SiteShowProps {
  user: User;
  csrfToken?: string;
  site: Site;
  forecast:
    | {
        ok: true;
        timezone: string;
        days: ForecastDay[];
        selectedDayIndex: number;
        currentHour: ForecastHour | null;
      }
    | { ok: false; error: string };
  windSpeedUnit: WindSpeedUnit;
  headerStatus: HeaderStatus;
  state: SiteShowState;
}

const STATUS_VARIANT_CLASS: Record<HeaderStatus["kind"], string> = {
  now: "is-now",
  soon: "is-soon",
  off: "is-off",
  "no-bounds": "is-off",
  "forecast-error": "is-off",
};

const StatusIcon = ({ kind }: { kind: HeaderStatus["kind"] }): JSX.Element => {
  if (kind === "now") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M17.73 7.73A2 2 0 1 1 19.5 11H2" />
        <path d="M14.59 15.41A2 2 0 1 0 16 19H2" />
      </svg>
    );
  }
  if (kind === "soon") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M9.59 4.59A2 2 0 1 1 11 8H6" />
      <path d="M17 11H8" />
    </svg>
  );
};

const StatusCard = ({ status }: { status: HeaderStatus }): JSX.Element => (
  <div className={`status-card ${STATUS_VARIANT_CLASS[status.kind]}`}>
    <div className="status-card-accent">
      <StatusIcon kind={status.kind} />
    </div>
    <div className="status-card-body">
      <span className="status-card-label">{status.label}</span>
      <span className="status-card-headline">{status.headline}</span>
      {status.detail && (
        <span className="status-card-detail">{status.detail}</span>
      )}
    </div>
  </div>
);

export const SiteShow = ({
  user,
  csrfToken,
  site,
  forecast,
  windSpeedUnit,
  headerStatus,
}: SiteShowProps): JSX.Element => {
  const range = effectiveSpeedRange(site, user);
  const windOverride =
    site.min_wind_speed_kph !== null || site.max_wind_speed_kph !== null;
  const gustOverride =
    site.min_wind_gust_kph !== null || site.max_wind_gust_kph !== null;
  const hasWindRange = range.minWindKph !== null || range.maxWindKph !== null;
  return (
    <Layout
      title={`${site.name} — Windrose`}
      name="sites"
      user={user}
      csrfToken={csrfToken}
    >
      <div className="detail-header">
        <div className="detail-header-main">
          <p className="breadcrumb">
            <a href="/sites">← All sites</a>
          </p>
          <h1 className="detail-title">{site.name}</h1>
          <p className="detail-meta">
            <span className="arcs">{formatArcSummary(site.wind_arcs)}</span>
            <span className="dot">·</span>
            <span className="coords">
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </span>
            {hasWindRange && (
              <>
                <span className="dot">·</span>
                <span>
                  Wind{" "}
                  {formatSpeedRange(
                    range.minWindKph,
                    range.maxWindKph,
                    windSpeedUnit,
                  )}
                </span>
              </>
            )}
          </p>
        </div>
        <div>
          <StatusCard status={headerStatus} />
          <div className="detail-actions">
            {site.club_url && (
              <a
                href={site.club_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Club page ↗
              </a>
            )}
            <a href={`/sites/${site.id}/edit`} className="btn-ghost">
              Edit
            </a>
          </div>
        </div>
      </div>

      <div className="site-show-grid">
        <section className="card site-show-meta">
          <CompassRose
            arcs={site.wind_arcs}
            windDirection={
              forecast.ok && forecast.currentHour
                ? forecast.currentHour.windDirectionDegrees
                : undefined
            }
          />
          {forecast.ok && forecast.currentHour && (
            <p className="site-show-wind-now">
              <span className="site-show-wind-now-label">Wind now</span>
              <span className="site-show-wind-now-value">
                {Math.round(forecast.currentHour.windDirectionDegrees)}°{" "}
                {degreesToCardinal(forecast.currentHour.windDirectionDegrees)} ·{" "}
                {formatWindSpeed(
                  forecast.currentHour.windSpeedKph,
                  windSpeedUnit,
                )}
              </span>
            </p>
          )}
          <dl className="site-show-limits">
            <div className="site-show-limit">
              <dt>
                Wind
                {windOverride && (
                  <span className="site-show-limit-badge">site</span>
                )}
              </dt>
              <dd>
                {formatSpeedRange(
                  range.minWindKph,
                  range.maxWindKph,
                  windSpeedUnit,
                )}
              </dd>
            </div>
            <div className="site-show-limit">
              <dt>
                Gusts
                {gustOverride && (
                  <span className="site-show-limit-badge">site</span>
                )}
              </dt>
              <dd>
                {formatSpeedRange(
                  range.minGustKph,
                  range.maxGustKph,
                  windSpeedUnit,
                )}
              </dd>
            </div>
          </dl>
          {site.notes && (
            <div className="site-show-notes">
              <h3>Notes</h3>
              <p>{site.notes}</p>
            </div>
          )}
        </section>

        <section className="card site-show-forecast">
          <div className="forecast-header">
            <h2>Forecast</h2>
            {forecast.ok && (
              <p className="text-tertiary">
                All times shown in {forecast.timezone.replace("_", " ")}.
              </p>
            )}
          </div>

          {forecast.ok ? (
            <ForecastTabs
              days={forecast.days}
              selectedDayIndex={forecast.selectedDayIndex}
              siteId={site.id}
              timezone={forecast.timezone}
              site={site}
              speedRange={effectiveSpeedRange(site, user)}
              windSpeedUnit={windSpeedUnit}
            />
          ) : (
            <div className="forecast-error">
              <p>Could not load the forecast right now.</p>
              <p className="text-tertiary">{forecast.error}</p>
              <a href={`/sites/${site.id}`} className="btn-ghost">
                Retry
              </a>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

interface ForecastTabsProps {
  days: ForecastDay[];
  selectedDayIndex: number;
  siteId: string;
  timezone: string;
  site: Site;
  speedRange: SpeedRange;
  windSpeedUnit: WindSpeedUnit;
}

const ForecastTabs = ({
  days,
  selectedDayIndex,
  siteId,
  timezone,
  site,
  speedRange,
  windSpeedUnit,
}: ForecastTabsProps): JSX.Element => {
  const arcs = site.wind_arcs;
  const selected = days[selectedDayIndex] ?? days[0];
  return (
    <div>
      <nav className="forecast-day-tabs" aria-label="Forecast day selector">
        {days.map((day, i) => (
          <a
            key={day.key}
            href={`/sites/${siteId}?day=${i}`}
            className={i === selectedDayIndex ? "active" : undefined}
            aria-current={i === selectedDayIndex ? "page" : undefined}
          >
            {day.label}
          </a>
        ))}
      </nav>

      {selected.hours.length === 0 ? (
        <p className="text-tertiary">No forecast data for this day.</p>
      ) : (
        <div className="forecast-table-wrapper" data-forecast-wrapper>
          <div className="forecast-range-toggles">
            <button
              type="button"
              className="btn-ghost"
              data-forecast-toggle="early"
              aria-pressed="false"
            >
              Show before 08:00
            </button>
            <button
              type="button"
              className="btn-ghost"
              data-forecast-toggle="late"
              aria-pressed="false"
            >
              Show after 18:00
            </button>
          </div>
          <table className="forecast-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Weather</th>
                <th>Temp</th>
                <th>Precip</th>
                <th>Cloud</th>
                <th>Wind</th>
                <th>Gusts</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
              {selected.hours.map((hour) => {
                const info = weatherCodeInfo(hour.weatherCode);
                const inArc = isDegreeInAnyArc(hour.windDirectionDegrees, arcs);
                const flyable = isFlyableHour(hour, site, speedRange, timezone);
                const period = classifyHour(hour.time, timezone);
                const rowClass = flyable
                  ? "is-flyable"
                  : inArc
                    ? "arc-match"
                    : undefined;
                return (
                  <tr
                    key={hour.time.toISOString()}
                    className={rowClass}
                    data-period={period}
                  >
                    <td className="forecast-time">
                      {formatHourLabel(hour.time, timezone)}
                    </td>
                    <td>
                      <span
                        className="weather-icon"
                        role="img"
                        title={info.label}
                        aria-label={info.label}
                      >
                        {info.icon}
                      </span>
                    </td>
                    <td>{Math.round(hour.temperatureC)}°C</td>
                    <td>
                      {hour.precipitationMm > 0
                        ? `${hour.precipitationMm.toFixed(1)} mm`
                        : `${Math.round(hour.precipitationProbability)}%`}
                    </td>
                    <td>{Math.round(hour.cloudCoverPercent)}%</td>
                    <td>{formatWindSpeed(hour.windSpeedKph, windSpeedUnit)}</td>
                    <td>{formatWindSpeed(hour.windGustsKph, windSpeedUnit)}</td>
                    <td>
                      <div className="forecast-direction-cell">
                        <CompassRose
                          arcs={arcs}
                          windDirection={hour.windDirectionDegrees}
                          size={44}
                          compact
                        />
                        <span className="forecast-direction-label">
                          {Math.round(hour.windDirectionDegrees)}°{" "}
                          {degreesToCardinal(hour.windDirectionDegrees)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
