import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function mutateData(description, callback) {
  return deferOrRunWrap(function(context) {
    return successStopOrErrorWrap('mutateData', description, async () => {
      return callback(context.data);
    });
  }, { description, type: 'action' });
};

export function checkData(description, callback) {
  return deferOrRunWrap(function(context) {
    return successStopOrErrorWrap('checkData', description, async () => {
      context.journal.freeze();
      const result = await callback(context.data);
      context.journal.unfreeze();
      return result;
    });
  }, { description, type: 'action' });
};
