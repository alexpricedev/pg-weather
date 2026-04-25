import { initializePage, registerPage } from "@client/page-lifecycle";
import { init as initHome } from "@client/pages/home";
import { init as initSites } from "@client/pages/sites";

registerPage("home", { init: initHome });
registerPage("sites", { init: initSites });

initializePage(document.body.dataset.page);
