import type { JSX } from "react";
import { CsrfField } from "../components/csrf-field";
import { Flash } from "../components/flash";
import { Layout } from "../components/layouts";
import type { User, WindSpeedUnit } from "../services/users";

export interface SettingsState {
  state?: "updated";
}

export type SettingsFormValues = {
  wind_speed_unit: WindSpeedUnit;
  min_wind_speed: string;
  max_wind_speed: string;
  min_wind_gust: string;
  max_wind_gust: string;
};

export type SettingsFormErrors = {
  min_wind_speed?: string;
  max_wind_speed?: string;
  min_wind_gust?: string;
  max_wind_gust?: string;
};

interface SettingsProps {
  user: User;
  csrfToken?: string;
  formCsrfToken: string | null;
  values: SettingsFormValues;
  errors: SettingsFormErrors;
  state: SettingsState;
  showValidationError?: boolean;
}

export const Settings = ({
  user,
  csrfToken,
  formCsrfToken,
  values,
  errors,
  state,
  showValidationError,
}: SettingsProps): JSX.Element => {
  const unitLabel = values.wind_speed_unit;
  return (
    <Layout
      title="Settings — Windrose"
      name="settings"
      user={user}
      csrfToken={csrfToken}
    >
      <h1>Settings</h1>

      {state.state === "updated" && <Flash type="success">Saved.</Flash>}
      {showValidationError && (
        <Flash type="error">Please fix the errors below and try again.</Flash>
      )}

      <section className="card">
        <form method="POST" action="/settings" className="settings-form">
          <CsrfField token={formCsrfToken} />
          <fieldset>
            <legend>Wind speed unit</legend>
            <label className="radio-option">
              <input
                type="radio"
                name="wind_speed_unit"
                value="kph"
                defaultChecked={values.wind_speed_unit === "kph"}
              />
              <span>Kilometres per hour (kph)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="wind_speed_unit"
                value="mph"
                defaultChecked={values.wind_speed_unit === "mph"}
              />
              <span>Miles per hour (mph)</span>
            </label>
          </fieldset>

          <fieldset>
            <legend>Flyable wind range</legend>
            <p className="text-tertiary settings-hint">
              A forecast hour counts as "fly" when the wind direction sits in an
              accepted arc and every set bound is satisfied. Leave any field
              blank to skip that check. Values in {unitLabel}. These are your
              defaults — you can override them on a per-site basis.
            </p>
            <div className="range-grid">
              <div className="range-grid-head" aria-hidden="true">
                <span />
                <span>Min</span>
                <span>Max</span>
                <span />
              </div>

              <div className="range-pair">
                <span className="range-pair-label">Wind speed</span>
                <div className="range-pair-input">
                  <label
                    htmlFor="settings-min-wind"
                    className="range-pair-sublabel"
                  >
                    Min wind speed
                  </label>
                  <input
                    id="settings-min-wind"
                    name="min_wind_speed"
                    type="number"
                    min={0}
                    step="0.5"
                    defaultValue={values.min_wind_speed}
                    placeholder="—"
                  />
                  {errors.min_wind_speed && (
                    <p className="field-error">{errors.min_wind_speed}</p>
                  )}
                </div>
                <div className="range-pair-input">
                  <label
                    htmlFor="settings-max-wind"
                    className="range-pair-sublabel"
                  >
                    Max wind speed
                  </label>
                  <input
                    id="settings-max-wind"
                    name="max_wind_speed"
                    type="number"
                    min={0}
                    step="0.5"
                    defaultValue={values.max_wind_speed}
                    placeholder="—"
                  />
                  {errors.max_wind_speed && (
                    <p className="field-error">{errors.max_wind_speed}</p>
                  )}
                </div>
                <span className="range-pair-unit">{unitLabel}</span>
              </div>

              <div className="range-pair">
                <span className="range-pair-label">Gusts</span>
                <div className="range-pair-input">
                  <label
                    htmlFor="settings-min-gust"
                    className="range-pair-sublabel"
                  >
                    Min gust
                  </label>
                  <input
                    id="settings-min-gust"
                    name="min_wind_gust"
                    type="number"
                    min={0}
                    step="0.5"
                    defaultValue={values.min_wind_gust}
                    placeholder="—"
                  />
                  {errors.min_wind_gust && (
                    <p className="field-error">{errors.min_wind_gust}</p>
                  )}
                </div>
                <div className="range-pair-input">
                  <label
                    htmlFor="settings-max-gust"
                    className="range-pair-sublabel"
                  >
                    Max gust
                  </label>
                  <input
                    id="settings-max-gust"
                    name="max_wind_gust"
                    type="number"
                    min={0}
                    step="0.5"
                    defaultValue={values.max_wind_gust}
                    placeholder="—"
                  />
                  {errors.max_wind_gust && (
                    <p className="field-error">{errors.max_wind_gust}</p>
                  )}
                </div>
                <span className="range-pair-unit">{unitLabel}</span>
              </div>
            </div>
          </fieldset>

          <div className="settings-actions">
            <button type="submit">Save</button>
          </div>
        </form>
      </section>
    </Layout>
  );
};
