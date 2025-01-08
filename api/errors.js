import { deferOrRunWrap, successStopOrErrorWrap } from '../lib/lifecycle.js'
import Logger from './../lib/Logger.js'

const logger = Logger.getInstance();

export function throwError (description) {
  let error = description
  if (!(description instanceof Error)) {
    logger.error(`Errors -- ${description}`)
    error = new Error(description)
  } else {
    description = description.message
  }
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('throwError', description, async () => {
      throw error
    })
  }, { type: 'action' })
}

export function ifErroredAsk (config) {
  return deferOrRunWrap(function (context) {
    return successStopOrErrorWrap('isErroredAsk', config.question, async () => {
      if (!context.hasErrored) return true
      // Ask a question
    })
  }, { type: 'error' })
};
