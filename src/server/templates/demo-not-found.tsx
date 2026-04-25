import type { JSX } from "react";
import { Layout } from "../components/layouts";
import type { User } from "../services/users";

interface DemoNotFoundProps {
  user: User | null;
  csrfToken?: string;
  validSlugs: readonly string[];
}

export const DemoNotFound = ({
  user,
  csrfToken,
  validSlugs,
}: DemoNotFoundProps): JSX.Element => (
  <Layout
    title="Sample not found — Windrose"
    name="demo"
    user={user}
    csrfToken={csrfToken}
  >
    <section className="demo-not-found">
      <p className="demo-not-found-eyebrow">404 · DEMO</p>
      <h1 className="demo-not-found-headline">Sample not found.</h1>
      <p className="demo-not-found-lead">
        The demo you're looking for isn't here. Try one of these instead.
      </p>
      <ul className="demo-not-found-links">
        {validSlugs.map((slug) => (
          <li key={slug}>
            <a href={`/demo/${slug}`}>/demo/{slug}</a>
          </li>
        ))}
      </ul>
      <p className="demo-not-found-back">
        <a href="/" className="btn-ghost">
          ← Back to home
        </a>
      </p>
    </section>
  </Layout>
);
