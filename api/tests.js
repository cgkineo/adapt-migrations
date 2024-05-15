import TaskTest from '../lib/TaskTest.js'
import { deferOrRunWrap } from '../lib/lifecycle.js'
import Logger from '../lib/Logger.js'

const logger = Logger.getInstance();

export function testSuccessWhere (description, {
  fromPlugins,
  toPlugins,
  content
}) {
  return deferOrRunWrap(() => {
    logger.debug(`Tests -- testSuccessWhere ${description}`)
    return new TaskTest({
      description,
      shouldRun: true,
      fromPlugins,
      toPlugins,
      content
    })
  }, { type: 'test' })
};

export function testStopWhere (description, {
  fromPlugins,
  toPlugins,
  content
}) {
  return deferOrRunWrap(() => {
    logger.debug(`Tests -- testStopWhere ${description}`)
    return new TaskTest({
      description,
      shouldStop: true,
      shouldRun: false,
      fromPlugins,
      toPlugins,
      content
    })
  }, { type: 'test' })
};

export function testErrorWhere (description, {
  fromPlugins,
  toPlugins,
  content
}) {
  return deferOrRunWrap(() => {
    logger.debug(`Tests -- testErrorWhere ${description}`)
    return new TaskTest({
      description,
      shouldError: true,
      fromPlugins,
      toPlugins,
      content
    })
  }, { type: 'test' })
};
