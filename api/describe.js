import Task from '../lib/Task.js'
import Logger from './../lib/Logger.js'

export function describe (description, load) {
  const logger = Logger.getInstance();
  logger.info(`Describe -- ${description} -- Registered`)
  if (Task.current) {
    logger.error(`Describe -- Cannot nest describe statements -- ${description}`)
  }
  // eslint-disable-next-line no-new
  new Task({ description, load })
};
