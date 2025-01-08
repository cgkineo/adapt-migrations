import globs from 'globs'
import path from 'path'
import fs from 'fs-extra'
import TaskContext from './TaskContext.js'
import Journal from '../lib/Journal.js'
import { exec } from 'child_process'

export default class Task {
  constructor ({
    description = '',
    tests = [],
    steps = [],
    filePath = Task.currentFile,
    load = () => {}
  } = {}) {
    this.description = description
    this.tests = tests
    this.steps = steps
    this.load = load
    this.filePath = filePath
    if (!load) return // Assumed cloned
    Task.described.push(this)
  }

  clone () {
    return new Task({
      description: this.description,
      tests: this.tests,
      steps: this.steps,
      filePath: this.filePath,
      load: null
    })
  }

  getImmediateNextStepsOfType (stepIndex = 0, type) {
    const nextFilters = []
    const nextSteps = this.steps.slice(stepIndex)
    for (const step of nextSteps) {
      if (step.type === type) {
        nextFilters.push(step)
        continue
      }
      break
    }
    return nextFilters
  }

  getImmediateNextIndexOfType (stepIndex = 0, type) {
    const nextSteps = this.steps.slice(stepIndex)
    for (const nextStepIndex in nextSteps) {
      const step = nextSteps[nextStepIndex]
      if (step.type === type) {
        return parseInt(nextStepIndex) + stepIndex
      }
    }
    return -1
  }

  async run ({ journal, logger }) {
    logger.debug(`Task -- Running ${this.description}`)
    let shouldContinue = false
    const lastJournalEntryIndex = journal.lastEntryIndex
    this.context = new TaskContext({
      fromPlugins: journal.subject.fromPlugins,
      originalFromPlugins: journal.subject.originalFromPlugins,
      toPlugins: journal.subject.toPlugins,
      content: journal.subject.content,
      journal
    })
    Task.isRunning = true
    Task.stackUp(this)
    const wheres = this.getImmediateNextStepsOfType(0, 'where')
    let stepIndex = 0
    const stepCount = this.steps.length
    while (stepIndex < stepCount) {
      if (stepIndex >= wheres.length) {
        this.context.hasRun = true
      }
      const step = this.steps[stepIndex]
      try {
        shouldContinue = await step(this.context)
      } catch (err) {
        logger.error(`Task -- shouldContinue errored ${err}`)
        this.context.errors.push(err)
        this.context.hasErrored = true
        // Undo changes from this errored migrations
        journal.undoToIndex(lastJournalEntryIndex)
        stepIndex = this.getImmediateNextIndexOfType(stepIndex, 'error')
        shouldContinue = (stepIndex !== -1)
        if (shouldContinue) continue
      }
      if (shouldContinue) {
        stepIndex++
        continue
      }
      this.context.hasStopped = true
      break
    }
    this.isComplete = true
    // TODO: update current plugin version

    const result = this.context
    this.context = null
    Task.stackDown()
    Task.isRunning = false
    return result
  };

  async isApplicable ({ journal }) {
    Task.isRunning = true
    Task.stackUp(this)
    this.context = new TaskContext({
      fromPlugins: journal.subject.fromPlugins,
      originalFromPlugins: journal.subject.originalFromPlugins,
      toPlugins: journal.subject.toPlugins,
      content: journal.subject.content,
      journal
    })
    let shouldRun = true
    const wheres = this.getImmediateNextStepsOfType(0, 'where')

    for (const where of wheres) {
      this.isRunning = true
      const result = await where(this.context)
      this.isRunning = false
      if (result) continue
      shouldRun = false
      break
    }
    this.context = null
    Task.isRunning = false
    Task.stackDown()
    return shouldRun
  }

  get isComplete () {
    return this._isComplete ?? false
  }

  set isComplete (value) {
    this._isComplete = value
  }

  static get isRunning () {
    return this._isRunning ?? false
  }

  static set isRunning (value) {
    this._isRunning = value
  }

  static get mapCacheToSource () {
    return (this._mapCacheToSource = this._mapCacheToSource || {})
  }

  /** @returns {[Task]} */
  static get described () {
    return (this._described = this._described || [])
  }

  /** @returns {[Task]} */
  static get items () {
    return (this._items = this._items || [])
  }

  /** @returns {[Task]} */
  static get stack () {
    return (this._stack = this._stack || [])
  }

  /** @returns {Task} */
  static get current () {
    return this.stack[this.stack.length - 1]
  }

  static get currentFile () {
    return this._currentFile
  }

  static set currentFile (filePath) {
    this._currentFile = filePath
  }

  static get clonedItems () {
    return this.items.map(task => task.clone())
  }

  /**
   * @param {Task} task
   */
  static stackUp (task) {
    this.stack.push(task)
  }

  static stackDown () {
    this.stack.pop()
  }

  static async load ({
    cwd = process.cwd(),
    scripts,
    cachePath = path.join(cwd, 'migrations/cache'),
    logger
  }) {
    logger.info(`Task -- using cache path ${cachePath}`)
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath)
    const toDelete = await new Promise(resolve => {
      globs([
        '*.js'
      ], { cwd: cachePath, absolute: true }, (err, files) => resolve(err ? null : files))
    })
    toDelete.forEach(filePath => fs.rmSync(filePath))
    let i = 0
    for (const filePath of scripts) {
      const cachedPath = path.join(cachePath, `a${++i}.js`).replace(/\\/g, '/')
      Task.mapCacheToSource[cachedPath] = filePath.replace(/\\/g, '/')
      fs.copyFileSync(filePath, cachedPath)
    }
    fs.writeJsonSync(path.join(cachePath, 'package.json'), {
      name: 'migrations',
      type: 'module'
    });
    await new Promise(resolve => exec('npm install', { cwd: cachePath }, resolve));
    const modules = await new Promise(resolve => {
      globs([
        '*.js'
      ], { cwd: cachePath, absolute: true }, (err, files) => resolve(err ? null : files))
    })
    for (const filePath of modules) {
      Task.currentFile = filePath
      try {
        await import('file://' + filePath.replace(/\\/g, '/'))
        for (const task of Task.described) {
          Task.items.push(task)
          Task.stackUp(task)
          await task.load()
          Task.stackDown()
        }
      } catch (error) {
        logger.error(`Task -- ${error}`)
        error.stack = Object.entries(Task.mapCacheToSource).reduce((stack, [cache, source]) => {
          return stack.replaceAll(cache, source)
        }, error.stack)
        throw error
      }
      Task.described.length = 0
    }
  }

  static async runApplicable ({ cwd = process.cwd(), journal, logger }) {
    // TODO: don't output task description for search
    const clonedTasks = Task.clonedItems
    while (true) {
      const toRun = []
      logger.debug('Task -- Checking for applicable tasks')
      for (const task of clonedTasks.filter(item => !item.isComplete)) {
        const isApplicable = await task.isApplicable({ cwd, journal, logger })
        if (isApplicable) toRun.push(task)
      }
      logger.debug(`Task -- ${toRun.length} tasks applicable`)
      const isExhausted = (!toRun.length)
      if (isExhausted) return
      logger.debug('Task -- Running applicable tasks')
      // TODO: output task description only on run
      const lastJournalEntryIndex = journal.lastEntryIndex
      for (const task of toRun) {
        const { hasErrored } = await task.run({ cwd, journal, logger })
        if (hasErrored) {
          journal.undoToIndex(lastJournalEntryIndex)
          return
        }
      }
      logger.debug('Task -- Applicable tasks finished')
      const hasChanged = (lastJournalEntryIndex !== journal.lastEntryIndex)
      if (!hasChanged) return
    }
  }

  static async runTests ({ cwd = process.cwd(), journal, logger }) {
    for (const task of Task.clonedItems) {
      logger.info(`Task -- Testing: ${task.description}`)
      for (const test of task.tests) {
        const {
          // description,
          shouldRun,
          shouldStop,
          shouldError,
          fromPlugins,
          originalFromPlugins,
          toPlugins,
          content
        } = test()
        const journal = new Journal({
          content,
          fromPlugins,
          originalFromPlugins,
          toPlugins,
          logger
        })
        const {
          hasErrored,
          hasStopped,
          hasRun
        } = await task.run({ cwd, journal, logger })
        const isPassed = (shouldError && hasErrored) ||
          (shouldRun && hasRun) ||
          (shouldRun === false && hasRun === false) ||
          (shouldStop && hasStopped && !hasErrored)
        logger.info(`> ${isPassed ? 'Passed' : 'Failed'}`)
        // TODO: make sure journal entries have _id on them so that they're easier to read
        // logger.info(journal.entries)
      }
    }
  }
}
