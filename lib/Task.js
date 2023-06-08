import globs from 'globs';
import path from 'path';
import fs from 'fs-extra';
import TaskContext from './TaskContext.js';

export default class Task {
  constructor({
    description = '',
    tests = [],
    steps = [],
    load = () => {}
  } = {}) {
    this.description = description;
    this.tests = tests;
    this.steps = steps;
    this.load = load
    this.filePath = Task.currentFile;
    Task.described.push(this);
  }

  getImmediateNextStepsOfType(stepIndex = 0, type) {
    const nextFilters = [];
    const nextSteps = this.steps.slice(stepIndex);
    for (const step of nextSteps) {
      if (step.type === type) {
        nextFilters.push(step);
        continue;
      }
      break;
    }
    return nextFilters;
  }

  getImmediateNextIndexOfType(stepIndex = 0, type) {
    const nextSteps = this.steps.slice(stepIndex);
    for (const nextStepIndex in nextSteps) {
      const step = nextSteps[nextStepIndex];
      if (step.type === type) {
        return parseInt(nextStepIndex) + stepIndex;
      }
    }
    return -1;
  }

  async run({ fromPlugins, toPlugins, data, journal }) {
    console.log("running", this.description)
    let shouldContinue = false;
    Task.isRunning = true;
    const lastJournalEntryIndex = journal.lastEntryIndex;
    this.context = new TaskContext({
      fromPlugins,
      toPlugins,
      data,
      journal
    });
    const wheres = this.getImmediateNextStepsOfType(0, 'where');
    let stepIndex = 0;
    const stepCount = this.steps.length;
    while (stepIndex < stepCount) {
      if (stepIndex >= wheres.length) {
        this.context.hasRun = true;
      }
      const step = this.steps[stepIndex];
      try {
        shouldContinue = await step(this.context);
      } catch (err) {
        this.context.errors.push(err)
        this.context.hasErrored = true;
        // Undo changes from this errored migrations
        journal.undoToIndex(lastJournalEntryIndex);
        stepIndex = this.getImmediateNextIndexOfType(stepIndex, 'error');
        shouldContinue = (stepIndex !== -1);
        if (shouldContinue) continue;
      }
      if (shouldContinue) {
        stepIndex++;
        continue;
      }
      this.context.hasStopped = true;
      break;
    }
    const result = this.context;
    this.context = null;
    Task.isRunning = false;
    return result;
  };

  static get isRunning() {
    return this._isRunning ?? false;
  }

  static set isRunning(value) {
    this._isRunning = value;
  }

  /** @returns {[Task]} */
  static get described() {
    return this._described = this._described || [];
  }

  /** @returns {[Task]} */
  static get items () {
    return this._items = this._items || [];
  }

  /** @returns {[Task]} */
  static get stack () {
    return this._stack = this._stack || [];
  }

  /** @returns {Task} */
  static get current() {
    return this.stack[this.stack.length - 1]
  }

  static get currentFile() {
    return this._currentFile
  }

  static set currentFile(filePath) {
    this._currentFile = filePath;
  }

  /**
   * @param {Task} task
   */
  static stackUp(task) {
    this.stack.push(task);
    this.items.push(task);
  }

  static stackDown() {
    this.stack.pop();
  }

  static async load({cwd = process.cwd }) {
    const outputPath = path.join(cwd, './migrations/');
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
    const cachePath = path.join(cwd, './migrations/cache/');
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
    const migrationScripts = await new Promise(resolve => {
      globs([
        '*/*/migrations/**/*.js',
        'core/migrations/**/*.js'
      ], { cwd: path.join(cwd, './src/'), absolute: true }, (err, files) => resolve(err ? null : files));
    });
    let i = 0;

    for (const filePath of migrationScripts) {
      fs.copyFileSync(filePath, path.join(cachePath, `a${++i}.js`));
    }
    fs.writeJsonSync(path.join(cachePath, 'package.json'), { name:'migrations', type:'module' })
    const modules = await new Promise(resolve => {
      globs([
        '*.js'
      ], { cwd: cachePath, absolute: true }, (err, files) => resolve(err ? null : files));
    });
    for (const filePath of modules) {
      Task.currentFile = filePath;
      await import('file://'+ filePath.replace(/\\/g, '/') );
      for (const task of Task.described) {
        Task.stackUp(task);
        await task.load();
        Task.stackDown();
      }
      Task.described.length = 0;
    }
    console.log("Finished loading")
  }

  static async runApplicable({ cwd = process.cwd(), fromPlugins, toPlugins, data, journal }) {
    console.log("finding applicable tasks")
    // TODO: don't output task description for search
    while (true) {
      const toRun = [];
      for (const task of Task.items.filter(item => !item.isComplete)) {
        let shouldRun = true;
        const wheres = task.getImmediateNextStepsOfType(0, 'where');
        for (const where of wheres) {
          this.isRunning = true;
          const result = await where({ fromPlugins, toPlugins, data });
          this.isRunning = false;
          if (result) continue;
          shouldRun = false;
          break;
        }
        if (shouldRun) toRun.push(task);
      }
      const isExhausted = (!toRun.length);
      if (isExhausted) return;
      console.log("running applicable tasks")
      // TODO: output task description only on run
      const lastJournalEntryIndex = journal.lastEntryIndex;
      for (const task of toRun) {
        const result = await task.run({ cwd, fromPlugins, toPlugins, data, journal });
        if (result.hasErrored) {
          journal.undo();
          return;
        }
      }
      const hasChanged = (lastJournalEntryIndex !== journal.lastEntryIndex);
      if (!hasChanged) return;
    }
  }
}
