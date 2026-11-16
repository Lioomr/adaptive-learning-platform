// Registers a tiny resolver so Node's built-in test runner can load the app's
// TypeScript modules (Node >= 22.18 strips types natively) with the "@/" alias.
import { register } from "node:module";
register("./alias-hooks.mjs", import.meta.url);
