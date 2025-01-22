import Task from '../lib/Task.js'

export async function load ({ cwd = process.cwd(), scripts = [], cachePath, logger } = {}) {
  return Task.load({
    cwd,
    scripts,
    cachePath,
    logger
  })
}

export async function capture ({ content, fromPlugins, logger }) {
  return {
    content,
    fromPlugins,
    logger
  }
};

export async function migrate ({ cwd = process.cwd(), journal, logger }) {
  return Task.runApplicable({
    cwd,
    journal,
    logger
  })
}

export async function test ({ cwd = process.cwd(), logger } = {}) {
  return Task.runTests({
    cwd,
    logger
  })
}
