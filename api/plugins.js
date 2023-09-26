import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function removePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('removePlugin', description, async () => {
      context.journal.freeze()

      context.journal.unfreeze()
      return result
    })
  }, { description, type: 'action' })
};

export function addPlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('addPlugin', description, async () => {
      context.journal.freeze()

      context.journal.unfreeze()
      return result
    })
  }, { description, type: 'action' })
};

export function updatePlugin (description, config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('updatePlugin', description, async () => {
      context.journal.freeze()


      context.journal.unfreeze()
      return result
    })
  }, { description, type: 'action' })
};
