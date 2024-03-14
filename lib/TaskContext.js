export default class TaskContext {
  constructor ({
    hasErrored = false,
    hasStopped = false,
    hasRun = false,
    fromPlugins = null,
    originalFromPlugins = null,
    toPlugins = null,
    content = null,
    journal = null,
    errors = []
  } = {}) {
    this.hasErrored = hasErrored
    this.hasStopped = hasStopped
    this.hasRun = hasRun
    this.fromPlugins = fromPlugins
    this.originalFromPlugins = originalFromPlugins
    this.toPlugins = toPlugins
    this.content = content
    this.journal = journal
    this.errors = errors
  }

  get lastError () {
    return this.errors[this.errors.length - 1]
  }
}
