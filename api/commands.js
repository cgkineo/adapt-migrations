import path from 'path';
import fs from 'fs-extra';
import Task from '../lib/Task.js';
import Journal from '../lib/Journal.js';

export async function capture({ cwd = process.cwd(), data, fromPlugins }) {
  const outputPath = path.join(cwd, './migrations/');
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
  const outputFile = path.join(outputPath, 'capture.json');
  fs.writeJSONSync(outputFile, { data, fromPlugins });
};

export async function migrate({ cwd = process.cwd(), toPlugins }) {
  // TODO: add options to rollback on any error, to default fail silently or to default terminate
  const outputPath = path.join(cwd, './migrations/');
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
  const outputFile = path.join(outputPath, 'capture.json');
  const { data, fromPlugins } = fs.readJSONSync(outputFile);
  const journal = new Journal({
    data
  });
  await Task.load({ cwd });
  await Task.runApplicable({
    cwd,
    fromPlugins,
    toPlugins,
    data: journal.subject,
    journal
  });
  console.log(journal.entries);
}

export async function test({ cwd = process.cwd() } = {}) {
  await Task.load({ cwd });

  for (const task of Task.items) {
    console.log(`Testing: ${task.description}`);
    for (const test of task.tests) {
      const {
        description,
        shouldRun,
        shouldStop,
        shouldError,
        fromPlugins,
        toPlugins,
        data
      } = test();
      const journal = new Journal({
        data
      });
      const {
        hasErrored,
        hasStopped,
        hasRun
      } = await task.run({ cwd, task, fromPlugins, toPlugins, data: journal.subject, journal });
      const isPassed = (shouldError && hasErrored) ||
        (shouldRun && hasRun) ||
        (shouldRun === false && hasRun === false) ||
        (shouldStop && hasStopped && !hasErrored);
      console.log(`> ${isPassed ? 'Passed' : 'Failed'}`);
      // TODO: make sure journal entries have _id on them so that they're easier to read
      console.log(journal.entries)
    }
  }
}
