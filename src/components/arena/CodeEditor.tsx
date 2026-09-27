"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { useMemo } from "react";
import { useIsDark } from "@/components/shell/useIsDark";

const surface = EditorView.theme({
  "&": { backgroundColor: "var(--code-bg) !important" },
  ".cm-gutters": { backgroundColor: "var(--code-bg) !important", borderRight: "1px solid var(--line)" },
});

export default function CodeEditor({
  value,
  onChange,
  onRun,
  onSubmit,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
}) {
  const dark = useIsDark();
  const extensions = useMemo(
    () => [
      javascript({ jsx: true, typescript: false }),
      surface,
      EditorView.lineWrapping,
      Prec.highest(
        keymap.of([
          { key: "Mod-Enter", run: () => (onRun?.(), true) },
          { key: "Mod-Shift-Enter", run: () => (onSubmit?.(), true) },
        ]),
      ),
    ],
    [onRun, onSubmit],
  );
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      theme={dark ? vscodeDark : vscodeLight}
      extensions={extensions}
      height="100%"
      style={{ height: "100%" }}
      basicSetup={{ tabSize: 2, foldGutter: false, highlightActiveLine: !readOnly }}
    />
  );
}
