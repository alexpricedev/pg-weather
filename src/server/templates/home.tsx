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
      <p className="lead">
        A paraglider's forecast planner. Add your flying sites, set the wind
        arcs that launch, and check each site's hourly forecast for today,
        tomorrow, and the day after.
      </p>
      <p>
        <a href="/login" className="btn-primary">
          Log in to get started
        </a>
      </p>
    </section>
  </Layout>
);
