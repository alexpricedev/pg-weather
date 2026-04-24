import type { JSX } from "react";
import { CsrfField } from "../components/csrf-field";
import { Flash } from "../components/flash";
import { FormField } from "../components/form-field";
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
              blank to skip that check. Values in {unitLabel}.
            </p>
            <div className="settings-form-row">
              <FormField label="Min wind speed" id="settings-min-wind">
                <input
                  id="settings-min-wind"
                  name="min_wind_speed"
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={values.min_wind_speed}
                  placeholder="e.g. 10"
                />
                {errors.min_wind_speed && (
                  <p className="field-error">{errors.min_wind_speed}</p>
                )}
              </FormField>
              <FormField label="Max wind speed" id="settings-max-wind">
                <input
                  id="settings-max-wind"
                  name="max_wind_speed"
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={values.max_wind_speed}
                  placeholder="e.g. 35"
                />
                {errors.max_wind_speed && (
                  <p className="field-error">{errors.max_wind_speed}</p>
                )}
              </FormField>
            </div>
            <div className="settings-form-row">
              <FormField label="Min gust" id="settings-min-gust">
                <input
                  id="settings-min-gust"
                  name="min_wind_gust"
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={values.min_wind_gust}
                  placeholder="e.g. 15"
                />
                {errors.min_wind_gust && (
                  <p className="field-error">{errors.min_wind_gust}</p>
                )}
              </FormField>
              <FormField label="Max gust" id="settings-max-gust">
                <input
                  id="settings-max-gust"
                  name="max_wind_gust"
                  type="number"
                  min={0}
                  step="0.5"
                  defaultValue={values.max_wind_gust}
                  placeholder="e.g. 40"
                />
                {errors.max_wind_gust && (
                  <p className="field-error">{errors.max_wind_gust}</p>
                )}
              </FormField>
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
