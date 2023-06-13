import Task from '../lib/Task.js'

export async function load ({ cwd = process.cwd(), scripts = [], cachePath } = {}) {
  return Task.load({
    cwd,
    scripts,
    cachePath
  })
}

export async function capture ({ data, fromPlugins }) {
  return {
    data,
    fromPlugins
  }
};

export async function migrate ({ cwd = process.cwd(), fromPlugins, toPlugins, journal }) {
  return Task.runApplicable({
    cwd,
    fromPlugins,
    toPlugins,
    journal
  })
}

export async function test ({ cwd = process.cwd() } = {}) {
  return Task.runTests({
    cwd
  })
}
