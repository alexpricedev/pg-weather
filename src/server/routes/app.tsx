import { forms, home, projects, settings, sites } from "../controllers/app";
import { callback, login, logout } from "../controllers/auth";
import { createRouteHandler } from "../utils/route-handler";

export const appRoutes = {
  "/": home.index,
  "/forms": createRouteHandler({
    GET: forms.index,
    POST: forms.create,
  }),
  "/projects": createRouteHandler({
    GET: projects.index,
    POST: projects.create,
  }),
  "/projects/:id/delete": createRouteHandler({
    POST: projects.destroy<"/projects/:id/delete">,
  }),
  "/sites": createRouteHandler({
    GET: sites.index,
    POST: sites.create,
  }),
  "/sites/new": createRouteHandler({
    GET: sites.new,
  }),
  "/sites/:id": createRouteHandler({
    GET: sites.show<"/sites/:id">,
    POST: sites.update<"/sites/:id">,
  }),
  "/sites/:id/edit": createRouteHandler({
    GET: sites.edit<"/sites/:id/edit">,
  }),
  "/sites/:id/delete": createRouteHandler({
    POST: sites.destroy<"/sites/:id/delete">,
  }),
  "/settings": createRouteHandler({
    GET: settings.index,
    POST: settings.update,
  }),
  "/login": createRouteHandler({
    GET: login.index,
    POST: login.create,
  }),
  "/auth/callback": callback.index,
  "/auth/logout": createRouteHandler({
    POST: logout.create,
  }),
};
