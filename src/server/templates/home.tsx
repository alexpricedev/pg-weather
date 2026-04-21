import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface HomeProps {
  user: User | null;
  csrfToken?: string;
}

export const Home = ({ user, csrfToken }: HomeProps) => (
  <Layout title="pg-weather" name="home" user={user} csrfToken={csrfToken}>
    <section className="welcome">
      <h1>pg-weather</h1>
      <p className="lead">A full-stack TypeScript app built with Bun.</p>
    </section>
  </Layout>
);
