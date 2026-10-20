import js from "@eslint/js";
import tseslint from "typescript-eslint";

const allowedDirectives = /^\s*(eslint-|@ts-expect-error)/;

const noComments = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      unexpected:
        "Comments are not allowed. Rename things until the code explains itself, or record the reason in docs/decisions.",
    },
  },
  create(context) {
    return {
      Program() {
        context.sourceCode
          .getAllComments()
          .filter((comment) => !allowedDirectives.test(comment.value))
          .forEach((comment) => context.report({ loc: comment.loc, messageId: "unexpected" }));
      },
    };
  },
};

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.wrangler/**",
      "**/worker-configuration.d.ts",
      "**/migrations/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: { devlytics: { rules: { "no-comments": noComments } } },
    rules: {
      "devlytics/no-comments": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
