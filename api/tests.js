import TaskTest from '../lib/TaskTest.js';
import { deferOrRunWrap } from '../lib/lifecycle.js'

export function testSuccessWhere(description, {
  fromPlugins,
  toPlugins,
  data
}) {
  return deferOrRunWrap(function(context) {
    console.log('testSuccessWhere:', description);
    return new TaskTest({
      description,
      shouldRun: true,
      fromPlugins,
      toPlugins,
      data
    })
  }, { type: 'test' });
};

export function testStopWhere(description, {
  fromPlugins,
  toPlugins,
  data
}) {
  return deferOrRunWrap(function(context) {
    console.log('testStopWhere:', description);
    return new TaskTest({
      description,
      shouldStop: true,
      shouldRun: false,
      fromPlugins,
      toPlugins,
      data
    })
  }, { type: 'test' });
};

export function testErrorWhere(description, {
  fromPlugins,
  toPlugins,
  data
}) {
  return deferOrRunWrap(function(context) {
    console.log('testErrorWhere:', description);
    return new TaskTest({
      description,
      shouldError: true,
      fromPlugins,
      toPlugins,
      data
    })
  }, { type: 'test' });
};
