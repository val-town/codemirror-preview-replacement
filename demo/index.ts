import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import {  highlightPreviewReplacement, highlightPreviewReplacementFacet } from "../src/index.js";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

(async () => {
  let editor = new EditorView({
    doc: `/** Comment */
function increment(num: number) {
  /** indented
  return num + 1;
}
/** Continue`,
    extensions: [
      basicSetup,
      javascript({
        typescript: true,
        jsx: true,
      }),
      highlightPreviewReplacementFacet.of({
        from: 'increment',
        to: null // 'decrement'
      }),
      highlightPreviewReplacement
    ],
    parent: document.querySelector("#editor")!,
  });
})();
