import type { JSX } from "react";
import { CsrfField } from "../components/csrf-field";
import { Flash } from "../components/flash";
import { Layout } from "../components/layouts";
import { SiteForm } from "../components/site-form";
import type { User } from "../services/users";
import type { SiteFormErrors, SiteFormValues } from "../utils/site-form";

interface SiteEditProps {
  user: User;
  csrfToken?: string;
  formCsrfToken: string | null;
  mode: "new" | "edit";
  siteId?: string;
  siteName?: string;
  deleteCsrfToken?: string;
  values: SiteFormValues;
  errors: SiteFormErrors;
  showValidationError: boolean;
}

export const SiteEdit = ({
  user,
  csrfToken,
  formCsrfToken,
  mode,
  siteId,
  siteName,
  deleteCsrfToken,
  values,
  errors,
  showValidationError,
}: SiteEditProps): JSX.Element => {
  const title = mode === "new" ? "Add site" : "Edit site";
  const action = mode === "new" ? "/sites" : `/sites/${siteId}`;
  const submitLabel = mode === "new" ? "Add site" : "Save changes";
  const cancelHref = mode === "new" ? "/sites" : `/sites/${siteId}`;

  return (
    <Layout
      title={`${title} — pg-weather`}
      name="sites"
      user={user}
      csrfToken={csrfToken}
    >
      <h1>{title}</h1>

      {showValidationError && (
        <Flash type="error">Please fix the errors below and try again.</Flash>
      )}

      <section className="card">
        <SiteForm
          action={action}
          submitLabel={submitLabel}
          csrfToken={formCsrfToken}
          values={values}
          errors={errors}
          cancelHref={cancelHref}
          unit={user.wind_speed_unit}
        />
      </section>

      {mode === "edit" && deleteCsrfToken && siteId && (
        <section className="card site-edit-danger">
          <div>
            <h2>Delete site</h2>
            <p className="text-tertiary">
              Removes {siteName ?? "this site"} and all of its saved settings.
              This cannot be undone.
            </p>
          </div>
          <form method="POST" action={`/sites/${siteId}/delete`}>
            <CsrfField token={deleteCsrfToken} />
            <button type="submit" className="btn-danger">
              Delete site
            </button>
          </form>
        </section>
      )}
    </Layout>
  );
};
