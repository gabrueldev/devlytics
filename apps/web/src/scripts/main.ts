import { showCoffeeCount } from "./coffee-count";
import { enableTagCopy } from "./copy-tag";
import { loadLiveDemo } from "./live-demo";
import { trackNavScroll } from "./nav-state";
import { revealOnScroll } from "./reveal";
import { scrambleOnReveal } from "./scramble";
import { typeInstallTag } from "./typewriter";

trackNavScroll();
revealOnScroll();
enableTagCopy();
typeInstallTag();
scrambleOnReveal();
void loadLiveDemo();
void showCoffeeCount();
