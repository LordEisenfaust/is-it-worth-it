import { de } from "./de";

/** Shape every language catalog must have; derived from the German one. */
export type Texts = typeof de;

/** The active texts. Only German exists so far; a language switch would choose the catalog here. */
export const t: Texts = de;
