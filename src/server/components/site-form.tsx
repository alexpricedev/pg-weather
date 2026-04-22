import type { JSX } from "react";
import type { SiteFormErrors, SiteFormValues } from "../utils/site-form";
import type { WindSpeedUnit } from "../utils/wind";
import { CsrfField } from "./csrf-field";
import { FormField } from "./form-field";

interface SiteFormProps {
  action: string;
  submitLabel: string;
  csrfToken: string | null;
  values: SiteFormValues;
  errors: SiteFormErrors;
  cancelHref: string;
  unit: WindSpeedUnit;
}

export const SiteForm = ({
  action,
  submitLabel,
  csrfToken,
  values,
  errors,
  cancelHref,
  unit,
}: SiteFormProps): JSX.Element => {
  const arcs =
    values.arcs.length > 0 ? values.arcs : [[0, 90] as [number, number]];

  return (
    <form method="POST" action={action} className="site-form">
      <CsrfField token={csrfToken} />

      <FormField label="Name" id="site-name">
        <input
          id="site-name"
          name="name"
          type="text"
          required
          minLength={2}
          defaultValue={values.name}
          placeholder="Mam Tor"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </FormField>

      <div className="site-form-row">
        <FormField label="Latitude" id="site-latitude">
          <input
            id="site-latitude"
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            required
            defaultValue={values.latitude}
            placeholder="53.349"
          />
          {errors.latitude && <p className="field-error">{errors.latitude}</p>}
        </FormField>
        <FormField label="Longitude" id="site-longitude">
          <input
            id="site-longitude"
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            required
            defaultValue={values.longitude}
            placeholder="-1.809"
          />
          {errors.longitude && (
            <p className="field-error">{errors.longitude}</p>
          )}
        </FormField>
      </div>

      <fieldset className="arc-fieldset" data-arc-fieldset>
        <legend>Acceptable wind arcs (degrees, clockwise)</legend>
        {errors.wind_arcs && <p className="field-error">{errors.wind_arcs}</p>}
        <div className="arc-list" data-arc-list>
          {arcs.map((arc, i) => (
            <div
              className="arc-row"
              data-arc-row
              key={`${arc[0]}-${arc[1]}-${i}`}
            >
              <label>
                From
                <input
                  type="number"
                  name="arc_from"
                  min={0}
                  max={359}
                  step="1"
                  required
                  defaultValue={arc[0]}
                />
              </label>
              <label>
                To
                <input
                  type="number"
                  name="arc_to"
                  min={0}
                  max={359}
                  step="1"
                  required
                  defaultValue={arc[1]}
                />
              </label>
              <button
                type="button"
                className="btn-ghost arc-remove"
                data-arc-remove
                aria-label="Remove this arc"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-ghost" data-arc-add>
          + Add another arc
        </button>
      </fieldset>

      <FormField label="Club URL (optional)" id="site-club-url">
        <input
          id="site-club-url"
          name="club_url"
          type="url"
          placeholder="https://"
          defaultValue={values.club_url}
        />
        {errors.club_url && <p className="field-error">{errors.club_url}</p>}
      </FormField>

      <FormField label="Notes (optional)" id="site-notes">
        <textarea
          id="site-notes"
          name="notes"
          rows={4}
          placeholder="Hazards, parking, anything useful..."
          defaultValue={values.notes}
        />
      </FormField>

      <fieldset className="site-form-speed-overrides">
        <legend>Site speed overrides (optional)</legend>
        <p className="text-tertiary settings-hint">
          Leave blank to use your default range from settings. Override here for
          sites with different tolerances (e.g. a kiting-only spot). Values in{" "}
          {unit}.
        </p>
        <div className="site-form-row">
          <FormField label="Min wind speed" id="site-min-wind">
            <input
              id="site-min-wind"
              name="min_wind_speed"
              type="number"
              min={0}
              step="0.5"
              defaultValue={values.min_wind_speed}
              placeholder="inherit"
            />
            {errors.min_wind_speed && (
              <p className="field-error">{errors.min_wind_speed}</p>
            )}
          </FormField>
          <FormField label="Max wind speed" id="site-max-wind">
            <input
              id="site-max-wind"
              name="max_wind_speed"
              type="number"
              min={0}
              step="0.5"
              defaultValue={values.max_wind_speed}
              placeholder="inherit"
            />
            {errors.max_wind_speed && (
              <p className="field-error">{errors.max_wind_speed}</p>
            )}
          </FormField>
        </div>
        <div className="site-form-row">
          <FormField label="Min gust" id="site-min-gust">
            <input
              id="site-min-gust"
              name="min_wind_gust"
              type="number"
              min={0}
              step="0.5"
              defaultValue={values.min_wind_gust}
              placeholder="inherit"
            />
            {errors.min_wind_gust && (
              <p className="field-error">{errors.min_wind_gust}</p>
            )}
          </FormField>
          <FormField label="Max gust" id="site-max-gust">
            <input
              id="site-max-gust"
              name="max_wind_gust"
              type="number"
              min={0}
              step="0.5"
              defaultValue={values.max_wind_gust}
              placeholder="inherit"
            />
            {errors.max_wind_gust && (
              <p className="field-error">{errors.max_wind_gust}</p>
            )}
          </FormField>
        </div>
      </fieldset>

      <div className="site-form-actions">
        <a href={cancelHref} className="btn-ghost">
          Cancel
        </a>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
};
