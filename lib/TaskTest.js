export default class TaskTest {
  constructor({
    description = '',
    shouldStop = true,
    shouldRun = false,
    shouldError = true,
    fromPlugins = [],
    toPlugins = [],
    data = []
  } = {}) {
    this.description = description;
    this.shouldStop = shouldStop;
    this.shouldRun = shouldRun;
    this.shouldError = shouldError;
    this.fromPlugins = fromPlugins;
    this.toPlugins = toPlugins;
    this.data = data;
  }
}
