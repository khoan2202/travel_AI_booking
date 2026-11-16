window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: "/api-docs.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
    supportedSubmitMethods: ["get"],
  });
};
