import type { BunRequest } from "bun";
import { renderToString } from "react-dom/server";
import { getSessionContext } from "../../middleware/auth";
import {
  DEMO_SLUGS,
  getDemoForecast,
  getDemoSite,
  getDemoTimezone,
} from "../../services/demos";
import { setSessionCookie } from "../../services/sessions";
import { DemoNotFound } from "../../templates/demo-not-found";
import { SiteShow } from "../../templates/site-show";
import {
  effectiveSpeedRange,
  findNextFlyableWindow,
  hasAnyBound,
} from "../../utils/flyability";
import { groupForecastByDay } from "../../utils/forecast-day";
import { render } from "../../utils/response";
import {
  buildHeaderStatus,
  findCurrentHour,
  findHourAt,
} from "../../utils/site-view";

export const demo = {
  async show<T extends `${string}:slug${string}`>(
    req: BunRequest<T>,
  ): Promise<Response> {
    const ctx = await getSessionContext(req);
    if (ctx.requiresSetCookie && ctx.sessionId) {
      setSessionCookie(req, ctx.sessionId);
    }

    const slug = req.params.slug;
    const site = getDemoSite(slug);
    const timezone = getDemoTimezone(slug);
    if (!site || !timezone) {
      const html = renderToString(
        <DemoNotFound
          user={ctx.user}
          csrfToken={undefined}
          validSlugs={DEMO_SLUGS}
        />,
      );
      return new Response(`<!DOCTYPE html>${html}`, {
        status: 404,
        headers: { "content-type": "text/html" },
      });
    }

    const forecast = getDemoForecast(slug, new Date());
    if (!forecast) {
      // Should be unreachable since site lookup succeeded; defensive fallback.
      return new Response("Forecast unavailable", { status: 500 });
    }

    const range = effectiveSpeedRange(site, ctx.user);
    const days = groupForecastByDay(forecast.hours, forecast.timezone);
    const url = new URL(req.url);
    const requestedDay = Number.parseInt(url.searchParams.get("day") ?? "", 10);
    const selectedDayIndex = Number.isFinite(requestedDay)
      ? Math.max(0, Math.min(days.length - 1, requestedDay))
      : 0;

    const currentHour = findCurrentHour(forecast.hours, forecast.timezone);
    const window = findNextFlyableWindow(
      forecast.hours,
      site,
      range,
      forecast.timezone,
    );
    const windowStartHour = window
      ? findHourAt(forecast.hours, window.start)
      : null;

    const headerStatus = buildHeaderStatus({
      forecastOk: true,
      hasBounds: hasAnyBound(range),
      window,
      timezone: forecast.timezone,
      currentHour,
      windowStartHour,
      user: ctx.user,
    });

    const windSpeedUnit = ctx.user?.wind_speed_unit ?? "kph";

    return render(
      <SiteShow
        user={ctx.user}
        site={site}
        forecast={{
          ok: true,
          timezone: forecast.timezone,
          days,
          selectedDayIndex,
          currentHour,
        }}
        windSpeedUnit={windSpeedUnit}
        headerStatus={headerStatus}
        state={{}}
        isDemo={true}
      />,
    );
  },
};
