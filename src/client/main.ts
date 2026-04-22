import { initializePage, registerPage } from "@client/page-lifecycle";
import { init as initForms } from "@client/pages/forms";
import { init as initHome } from "@client/pages/home";
import { init as initProjects } from "@client/pages/projects";
import { init as initSites } from "@client/pages/sites";

registerPage("home", { init: initHome });
registerPage("forms", { init: initForms });
registerPage("projects", { init: initProjects });
registerPage("sites", { init: initSites });

initializePage(document.body.dataset.page);
