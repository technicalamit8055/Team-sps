/**
 * Rewrites the `:where(...)` selectors Tailwind's Preflight emits into plain
 * equivalents. Chrome < 88 (Android 5/6 devices such as the 2016 Galaxy Tab A)
 * treats an unknown pseudo-class as a parse error and drops the ENTIRE rule —
 * for `[hidden]:where(:not([hidden=until-found]))` that means `hidden`
 * elements render visible, which looks like a broken layout.
 *
 * `:where()` only differs from the plain form in specificity (it contributes
 * 0). Preflight rules are meant to be trivially overridable, and they are
 * emitted in the base layer ahead of all utilities, so expanding them to the
 * plain selector is safe here.
 */
const REPLACEMENTS = [
  // abbr:where([title]) -> abbr[title]
  [/:where\((\[[^\])]*\])\)/g, "$1"],
  // [hidden]:where(:not([hidden=until-found])) -> [hidden]:not([hidden=until-found])
  [/:where\((:not\([^()]*\))\)/g, "$1"],
];

export default function postcssStripWhere() {
  return {
    postcssPlugin: "postcss-strip-where",
    OnceExit(root) {
      root.walkRules((rule) => {
        if (!rule.selector.includes(":where(")) return;
        let next = rule.selector;
        for (const [pattern, to] of REPLACEMENTS) next = next.replace(pattern, to);
        if (next !== rule.selector) rule.selector = next;
      });
    },
  };
}
