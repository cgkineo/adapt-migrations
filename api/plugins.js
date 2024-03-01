import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function removePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('removePlugin', description, async () => {

      if (!description || !config) throw new Error('removePlugin - incorrectly configured')

      context.fromPlugins = context.fromPlugins.filter(plugin => plugin.name !== config.name)

      return true
    })
  }, { description, type: 'action' })
};

export function addPlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('addPlugin', description, async () => {

      if (!description || !config) throw new Error('addPlugin - incorrectly configured')

      const newPlugin = context.toPlugins.filter(plugin => (plugin.name === config.name || plugin.displayName?.toUpperCase() === config.name?.toUpperCase() ))
      if (newPlugin.length === 0) throw new Error(`addPlugin - ${config.name} not found`)
      context.fromPlugins.push(newPlugin[0])
    })
  }, { description, type: 'action' })
};

export function updatePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('updatePlugin', description, async () => {

      if (!description || !config) throw new Error('updatePlugin - incorrectly configured')

      context.fromPlugins.forEach(plugin => {
        if (plugin.name !== config.name) return
        plugin.version = config.version
        if (!config.framework) return
        plugin.framework = config.framework
      });

      return true
    })
  }, { description, type: 'action' })
};

