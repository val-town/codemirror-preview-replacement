import { combineConfig, Facet } from "@codemirror/state";
import {
  Decoration,
  MatchDecorator,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

interface HighlightPreviewReplacement {
  from: string;
  to: string | null;
}

export const highlightPreviewReplacementFacet = Facet.define<
  HighlightPreviewReplacement,
  HighlightPreviewReplacement
>({
  combine(value) {
    return combineConfig(value, {
      from: "",
      to: "",
    });
  },
});

export const highlightPreviewReplacement = ViewPlugin.fromClass(
  class {
    placeholders: DecorationSet;
    constructor(view: EditorView) {
      const config = view.state.facet(highlightPreviewReplacementFacet);
      if (!config.from) {
        this.placeholders = Decoration.none;
        return;
      }
      this.placeholders = getPlaceholderMatcher(
        config.from,
        config.to,
      ).createDeco(view);
    }
    update(update: ViewUpdate) {
      const config = update.state.facet(highlightPreviewReplacementFacet);
      if (!config.from) {
        this.placeholders = Decoration.none;
        return;
      }
      this.placeholders = getPlaceholderMatcher(
        config.from,
        config.to,
      ).updateDeco(update, this.placeholders);
    }
  },
  {
    decorations: (instance) => instance.placeholders,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  },
);

class PlaceholderWidget extends WidgetType {
  constructor(
    public name: string,
    public to: string | null,
  ) {
    super();
  }
  eq(other: PlaceholderWidget) {
    return this.name === other.name && this.to === other.to;
  }
  toDOM() {
    const elt = document.createElement("span");

    if (this.to) {
      const fromElt = document.createElement("span");
      fromElt.className = "cm-preview-replace-from";
      fromElt.style.cssText = `
      text-decoration: line-through;
      color: #7f1d1d;
      background: #fca5a5;`;
      fromElt.textContent = this.name;

      const toElt = document.createElement("span");
      toElt.className = "cm-preview-replace-to";
      toElt.style.cssText = `
      color: green;
      color: #14532d;
      background: #ecfccb;`;
      toElt.textContent = this.to;

      elt.appendChild(fromElt);
      elt.appendChild(toElt);
    } else {
      const fromElt = document.createElement("span");
      fromElt.className = "cm-preview-replace-match";
      fromElt.style.cssText = `
      background: yellow;`;
      fromElt.textContent = this.name;

      elt.appendChild(fromElt);
    }

    return elt;
  }
  ignoreEvent() {
    return false;
  }
}

/**
 * https://github.com/toss/es-toolkit/blob/main/src/string/escapeRegExp.ts
 */
function escapeRegExp(str: string): string {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function getPlaceholderMatcher(fromstr: string | RegExp, to: string | null) {
  const regexp =
    typeof fromstr === "string"
      ? new RegExp(`(${escapeRegExp(fromstr)})`, "g")
      : fromstr;
  return new MatchDecorator({
    regexp,
    decoration: (match) => {
      return Decoration.replace({
        widget: new PlaceholderWidget(String(match[1]), to),
      });
    },
  });
}
