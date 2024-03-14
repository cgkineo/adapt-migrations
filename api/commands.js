import Task from '../lib/Task.js'

export async function load ({ cwd = process.cwd(), scripts = [], cachePath } = {}) {
  return Task.load({
    cwd,
    scripts,
    cachePath
  })
}

export async function capture ({ content, fromPlugins }) {
  return {
    content,
    fromPlugins
  }
};

export async function migrate ({ cwd = process.cwd(), journal }) {
  return Task.runApplicable({
    cwd,
    journal
  })
}

export async function test ({ cwd = process.cwd() } = {}) {
  return Task.runTests({
    cwd,
    journal
  })
}
