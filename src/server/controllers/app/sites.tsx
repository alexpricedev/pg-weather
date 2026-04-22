import type { BunRequest } from "bun";
import { getSessionContext, requireAuth } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import type { ForecastHour } from "../../services/open-meteo";
import { safeFetchForecast } from "../../services/open-meteo";
import {
  createSite,
  deleteSite,
  getSiteById,
  getSitesForUser,
  updateSite,
} from "../../services/sites";
import type { User } from "../../services/users";
import { SiteEdit } from "../../templates/site-edit";
import type { HeaderStatus } from "../../templates/site-show";
import { SiteShow } from "../../templates/site-show";
import type {
  SiteCardSummary,
  SitesIndexState,
} from "../../templates/sites-index";
import { SitesIndex } from "../../templates/sites-index";
import {
  effectiveSpeedRange,
  type FlyableWindow,
  findNextFlyableWindow,
  hasAnyBound,
} from "../../utils/flyability";
import {
  dateKeyInTimezone,
  formatHourLabel,
  groupForecastByDay,
} from "../../utils/forecast-day";
import { redirect, render } from "../../utils/response";
import {
  emptyValues,
  readFormValues,
  type SiteFormErrors,
  type SiteFormValues,
  validateSiteForm,
} from "../../utils/site-form";
import { stateHelpers } from "../../utils/state";
import {
  convertWindSpeed,
  degreesToCardinal,
  formatWindSpeed,
  type WindArc,
} from "../../utils/wind";

const { getFlash, setFlash } = stateHelpers<SitesIndexState>();

const getNavCsrfToken = async (
  sessionId: string | null,
): Promise<string | undefined> => {
  if (!sessionId) return undefined;
  return createCsrfToken(sessionId, "POST", "/auth/logout");
};

const findHourAt = (
  hours: ForecastHour[],
  target: Date,
): ForecastHour | null => {
  const targetMs = target.getTime();
  for (const h of hours) {
    if (h.time.getTime() === targetMs) return h;
  }
  return null;
};

const formatEndLabel = (end: Date, timezone: string): string => {
  const raw = formatHourLabel(end, timezone);
  return raw === "00:00" ? "midnight" : raw;
};

const dayOffsetLabel = (
  offset: number,
  start: Date,
  timezone: string,
): string => {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
  }).format(start);
};

const formatDurationUntil = (target: Date, now: Date): string => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

const formatDurationApprox = (target: Date, now: Date): string => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "now";
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 1) return "in under an hour";
  if (hours < 24) return `in about ${hours} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "in about a day" : `in about ${days} days`;
};

const formatWindAtHour = (
  hour: ForecastHour | null,
  unit: "kph" | "mph",
): string => {
  if (!hour) return "";
  const dir = degreesToCardinal(hour.windDirectionDegrees);
  const speed = formatWindSpeed(hour.windSpeedKph, unit);
  return `${dir} ${speed}`;
};

const buildHeaderStatus = (args: {
  forecastOk: boolean;
  hasBounds: boolean;
  window: FlyableWindow | null;
  timezone: string | null;
  currentHour: ForecastHour | null;
  windowStartHour: ForecastHour | null;
  user: User;
  now?: Date;
}): HeaderStatus => {
  const now = args.now ?? new Date();
  if (!args.forecastOk || !args.timezone) {
    return {
      kind: "forecast-error",
      label: "Forecast unavailable",
      headline: "Try again shortly",
    };
  }
  if (!args.hasBounds) {
    return {
      kind: "no-bounds",
      label: "Set wind limits",
      headline: "in settings",
    };
  }
  if (!args.window) {
    return {
      kind: "off",
      label: "Not flyable",
      headline: "Next 3 days",
    };
  }
  if (args.window.inProgress) {
    const endLabel = formatEndLabel(args.window.end, args.timezone);
    const wind = formatWindAtHour(args.currentHour, args.user.wind_speed_unit);
    const headline = wind ? `Until ${endLabel} · ${wind}` : `Until ${endLabel}`;
    return {
      kind: "now",
      label: "Flyable now",
      headline,
      detail: `Window closes in ${formatDurationUntil(args.window.end, now)}`,
    };
  }
  const startLabel = formatHourLabel(args.window.start, args.timezone);
  const endLabel = formatEndLabel(args.window.end, args.timezone);
  const wind = formatWindAtHour(
    args.windowStartHour,
    args.user.wind_speed_unit,
  );
  const range = `${startLabel} – ${endLabel}`;
  const headline = wind ? `${range} · ${wind}` : range;
  const day = dayOffsetLabel(
    args.window.dayOffset,
    args.window.start,
    args.timezone,
  );
  return {
    kind: "soon",
    label: `Flyable ${day}`,
    headline,
    detail: formatDurationApprox(args.window.start, now),
  };
};

const findCurrentHour = (
  hours: ReturnType<typeof groupForecastByDay>[number]["hours"],
  timezone: string,
  now: Date = new Date(),
): (typeof hours)[number] | null => {
  if (hours.length === 0) return null;
  const nowKey = dateKeyInTimezone(now, timezone);
  const nowHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  const nowHourNum = Number.parseInt(nowHour, 10);
  for (const h of hours) {
    if (dateKeyInTimezone(h.time, timezone) !== nowKey) continue;
    const hourStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(h.time);
    if (Number.parseInt(hourStr, 10) === nowHourNum) return h;
  }
  return hours[0];
};

const formatSpeedForInput = (
  kph: number | null,
  unit: "kph" | "mph",
): string => {
  if (kph === null) return "";
  const value = convertWindSpeed(kph, unit);
  return String(Math.round(value * 10) / 10);
};

const valuesFromSite = (
  site: {
    name: string;
    latitude: number;
    longitude: number;
    wind_arcs: WindArc[];
    club_url: string | null;
    notes: string | null;
    min_wind_speed_kph: number | null;
    max_wind_speed_kph: number | null;
    min_wind_gust_kph: number | null;
    max_wind_gust_kph: number | null;
  },
  unit: "kph" | "mph",
): SiteFormValues => ({
  name: site.name,
  latitude: String(site.latitude),
  longitude: String(site.longitude),
  arcs: site.wind_arcs,
  club_url: site.club_url ?? "",
  notes: site.notes ?? "",
  min_wind_speed: formatSpeedForInput(site.min_wind_speed_kph, unit),
  max_wind_speed: formatSpeedForInput(site.max_wind_speed_kph, unit),
  min_wind_gust: formatSpeedForInput(site.min_wind_gust_kph, unit),
  max_wind_gust: formatSpeedForInput(site.max_wind_gust_kph, unit),
});

export const sites = {
  async index(req: BunRequest): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const userSites = await getSitesForUser(ctx.user.id);
    const navCsrfToken = await getNavCsrfToken(ctx.sessionId);

    const user = ctx.user;
    const summaries: SiteCardSummary[] = await Promise.all(
      userSites.map(async (site): Promise<SiteCardSummary> => {
        const range = effectiveSpeedRange(site, user);
        const forecast = await safeFetchForecast(site.latitude, site.longitude);
        if (!forecast.ok) {
          return {
            site,
            forecastOk: false,
            hasBounds: hasAnyBound(range),
            window: null,
            timezone: null,
          };
        }
        const window = findNextFlyableWindow(
          forecast.forecast.hours,
          site,
          range,
          forecast.forecast.timezone,
        );
        return {
          site,
          forecastOk: true,
          hasBounds: hasAnyBound(range),
          window,
          timezone: forecast.forecast.timezone,
        };
      }),
    );

    return render(
      <SitesIndex
        user={ctx.user}
        csrfToken={navCsrfToken}
        summaries={summaries}
        state={getFlash(req)}
      />,
    );
  },

  async new(req: BunRequest): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const navCsrfToken = await getNavCsrfToken(ctx.sessionId);
    const formCsrfToken = await createCsrfToken(
      ctx.sessionId,
      "POST",
      "/sites",
    );

    return render(
      <SiteEdit
        user={ctx.user}
        csrfToken={navCsrfToken}
        formCsrfToken={formCsrfToken}
        mode="new"
        values={emptyValues()}
        errors={{}}
        showValidationError={false}
      />,
    );
  },

  async create(req: BunRequest): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const csrfResponse = await csrfProtection(req, {
      method: "POST",
      path: "/sites",
    });
    if (csrfResponse) return csrfResponse;

    const values = readFormValues(await req.formData());
    const validation = validateSiteForm(values, ctx.user.wind_speed_unit);

    if (!validation.ok) {
      const navCsrfToken = await getNavCsrfToken(ctx.sessionId);
      const formCsrfToken = await createCsrfToken(
        ctx.sessionId,
        "POST",
        "/sites",
      );
      return render(
        <SiteEdit
          user={ctx.user}
          csrfToken={navCsrfToken}
          formCsrfToken={formCsrfToken}
          mode="new"
          values={values}
          errors={validation.errors as SiteFormErrors}
          showValidationError={true}
        />,
      );
    }

    const site = await createSite(ctx.user.id, validation.input);
    setFlash(req, { state: "created" });
    return redirect(`/sites/${site.id}`);
  },

  async show<T extends `${string}:id${string}`>(
    req: BunRequest<T>,
  ): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const site = await getSiteById(req.params.id, ctx.user.id);
    if (!site) return redirect("/sites");

    const navCsrfToken = await getNavCsrfToken(ctx.sessionId);

    const forecastResult = await safeFetchForecast(
      site.latitude,
      site.longitude,
    );

    const url = new URL(req.url);
    const requestedDay = Number.parseInt(url.searchParams.get("day") ?? "", 10);

    let forecastPayload:
      | {
          ok: true;
          timezone: string;
          days: ReturnType<typeof groupForecastByDay>;
          selectedDayIndex: number;
          currentHour: ReturnType<typeof findCurrentHour>;
        }
      | { ok: false; error: string };

    const range = effectiveSpeedRange(site, ctx.user);
    let headerStatus: HeaderStatus;

    if (forecastResult.ok) {
      const days = groupForecastByDay(
        forecastResult.forecast.hours,
        forecastResult.forecast.timezone,
      );
      const selectedDayIndex = Number.isFinite(requestedDay)
        ? Math.max(0, Math.min(days.length - 1, requestedDay))
        : 0;
      const currentHour = findCurrentHour(
        forecastResult.forecast.hours,
        forecastResult.forecast.timezone,
      );
      const window = findNextFlyableWindow(
        forecastResult.forecast.hours,
        site,
        range,
        forecastResult.forecast.timezone,
      );
      const windowStartHour = window
        ? findHourAt(forecastResult.forecast.hours, window.start)
        : null;
      headerStatus = buildHeaderStatus({
        forecastOk: true,
        hasBounds: hasAnyBound(range),
        window,
        timezone: forecastResult.forecast.timezone,
        currentHour,
        windowStartHour,
        user: ctx.user,
      });
      forecastPayload = {
        ok: true,
        timezone: forecastResult.forecast.timezone,
        days,
        selectedDayIndex,
        currentHour,
      };
    } else {
      forecastPayload = { ok: false, error: forecastResult.error };
      headerStatus = buildHeaderStatus({
        forecastOk: false,
        hasBounds: hasAnyBound(range),
        window: null,
        timezone: null,
        currentHour: null,
        windowStartHour: null,
        user: ctx.user,
      });
    }

    return render(
      <SiteShow
        user={ctx.user}
        csrfToken={navCsrfToken}
        site={site}
        forecast={forecastPayload}
        windSpeedUnit={ctx.user.wind_speed_unit}
        headerStatus={headerStatus}
        state={{}}
      />,
    );
  },

  async edit<T extends `${string}:id${string}`>(
    req: BunRequest<T>,
  ): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const site = await getSiteById(req.params.id, ctx.user.id);
    if (!site) return redirect("/sites");

    const navCsrfToken = await getNavCsrfToken(ctx.sessionId);
    const formCsrfToken = await createCsrfToken(
      ctx.sessionId,
      "POST",
      `/sites/${site.id}`,
    );
    const deleteCsrfToken = await createCsrfToken(
      ctx.sessionId,
      "POST",
      `/sites/${site.id}/delete`,
    );

    return render(
      <SiteEdit
        user={ctx.user}
        csrfToken={navCsrfToken}
        formCsrfToken={formCsrfToken}
        mode="edit"
        siteId={site.id}
        siteName={site.name}
        deleteCsrfToken={deleteCsrfToken}
        values={valuesFromSite(site, ctx.user.wind_speed_unit)}
        errors={{}}
        showValidationError={false}
      />,
    );
  },

  async update<T extends `${string}:id${string}`>(
    req: BunRequest<T>,
  ): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const csrfResponse = await csrfProtection(req, {
      method: "POST",
      path: `/sites/${req.params.id}`,
    });
    if (csrfResponse) return csrfResponse;

    const existing = await getSiteById(req.params.id, ctx.user.id);
    if (!existing) return redirect("/sites");

    const values = readFormValues(await req.formData());
    const validation = validateSiteForm(values, ctx.user.wind_speed_unit);

    if (!validation.ok) {
      const navCsrfToken = await getNavCsrfToken(ctx.sessionId);
      const formCsrfToken = await createCsrfToken(
        ctx.sessionId,
        "POST",
        `/sites/${existing.id}`,
      );
      return render(
        <SiteEdit
          user={ctx.user}
          csrfToken={navCsrfToken}
          formCsrfToken={formCsrfToken}
          mode="edit"
          siteId={existing.id}
          values={values}
          errors={validation.errors}
          showValidationError={true}
        />,
      );
    }

    await updateSite(existing.id, ctx.user.id, validation.input);
    setFlash(req, { state: "updated" });
    return redirect(`/sites/${existing.id}`);
  },

  async destroy<T extends `${string}:id${string}`>(
    req: BunRequest<T>,
  ): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const csrfResponse = await csrfProtection(req, {
      method: "POST",
      path: `/sites/${req.params.id}/delete`,
    });
    if (csrfResponse) return csrfResponse;

    await deleteSite(req.params.id, ctx.user.id);
    setFlash(req, { state: "deleted" });
    return redirect("/sites");
  },
};
