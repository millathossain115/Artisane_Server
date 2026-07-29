export const swaggerUiOptions = {
  customSiteTitle: 'Artisane API Docs',
  customCss: `
    :root {
      --artisane-paper: #101414;
      --artisane-surface: #171d1d;
      --artisane-card: #121918;
      --artisane-ink: #f2f5f4;
      --artisane-muted: #aeb9b7;
      --artisane-line: #2e3a39;
      --artisane-clay: #d96b4f;
      --artisane-gold: #d99a2b;
      --artisane-teal: #22c59d;
      --artisane-plum: #b979b3;
      --artisane-blue: #42a5d5;
      --artisane-green: #1fc77e;
      color-scheme: dark;
    }

    html,
    body {
      background: var(--artisane-paper);
      color: var(--artisane-ink);
    }

    body {
      min-width: 0;
    }

    .swagger-ui {
      color: var(--artisane-ink);
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .wrapper {
      max-width: 1180px;
      padding: 0 24px;
    }

    .swagger-ui .information-container.wrapper {
      max-width: none;
      margin: 0 0 24px;
      padding: 34px max(24px, calc((100vw - 1180px) / 2)) 30px;
      background: var(--artisane-surface);
      border-bottom: 1px solid var(--artisane-line);
      box-shadow: inset 0 -1px 0 rgba(35, 31, 26, 0.04);
    }

    .swagger-ui .info {
      margin: 0;
    }

    .swagger-ui .info .title {
      color: var(--artisane-ink);
      font-size: clamp(34px, 5vw, 64px);
      line-height: 0.95;
      font-weight: 800;
      letter-spacing: 0;
      margin: 0 0 16px;
    }

    .swagger-ui .info .base-url {
      display: none;
    }

    .swagger-ui .info .title small,
    .swagger-ui .info .title small.version-stamp {
      top: -8px;
      margin-left: 12px;
      border-radius: 999px;
      background: #314142;
      color: var(--artisane-ink);
      font-size: 12px;
      font-weight: 800;
      padding: 6px 10px;
      letter-spacing: 0;
      vertical-align: middle;
    }

    .swagger-ui .info .description,
    .swagger-ui .info .description p {
      max-width: 760px;
      color: var(--artisane-muted);
      font-size: 16px;
      line-height: 1.7;
    }

    .swagger-ui .scheme-container {
      max-width: 1180px;
      margin: 0 auto 20px;
      padding: 12px 14px;
      background: var(--artisane-surface);
      border: 1px solid var(--artisane-line);
      border-radius: 8px;
      box-shadow: none;
    }

    .swagger-ui .scheme-container .schemes {
      align-items: center;
      gap: 12px;
    }

    .swagger-ui .btn,
    .swagger-ui .btn.authorize,
    .swagger-ui .try-out__btn,
    .swagger-ui .execute-wrapper .btn.execute {
      border-radius: 8px;
      border: 1px solid rgba(35, 31, 26, 0.16);
      box-shadow: none;
      font-weight: 800;
      letter-spacing: 0;
      transition:
        background-color 160ms ease,
        border-color 160ms ease,
        transform 160ms ease;
    }

    .swagger-ui .btn:hover,
    .swagger-ui .btn.authorize:hover,
    .swagger-ui .try-out__btn:hover {
      transform: translateY(-1px);
      border-color: rgba(35, 31, 26, 0.34);
    }

    .swagger-ui .btn.authorize {
      border-color: var(--artisane-teal);
      color: var(--artisane-teal);
      background: rgba(34, 197, 157, 0.1);
    }

    .swagger-ui .execute-wrapper .btn.execute {
      background: var(--artisane-ink);
      border-color: var(--artisane-ink);
      color: var(--artisane-paper);
    }

    .swagger-ui select,
    .swagger-ui input[type="text"],
    .swagger-ui textarea {
      border-radius: 8px;
      border-color: var(--artisane-line);
      background: var(--artisane-card);
      color: var(--artisane-ink);
      box-shadow: none;
    }

    .swagger-ui .opblock-tag-section {
      --section-accent: var(--artisane-clay);
      margin: 0 0 16px;
      border: 1px solid var(--artisane-line);
      border-left: 5px solid var(--section-accent);
      border-radius: 8px;
      background: var(--artisane-surface);
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
    }

    .swagger-ui .opblock-tag-section:nth-of-type(2n) {
      --section-accent: var(--artisane-teal);
    }

    .swagger-ui .opblock-tag-section:nth-of-type(3n) {
      --section-accent: var(--artisane-gold);
    }

    .swagger-ui .opblock-tag-section:nth-of-type(4n) {
      --section-accent: var(--artisane-plum);
    }

    .swagger-ui .opblock-tag-section:nth-of-type(5n) {
      --section-accent: var(--artisane-blue);
    }

    .swagger-ui .opblock-tag {
      margin: 0;
      padding: 14px 18px;
      border-bottom: 1px solid var(--artisane-line);
      background: var(--artisane-surface);
      color: var(--artisane-ink);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .swagger-ui .opblock-tag:hover {
      background: var(--artisane-surface);
    }

    .swagger-ui .opblock-tag small {
      display: block;
      max-width: 720px;
      margin-top: 8px;
      color: var(--artisane-muted);
      font-size: 13px;
      line-height: 1.55;
      font-weight: 600;
    }

    .swagger-ui .opblock {
      margin: 8px 12px;
      border: 1px solid rgba(35, 31, 26, 0.1);
      border-radius: 8px;
      background: var(--artisane-card);
      box-shadow: none;
      overflow: hidden;
    }

    .swagger-ui .opblock:hover {
      border-color: rgba(35, 31, 26, 0.22);
    }

    .swagger-ui .opblock .opblock-summary {
      min-height: 44px;
      padding: 6px 10px;
    }

    .swagger-ui .opblock .opblock-summary-method {
      min-width: 66px;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 900;
      text-shadow: none;
      letter-spacing: 0;
      box-shadow: none;
    }

    .swagger-ui .opblock.opblock-get {
      border-color: rgba(60, 99, 130, 0.25);
      background: var(--artisane-card);
    }

    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: var(--artisane-blue);
    }

    .swagger-ui .opblock.opblock-post {
      border-color: rgba(79, 125, 67, 0.25);
      background: var(--artisane-card);
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: var(--artisane-green);
    }

    .swagger-ui .opblock.opblock-patch {
      border-color: rgba(198, 138, 44, 0.28);
      background: var(--artisane-card);
    }

    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: var(--artisane-gold);
    }

    .swagger-ui .opblock.opblock-delete {
      border-color: rgba(184, 95, 69, 0.28);
      background: var(--artisane-card);
    }

    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: var(--artisane-clay);
    }

    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path__deprecated {
      color: var(--artisane-ink);
      font-family:
        "SFMono-Regular", Consolas, "Liberation Mono", ui-monospace, monospace;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0;
      word-break: break-word;
    }

    .swagger-ui .opblock .opblock-summary-description {
      color: var(--artisane-muted);
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
    }

    .swagger-ui .opblock-body,
    .swagger-ui .responses-wrapper,
    .swagger-ui .parameters-container {
      background: var(--artisane-card);
    }

    .swagger-ui .opblock-section-header {
      background: #101616;
      border-top: 1px solid var(--artisane-line);
      border-bottom: 1px solid var(--artisane-line);
      box-shadow: none;
    }

    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th {
      color: var(--artisane-muted);
      border-bottom: 1px solid var(--artisane-line);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .swagger-ui .parameter__name,
    .swagger-ui .response-col_status {
      color: var(--artisane-ink);
      font-weight: 800;
    }

    .swagger-ui .model-box,
    .swagger-ui .model,
    .swagger-ui section.models {
      border-color: var(--artisane-line);
      border-radius: 8px;
      background: var(--artisane-surface);
    }

    .swagger-ui .model-title,
    .swagger-ui section.models h4 {
      color: var(--artisane-ink);
    }

    .swagger-ui .highlight-code,
    .swagger-ui .microlight {
      border-radius: 8px;
      background: #1f2524 !important;
    }

    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5,
    .swagger-ui .opblock-section-header h4 {
      color: var(--artisane-ink);
      font-weight: 800;
      letter-spacing: 0;
    }

    .swagger-ui .auth-container {
      background: var(--artisane-surface);
    }

    .swagger-ui .dialog-ux .modal-ux {
      border-radius: 8px;
      border-color: var(--artisane-line);
      background: var(--artisane-surface);
    }

    .swagger-ui .dialog-ux .modal-ux-header {
      border-bottom-color: var(--artisane-line);
    }

    .swagger-ui .renderedMarkdown p,
    .swagger-ui .renderedMarkdown li {
      color: var(--artisane-muted);
      line-height: 1.65;
    }

    .swagger-ui svg,
    .swagger-ui svg path,
    .swagger-ui .arrow,
    .swagger-ui .opblock-control-arrow,
    .swagger-ui .authorization__btn {
      color: var(--artisane-muted) !important;
      fill: var(--artisane-muted) !important;
    }

    .swagger-ui .btn.authorize svg,
    .swagger-ui .btn.authorize svg path {
      color: var(--artisane-teal) !important;
      fill: var(--artisane-teal) !important;
    }

    @media (max-width: 760px) {
      .swagger-ui .wrapper {
        padding: 0 12px;
      }

      .swagger-ui .information-container.wrapper {
        padding: 28px 16px 24px;
      }

      .swagger-ui .info .title {
        font-size: 36px;
      }

      .swagger-ui .scheme-container {
        margin: 0 12px 18px;
      }

      .swagger-ui .opblock-tag {
        padding: 14px 16px;
        font-size: 20px;
      }

      .swagger-ui .opblock {
        margin: 8px 10px;
      }

      .swagger-ui .opblock .opblock-summary {
        align-items: flex-start;
        gap: 6px;
        padding: 10px;
      }

      .swagger-ui .opblock .opblock-summary-method {
        min-width: 62px;
      }

      .swagger-ui .opblock .opblock-summary-path {
        max-width: 100%;
        white-space: normal;
      }
    }
  `,
};

export const swaggerUiDistUrl = 'https://unpkg.com/swagger-ui-dist@5.32.11';

export const renderSwaggerInitScript = () => `
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/openapi.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: 'StandaloneLayout',
    validatorUrl: null
  });
};
`;

export const renderSwaggerHtml = () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${swaggerUiOptions.customSiteTitle}</title>
    <link
      rel="stylesheet"
      href="${swaggerUiDistUrl}/swagger-ui.css"
    />
    <style>
      body {
        margin: 0;
        background: #101414;
      }

      ${swaggerUiOptions.customCss}
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${swaggerUiDistUrl}/swagger-ui-bundle.js"></script>
    <script src="${swaggerUiDistUrl}/swagger-ui-standalone-preset.js"></script>
    <script>
      ${renderSwaggerInitScript()}
    </script>
  </body>
</html>`;
