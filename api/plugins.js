import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function removePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('removePlugin', description, async () => {

      if(!description || !config) throw new Error('removePlugin - incorrectly configured')

      context.fromPlugins = context.fromPlugins.filter((plugin) => {
        if(plugin.name !== config.name) return plugin
      });

      context.setFromPlugins();

      return true
    })
  }, { description, type: 'action' })
};

export function addPlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('addPlugin', description, async () => {

      if(!description || !config) throw new Error('addPlugin - incorrectly configured')

      const newPlugin = context.toPlugins.filter((plugin) => (plugin.name === config.name || plugin.displayName?.toUpperCase() === config.name?.toUpperCase() ));
      if(newPlugin.length === 0) throw new Error(`addPlugin - ${config.name} not found`)
      context.fromPlugins.push(newPlugin[0]);

      context.setFromPlugins();

      return true
    })
  }, { description, type: 'action' })
};

export function updatePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('updatePlugin', description, async () => {

      if(!description || !config) throw new Error('Update Plugin call incorrectly configured')

      context.fromPlugins.forEach((plugin) => {
        if(plugin.name !== config.name) return plugin

        plugin.version = config.version

        if (config.framework) {
          plugin.framework = config.framework
        }
        return plugin
      });

      context.setFromPlugins();

      return true
    })
  }, { description, type: 'action' })
};

