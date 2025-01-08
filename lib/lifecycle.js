import Task from './Task.js'
import Logger from './Logger.js'

const logger = Logger.getInstance();

function getCalleeName (step = 0) {
  const e = new Error('dummy')
  const name = e.stack
    .split('\n')[step]
    // " at functionName ( ..." => "functionName"
    .replace(/^\s+at\s+(.+?)\s.+/g, '$1')
  return name
}

export function deferOrRunWrap (callback, options) {
  const unwrapped = callback
  if (!Task.isRunning) {
    callback = function deferred (context) { return unwrapped(context) }
    if (!Task.current) {
      logger.error(`Cannot run ${getCalleeName(3)} out of task context`)
      throw new Error()
    }
    Task.current[options.type === 'test' ? 'tests' : 'steps'].push(callback)
  }
  if (options) Object.assign(callback, options)
  return Task.isRunning
    ? callback(Task.current.context)
    : callback
};

export async function successStopOrErrorWrap (taskName, description, callback) {
  let successOrStop
  let error
  try {
    successOrStop = await callback()
  } catch (err) {
    error = err
    logger.error(`${taskName} -- ${description}`, `${error}`)
    error.stack = Object.entries(Task.mapCacheToSource).reduce((stack, [cache, source]) => {
      return stack.replaceAll(cache, source)
    }, error.stack)
  }
  if (error) {
    logger.error(`${taskName} -- ${description} -- (errored - ${error.message})`)
    logger.error(error)
    throw error
  }
  logger.info(`${taskName} -- ${description} -- (${successOrStop ? 'success' : 'stopped'})`)
  return successOrStop
}
