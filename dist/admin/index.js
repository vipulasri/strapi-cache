"use strict";
const react = require("react");
const jsxRuntime = require("react/jsx-runtime");
const admin = require("@strapi/strapi/admin");
const reactIntl = require("react-intl");
const icons = require("@strapi/icons");
const designSystem = require("@strapi/design-system");
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
const PLUGIN_ID = "strapi-cache";
const Initializer = ({ setPlugin }) => {
  const ref = react.useRef(setPlugin);
  react.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const pluginPermissions = {
  purge: [{ action: "plugin::strapi-cache.purge-cache", subject: null }]
};
function PurgeButton({ onClick }) {
  const formatMessage = reactIntl.useIntl().formatMessage;
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick, children: formatMessage({
    id: "strapi-cache.cache.confirm",
    defaultMessage: "Yes, confirm"
  }) });
}
function PurgeModal({ buttonText, keyToUse, buttonWidth, contentTypeName }) {
  const { allowedActions } = admin.useRBAC(pluginPermissions);
  const formatMessage = reactIntl.useIntl().formatMessage;
  const { post, get } = admin.useFetchClient();
  const { toggleNotification } = admin.useNotification();
  const [cacheableRoutes, setCacheableRoutes] = react.useState();
  react.useEffect(() => {
    if (!allowedActions.canPurgeCache) {
      return;
    }
    const fetchCacheableRoutes = async () => {
      try {
        const { data } = await get("/strapi-cache/cacheable-routes");
        return data;
      } catch (error) {
        toggleNotification({
          type: "warning",
          message: formatMessage({
            id: "strapi-cache.cache.routes.fetch-error",
            defaultMessage: "Unable to fetch cacheable routes. Cache purge may not work correctly."
          })
        });
        return void 0;
      }
    };
    fetchCacheableRoutes().then((data) => {
      setCacheableRoutes(data);
    });
  }, [allowedActions.canPurgeCache]);
  const isCacheableRoute = () => {
    if (!keyToUse || !cacheableRoutes) {
      return false;
    }
    return cacheableRoutes.length === 0 || cacheableRoutes.some((route) => {
      return route.includes(keyToUse) || contentTypeName && route.includes(contentTypeName);
    });
  };
  const clearCache = () => {
    if (!keyToUse) {
      toggleNotification({
        type: "warning",
        message: formatMessage({
          id: "strapi-cache.cache.purge.no-content-type",
          defaultMessage: "No content type found"
        })
      });
      return;
    }
    post(`/strapi-cache/purge-cache/${keyToUse}`, void 0, {
      headers: {
        "Content-Type": "application/json"
      }
    }).then(() => {
      toggleNotification({
        type: "success",
        message: formatMessage(
          {
            id: "strapi-cache.cache.purge.success",
            defaultMessage: "Cache purged successfully"
          },
          {
            key: `"${keyToUse}"`
          }
        )
      });
    }).catch(() => {
      toggleNotification({
        type: "danger",
        message: formatMessage(
          {
            id: "strapi-cache.cache.purge.error",
            defaultMessage: "Error purging cache"
          },
          {
            key: `"${keyToUse}"`
          }
        )
      });
    });
  };
  if (!allowedActions.canPurgeCache || !isCacheableRoute()) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Root, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Trigger, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { width: buttonWidth, startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Archive, {}), variant: "danger", children: buttonText }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Content, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Title, { children: buttonText }) }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Body, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "omega", children: formatMessage(
        {
          id: "strapi-cache.cache.purge.confirmation",
          defaultMessage: "Are you sure you want to purge the cache?"
        },
        { key: `"${keyToUse}"` }
      ) }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Footer, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Close, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "tertiary", children: formatMessage({
          id: "strapi-cache.cache.cancel",
          defaultMessage: "No, cancel"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Close, { children: /* @__PURE__ */ jsxRuntime.jsx(PurgeButton, { onClick: clearCache }) })
      ] })
    ] })
  ] });
}
function PurgeCacheButton() {
  const { contentType } = admin.unstable_useContentManagerContext();
  const { formatMessage } = reactIntl.useIntl();
  const keyToUse = contentType?.info.pluralName;
  return /* @__PURE__ */ jsxRuntime.jsx(
    PurgeModal,
    {
      buttonText: formatMessage({
        id: "strapi-cache.cache.purge",
        defaultMessage: "Purge Cache"
      }),
      keyToUse
    }
  );
}
function PurgeEntityButton() {
  const { formatMessage } = reactIntl.useIntl();
  const { id, isSingleType, contentType } = admin.unstable_useContentManagerContext();
  const apiPath = isSingleType ? contentType?.info.singularName : id;
  if (!apiPath) {
    return null;
  }
  const keyToUse = encodeURIComponent(apiPath);
  const contentTypeName = isSingleType ? contentType?.info.singularName : contentType?.info.pluralName;
  return /* @__PURE__ */ jsxRuntime.jsx(
    PurgeModal,
    {
      buttonWidth: "100%",
      buttonText: formatMessage({
        id: "strapi-cache.cache.purge.entity",
        defaultMessage: "Purge Entity Cache"
      }),
      keyToUse,
      contentTypeName
    }
  );
}
const index = {
  register(app) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID
    });
    app.getPlugin("content-manager").injectComponent("listView", "actions", {
      name: PurgeCacheButton,
      Component: PurgeCacheButton
    });
    app.getPlugin("content-manager").injectComponent("editView", "right-links", {
      name: PurgeEntityButton,
      Component: PurgeEntityButton
    });
  },
  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/de.json": () => Promise.resolve().then(() => require("../_chunks/de-Bw-yMVQV.js")), "./translations/en.json": () => Promise.resolve().then(() => require("../_chunks/en-3qeM6Pow.js")) }), `./translations/${locale}.json`, 3);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  }
};
module.exports = index;
