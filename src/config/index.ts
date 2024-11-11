import type { App } from "vue";
import axios from "axios";
import Cookies from "js-cookie";

let config: object = {};
const { VITE_PUBLIC_PATH } = import.meta.env;
const defaultConfigUrl = `${VITE_PUBLIC_PATH}platform-config.json`;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): PlatformConfigs => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (
  app: App,
  url = null
): Promise<undefined> => {
  app.config.globalProperties.$config = getConfig();
  return axios({
    method: "get",
    url: url
      ? url
      : Cookies.get("X-Token")
        ? "/api/system/configs/WEB_SITE_CONFIG"
        : defaultConfigUrl
  })
    .then(async ({ data: config }) => {
      config = config?.config ?? config;
      if (!config.Locale) {
        return await getPlatformConfig(app, defaultConfigUrl);
      }
      let $config = app.config.globalProperties.$config;
      // 自动注入项目配置
      if (app && $config && typeof config === "object") {
        $config = Object.assign($config, config);
        app.config.globalProperties.$config = $config;
        // 设置全局配置
        setConfig($config);
      }
      return $config;
    })
    .catch(async () => {
      if (url === null) {
        return await getPlatformConfig(app, defaultConfigUrl);
      } else {
        throw "请在public文件夹下添加platform-config.json配置文件";
      }
    });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
