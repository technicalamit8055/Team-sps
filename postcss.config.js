import stripWhere from "./scripts/postcss-strip-where.mjs";

export default {
  plugins: [
    (await import("tailwindcss")).default,
    // Rewrites modern selectors/features (notably :is() from Tailwind's dark
    // variants) into forms old Chrome can parse. Android 5/6 Chrome drops an
    // entire rule when it hits an unknown selector.
    (await import("postcss-preset-env")).default({
      stage: 3,
      browsers: ["chrome >= 61", "android >= 5", "ios >= 11", "safari >= 11"],
      features: {
        "is-pseudo-class": true,
        "any-link-pseudo-class": true,
        "focus-visible-pseudo-class": true,
        "focus-within-pseudo-class": true,
      },
      enableClientSidePolyfills: false,
    }),
    // preset-env leaves :where() alone; Preflight still emits a few.
    stripWhere(),
    (await import("autoprefixer")).default,
  ],
};
