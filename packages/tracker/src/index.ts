import { startTracker } from "./tracker";

const script = document.currentScript;

startTracker(script instanceof HTMLScriptElement ? script.src : undefined);
