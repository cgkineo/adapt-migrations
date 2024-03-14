import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function mutateContent (description, callback) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('mutateContent', description, async () => {
      return callback(context.content)
    })
  }, { description, type: 'action' })
};

export function checkContent (description, callback) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('checkContent', description, async () => {
      context.journal.freeze()
      const result = await callback(context.content)
      context.journal.unfreeze()
      return result
    })
  }, { description, type: 'action' })
};
