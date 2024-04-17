import TaskTest from '../lib/TaskTest.js'
import { deferOrRunWrap } from '../lib/lifecycle.js'

export function testSuccessWhere (description, {
  fromPlugins,
  toPlugins,
  content
}) {
  return deferOrRunWrap(() => {
    console.log('testSuccessWhere:', description)
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
    console.log('testStopWhere:', description)
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
    console.log('testErrorWhere:', description)
    return new TaskTest({
      description,
      shouldError: true,
      fromPlugins,
      toPlugins,
      content
    })
  }, { type: 'test' })
};
