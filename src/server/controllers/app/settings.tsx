import type { BunRequest } from "bun";
import { getSessionContext, requireAuth } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { updateUserSettings, type WindSpeedUnit } from "../../services/users";
import type {
  SettingsFormErrors,
  SettingsFormValues,
  SettingsState,
} from "../../templates/settings";
import { Settings } from "../../templates/settings";
import { redirect, render } from "../../utils/response";
import { stateHelpers } from "../../utils/state";
import { convertWindSpeed, toKph } from "../../utils/wind";

const { getFlash, setFlash } = stateHelpers<SettingsState>();

const formatSpeedForInput = (
  kph: number | null,
  unit: WindSpeedUnit,
): string => {
  if (kph === null) return "";
  return String(Math.round(convertWindSpeed(kph, unit) * 10) / 10);
};

const parseOptionalSpeed = (
  raw: string,
  unit: WindSpeedUnit,
): { ok: true; value: number | null } | { ok: false } => {
  if (raw === "") return { ok: true, value: null };
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: Math.round(toKph(n, unit) * 10) / 10 };
};

const readFormValues = (
  formData: FormData,
  fallbackUnit: WindSpeedUnit,
): SettingsFormValues => {
  const raw = String(formData.get("wind_speed_unit") ?? "");
  const unit: WindSpeedUnit =
    raw === "mph" ? "mph" : raw === "kph" ? "kph" : fallbackUnit;
  return {
    wind_speed_unit: unit,
    min_wind_speed: String(formData.get("min_wind_speed") ?? "").trim(),
    max_wind_speed: String(formData.get("max_wind_speed") ?? "").trim(),
    min_wind_gust: String(formData.get("min_wind_gust") ?? "").trim(),
    max_wind_gust: String(formData.get("max_wind_gust") ?? "").trim(),
  };
};

export const settings = {
  async index(req: BunRequest): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const navCsrfToken = await createCsrfToken(
      ctx.sessionId,
      "POST",
      "/auth/logout",
    );
    const formCsrfToken = await createCsrfToken(
      ctx.sessionId,
      "POST",
      "/settings",
    );

    const unit = ctx.user.wind_speed_unit;

    return render(
      <Settings
        user={ctx.user}
        csrfToken={navCsrfToken}
        formCsrfToken={formCsrfToken}
        values={{
          wind_speed_unit: unit,
          min_wind_speed: formatSpeedForInput(
            ctx.user.min_wind_speed_kph,
            unit,
          ),
          max_wind_speed: formatSpeedForInput(
            ctx.user.max_wind_speed_kph,
            unit,
          ),
          min_wind_gust: formatSpeedForInput(ctx.user.min_wind_gust_kph, unit),
          max_wind_gust: formatSpeedForInput(ctx.user.max_wind_gust_kph, unit),
        }}
        errors={{}}
        state={getFlash(req)}
      />,
    );
  },

  async update(req: BunRequest): Promise<Response> {
    const authRedirect = await requireAuth(req);
    if (authRedirect) return authRedirect;

    const ctx = await getSessionContext(req);
    if (!ctx.user || !ctx.sessionId) return redirect("/login");

    const csrfResponse = await csrfProtection(req, {
      method: "POST",
      path: "/settings",
    });
    if (csrfResponse) return csrfResponse;

    const formData = await req.formData();
    const values = readFormValues(formData, ctx.user.wind_speed_unit);

    const errors: SettingsFormErrors = {};
    const minSpeed = parseOptionalSpeed(
      values.min_wind_speed,
      values.wind_speed_unit,
    );
    if (!minSpeed.ok) errors.min_wind_speed = "Must be a non-negative number";

    const maxSpeed = parseOptionalSpeed(
      values.max_wind_speed,
      values.wind_speed_unit,
    );
    if (!maxSpeed.ok) errors.max_wind_speed = "Must be a non-negative number";

    const minGust = parseOptionalSpeed(
      values.min_wind_gust,
      values.wind_speed_unit,
    );
    if (!minGust.ok) errors.min_wind_gust = "Must be a non-negative number";

    const maxGust = parseOptionalSpeed(
      values.max_wind_gust,
      values.wind_speed_unit,
    );
    if (!maxGust.ok) errors.max_wind_gust = "Must be a non-negative number";

    if (Object.keys(errors).length > 0) {
      const navCsrfToken = await createCsrfToken(
        ctx.sessionId,
        "POST",
        "/auth/logout",
      );
      const formCsrfToken = await createCsrfToken(
        ctx.sessionId,
        "POST",
        "/settings",
      );
      return render(
        <Settings
          user={ctx.user}
          csrfToken={navCsrfToken}
          formCsrfToken={formCsrfToken}
          values={values}
          errors={errors}
          state={{}}
          showValidationError
        />,
      );
    }

    await updateUserSettings(ctx.user.id, {
      wind_speed_unit: values.wind_speed_unit,
      min_wind_speed_kph: minSpeed.ok ? minSpeed.value : null,
      max_wind_speed_kph: maxSpeed.ok ? maxSpeed.value : null,
      min_wind_gust_kph: minGust.ok ? minGust.value : null,
      max_wind_gust_kph: maxGust.ok ? maxGust.value : null,
    });
    setFlash(req, { state: "updated" });
    return redirect("/settings");
  },
};
