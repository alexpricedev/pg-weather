import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { setSessionCookie } from "../../services/sessions";
import { Home } from "../../templates/home";
import { redirect, render } from "../../utils/response";

export const home = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    if (ctx.requiresSetCookie && ctx.sessionId) {
      setSessionCookie(req, ctx.sessionId);
    }

    if (ctx.isAuthenticated) {
      return redirect("/sites");
    }

    return render(<Home user={ctx.user} />);
  },
};
