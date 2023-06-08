export default class TaskContext {
  constructor({
    hasErrored = false,
    hasStopped = false,
    hasRun = false,
    fromPlugins = null,
    toPlugins = null,
    data = null,
    journal = null,
    errors = []
  } = {}) {
    this.hasErrored = hasErrored;
    this.hasStopped = hasStopped;
    this.hasRun = hasRun;
    this.fromPlugins = fromPlugins;
    this.toPlugins = toPlugins;
    this.data = data;
    this.journal = journal
    this.errors = errors;
  }

  get lastError() {
    return this.errors[this.errors.length - 1];
  }
}
