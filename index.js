import {
  load,
  capture,
  migrate,
  test
} from './api/commands.js'
import {
  describe
} from './api/describe.js'
import {
  whereContent,
  whereFromPlugin,
  whereToPlugin
} from './api/where.js'
import {
  checkContent,
  mutateContent
} from './api/data.js'
import {
  ifErroredAsk,
  throwError
} from './api/errors.js'
import {
  testErrorWhere,
  testStopWhere,
  testSuccessWhere
} from './api/tests.js'
import {
  updatePlugin,
  removePlugin,
  addPlugin
} from './api/plugins.js'
import Journal from './lib/Journal.js'
import CacheManager from './lib/CacheManager.js'

export {
  // commands
  load,
  capture,
  migrate,
  test,
  // migration script api
  describe,
  whereContent,
  whereFromPlugin,
  whereToPlugin,
  checkContent,
  mutateContent,
  ifErroredAsk,
  throwError,
  testErrorWhere,
  testStopWhere,
  testSuccessWhere,
  updatePlugin,
  removePlugin,
  addPlugin,
  // environment objects
  Journal,
  CacheManager
}
