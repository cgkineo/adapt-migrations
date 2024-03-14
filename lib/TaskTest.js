export default class TaskTest {
  constructor ({
    description = '',
    shouldStop = true,
    shouldRun = false,
    shouldError = true,
    fromPlugins = [],
    toPlugins = [],
    content = []
  } = {}) {
    this.description = description
    this.shouldStop = shouldStop
    this.shouldRun = shouldRun
    this.shouldError = shouldError
    this.fromPlugins = fromPlugins
    this.toPlugins = toPlugins
    this.content = content
  }
}
