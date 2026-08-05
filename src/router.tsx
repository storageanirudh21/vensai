import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Off: the prod SPA shell (dist/client/_shell.html) prerenders header+footer
    // with an empty <main>, and this option bakes a pre-hydration script into
    // that shell which replays the last sessionStorage scrollY via scrollTo()
    // before real content exists — clamping straight to the footer on reload.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
