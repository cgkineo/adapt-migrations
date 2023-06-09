import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'

export function throwError(description) {
  let error = description;
  if (!(description instanceof Error)) {
    error = new Error(description);
  } else {
    description = description.message
  }
  return deferOrRunWrap(function(context) {
    return successStopOrErrorWrap('throwError', description, async () => {
      throw error;
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
