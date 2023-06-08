import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function throwError(description) {
  return deferOrRunWrap(function(context) {
    return successStopOrErrorWrap('throwError', description, async () => {
      throw new Error(description);
    });
  }, { type: 'action' });
}

export function ifErroredAsk(config) {
  return deferOrRunWrap(function(context) {
    return successStopOrErrorWrap('isErroredAsk', config.question, async () => {
      if (!context.hasErrored) return true;
      // Ask a question
    });
  }, { type: 'error' });
};
