import semver from 'semver';
import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function whereData(description, callback) {
  return deferOrRunWrap(async function(context) {
    return successStopOrErrorWrap('whereData', description, async () => {
      return await callback(context.data);
    });
  }, { description, type: 'where' });
};

export function whereFromPlugin(description, callbackOrConfig) {
  return deferOrRunWrap(function({ fromPlugins }) {
    return successStopOrErrorWrap('whereFromPlugin', description, async () => {
      const isCallback = (typeof callbackOrConfig === 'function');
      if (isCallback) {
        const callback = callbackOrConfig;
        return callback(fromPlugins);
      }
      const config = callbackOrConfig;
      return fromPlugins.some(plugin => {
        if (config.name && plugin.name !== config.name) return false;
        if (config.version && !semver.satisfies(plugin.version, config.version)) return false;
        return true;
      });
    });
  }, { description, type: 'where' });
};

export function whereToPlugin(description, callbackOrConfig) {
  return deferOrRunWrap(function({ toPlugins }) {
    return successStopOrErrorWrap('whereToPlugin', description, async () => {
      const isCallback = (typeof callbackOrConfig === 'function');
      if (isCallback) {
        const callback = callbackOrConfig;
        return callback(toPlugins);
      }
      const config = callbackOrConfig;
      return toPlugins.some(plugin => {
        if (config.name && plugin.name !== config.name) return false;
        if (config.version && !semver.satisfies(plugin.version, config.version)) return false;
        return true;
      })
    });
  }, { description, type: 'where' });
};
