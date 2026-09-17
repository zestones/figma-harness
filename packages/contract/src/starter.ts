/* The starter vocabulary: the few calls a newly created app makes before it
 * has pages of its own. Every design system exports an object of this shape as
 * `starter` from its main entry, so the app template works on any of them. */

/** A control the prototype can select. */
export interface StarterAction {
  readonly label: string;
  /** The layer name, which the app's flows select. */
  readonly name: string;
}

/** A row of a list. */
export interface StarterItem {
  readonly detail: string;
  readonly label: string;
  /** The row opens something, so it is announced as a link. */
  readonly link?: boolean;
  /** The layer name, which the app's flows select. */
  readonly name: string;
  /** A short state, always shown as a word. */
  readonly status?: { readonly label: string; readonly tone: 'neutral' | 'positive' | 'warning' | 'critical' };
}

export interface StarterScreenOptions {
  readonly h: number;
  readonly items?: readonly StarterItem[];
  /** The frame name, which is also the screen's title in the prototype. */
  readonly name: string;
  readonly primary?: StarterAction;
  /** The product name, shown in the header every screen shares. */
  readonly product: string;
  readonly secondary?: StarterAction;
  readonly text: string;
  readonly title: string;
  readonly w: number;
}

export interface StarterVocabulary {
  /** A complete screen: a title, a paragraph, an optional list and up to two
   *  actions, laid out with the design system's own components. Its height
   *  grows to fit the content, never below `h`. */
  screen(options: StarterScreenOptions): Promise<FrameNode>;
  /** The design system's motion for something that changes in place. */
  readonly stateMotion: string;
}
