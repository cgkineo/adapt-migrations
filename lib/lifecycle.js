import Task from './Task.js';

function getCalleeName(step = 0) {
  const e = new Error('dummy');
  const name = e.stack
    .split('\n')[step]
    // " at functionName ( ..." => "functionName"
    .replace(/^\s+at\s+(.+?)\s.+/g, '$1' );
  return name;
}

export function deferOrRunWrap(callback, options) {
  let unwrapped = callback;
  if (!Task.isRunning) {
    callback = function deferred(context) { return unwrapped(context); };
    if (!Task.current) {
      throw new Error(`Cannot run ${getCalleeName(3)} out of task context`)
    }
    Task.current[options.type === 'test' ? 'tests' : 'steps'].push(callback);
  }
  if (options) Object.assign(callback, options);
  return Task.isRunning
    ? callback(Task.current.context)
    : callback;
};

export async function successStopOrErrorWrap(taskName, description, callback) {
  let successOrStop
  let error
  try {
    successOrStop = await callback();
  } catch (err) {
    error = err
  }
  if (error) {
    console.log(taskName, description, `(errored - ${error.message})`);
    throw error
  }
  console.log(taskName, description, `(${successOrStop ? 'success' : 'stopped'})`);
  return successOrStop;
}
