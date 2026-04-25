import type { BunRequest } from "bun";
import { getSessionContext, requireAuth } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { safeFetchForecast } from "../../services/open-meteo";
import {
  createSite,
  deleteSite,
  getSiteById,
  getSitesForUser,
  updateSite,
} from "../../services/sites";
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
  findNextFlyableWindow,
  hasAnyBound,
} from "../../utils/flyability";
import { groupForecastByDay } from "../../utils/forecast-day";
import { redirect, render } from "../../utils/response";
import {
  emptyValues,
  readFormValues,
  type SiteFormErrors,
  type SiteFormValues,
  validateSiteForm,
} from "../../utils/site-form";
import {
  buildHeaderStatus,
  findCurrentHour,
  findHourAt,
} from "../../utils/site-view";
import { stateHelpers } from "../../utils/state";
import { convertWindSpeed, type WindArc } from "../../utils/wind";

const { getFlash, setFlash } = stateHelpers<SitesIndexState>();

const getNavCsrfToken = async (
  sessionId: string | null,
): Promise<string | undefined> => {
  if (!sessionId) return undefined;
  return createCsrfToken(sessionId, "POST", "/auth/logout");
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
