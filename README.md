# adapt-migrations

### Todos
https://github.com/cgkineo/adapt-migrations/issues/1

### Commands API
https://github.com/cgkineo/adapt-migrations/blob/master/api/commands.js
* `load({ cwd, cachePath, scripts })` - loads all migration tasks
* `capture({ cwd, content, fromPlugins })` - captures current plugins and content
* `migrate({ cwd, toPlugins })` - migrates data from capture to new plugins
* `test({ cwd })` - tests the migrations with dummy data

### Migration script API
Functions:
* `describe(description, describeFunction)` Describe a migration
* `whereContent(description, dataFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `whereFromPlugin(description, fromPluginFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `whereToPlugin(description, toPluginFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `mutateContent(dataFunction)` Change data, return true/false/throw Error
* `checkContent(dataFunction)` Check data, return true/false/throw Error
* `throwError(description)` Throw an error
* `testSuccessWhere({ fromPlugins, toPlugins, content })` Supply some tests content which should end in success
* `testStopWhere({ fromPlugins, toPlugins, content })` Supply some tests content which should end prematurely
* `testErrorWhere({ fromPlugins, toPlugins, content })` Supply some tests content which will trigger an error

Arguments:
* `describeFunction = () => {}` Function body has a collection of migration script functions
* `dataFilterFunction = data => {}` Function body should return true/false/throw Error
* `fromPluginFilterFunction = fromPlugins => {}` Function body should return true/false/throw Error
* `toPluginFilterFunction = toPlugins => {}` Function body should return true/false/throw Error
* `dataFunction = data => { }` Function body should mutate or check the data, returning true/false/throw Error
* `fromPlugins = [{ name: 'quickNav , version: '1.0.0' }]` Test data describing the original plugins
* `toPlugins = [{ name: 'pageNav , version: '1.0.0' }]` Test data describing the destination plugins
* `data = [{ _id: 'c-05, ... }]` Test data for the course content

### Example migration script
```js
import { describe, whereContent, whereFromPlugin, whereToPlugin, mutateContent, checkContent, throwError, ifErroredAsk, testSuccessWhere, testErrorWhere, testStopWhere } from 'adapt-migrations';

describe('add "ollie" to displayTitle where exists', async () => {
  whereContent('has configured displayTitles', async content =>
    content.some(({ displayTitle }) => displayTitle)
  );
  mutateContent('change displayTitle', async data => {
    const quicknavs = content.filter(({ displayTitle }) => displayTitle);
    quicknavs.forEach(item => (item.displayTitle += ' ollie'));
    return true;
  });
  checkContent('check everything is ok', async content => {
    const isInvalid = content.some(({ displayTitle }) => displayTitle && !String(displayTitle).endsWith(' ollie'));
    if (isInvalid) throw new Error('found displayTitle without ollie at the end');
    return true;
  });
});

describe('quicknav to pagenav', async () => {
  whereFromPlugin('quicknav v1.0.0', { name: 'quicknav', version: '1.0.0' });
  whereToPlugin('pagenav v1.0.0', { name: 'pagenav', version: '1.0.0' });
  whereContent('has configured quicknavs', async content =>
    content.some(({ _component }) => _component === 'quicknav')
  );
  mutateContent('change _component name', async content => {
    const quicknavs = content.filter(({ _component }) => _component === 'quicknav');
    quicknavs.forEach(item => (item._component = 'pagenav'));
    return true;
  });
  checkContent('check everything is ok', async content => {
    const isInvalid = content.some(({ isInvalid }) => isInvalid);
    if (isInvalid) throw new Error('found invalid data attribute');
    return true;
  });
  // TODO: handle errors with question, allow to run without ui
  // ifErroredAsk({ question: 'Skip error', yes: 'Yes', no: 'No', defaultSkipError: true });
  // TODO: modify stack traces one errors to refer to the original migration script rather than the cached one,keep map of cached files to original files
  testSuccessWhere('Valid plugins and data', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    content: [{ _component: 'quicknav' }]
  });
  testStopWhere('Invalid data', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    content: [{ _component: 'quicknav1' }]
  });
  testStopWhere('Invalid origin plugins', {
    fromPlugins: [{ name: 'quicknav', version: '0.1.0' }],
    toPlugins: [{ name: 'pagenav', version: '0.1.0' }],
    content: [{ _component: 'quicknav' }]
  });
  testStopWhere('Invalid destination plugins', {
    content: [{ _component: 'quicknav' }],
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '0.1.0' }]
  });
  testErrorWhere('Has invalid configuration', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    content: [{ _component: 'quicknav', isInvalid: true }]
  });
});

describe('where quicknav is weirdly configured', async () => {
  checkContent('check everything is ok', async content => {
    const isInvalid = content.some(({ isInvalid }) => isInvalid);
    if (isInvalid) throw new Error('Something went wrong');
    return true;
  });
  throwError('this is an error');
});
```

### Example grunt task
```js
module.exports = function(grunt) {

  const Helpers = require('../helpers')(grunt);
  const globs = require('globs');
  const path = require('path');
  const fs = require('fs-extra');

  grunt.registerTask('migration', 'Migrate from on verion to another', function(mode) {
    const next = this.async();
    const buildConfig = Helpers.generateConfigData();
    const fileNameIncludes = grunt.option('file');

    (async function() {
      const migrations = await import('adapt-migrations');

      const cwd = process.cwd();
      const outputPath = path.join(cwd, './migrations/');
      const cache = new migrations.CacheManager();
      const cachePath = await cache.getCachePath({
        outputPath: buildConfig.outputdir,
        tempPath: outputPath
      });

      const framework = Helpers.getFramework();
      grunt.log.ok(`Using ${framework.useOutputData ? framework.outputPath : framework.sourcePath} folder for course data...`);

      const plugins = framework.getPlugins().getAllPackageJSONFileItems().map(fileItem => fileItem.item);
      const migrationScripts = Array.from(await new Promise(resolve => {
        globs([
          '*/*/migrations/**/*.js',
          'core/migrations/**/*.js'
        ], { cwd: path.join(cwd, './src/'), absolute: true }, (err, files) => resolve(err ? null : files));
      })).filter(filePath => {
        if (!fileNameIncludes) return true;
        return filePath.includes(fileNameIncludes);
      });

      await migrations.load({
        cachePath,
        scripts: migrationScripts
      });

      if (mode === 'capture') {
        // TODO: capture all languages and not just the first
        if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
        const languages = framework.getData().languages.map((language) => language.name);
        const languageFile = path.join(outputPath, 'captureLanguages.json');
        fs.writeJSONSync(languageFile, languages);

        languages.forEach(async (language, index) => {
          const content = framework.getData().languages[index].getAllFileItems().map(fileItem => fileItem.item);
          const captured = await migrations.capture({ content, fromPlugins: plugins });
          const outputFile = path.join(outputPath, `capture_${language}.json`);
          fs.writeJSONSync(outputFile, captured);
        });

        return next();
      }

      if (mode === 'migrate') {
        try {
          const languagesFile = path.join(outputPath, 'captureLanguages.json');
          const languages = fs.readJSONSync(languagesFile);

          for (const language of languages) {
            const Journal = migrations.Journal;
            if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);
            const outputFile = path.join(outputPath, `capture_${language}.json`);
            const { content, fromPlugins } = fs.readJSONSync(outputFile);
            const originalFromPlugins = JSON.parse(JSON.stringify(fromPlugins))
            const journal = new Journal({
              data: {
                content,
                fromPlugins,
                originalFromPlugins,
                toPlugins: plugins
              }
              supplementEntry: (entry, data) => {
                entry._id = data[entry.keys[0]][entry.keys[1]]?._id ?? '';
                entry._type = data[entry.keys[0]][entry.keys[1]]?._type ?? '';
                if (entry._type && data[entry.keys[0]][entry.keys[1]]?.[`_${entry._type}`]) {
                  entry[`_${entry._type}`] = data[entry.keys[0]][entry.keys[1]]?.[`_${entry._type}`] ?? '';
                }
                return entry;
              }
            });
            await migrations.migrate({ journal });
            // TODO: add options to rollback on any error, to default fail silently or to default terminate
            console.log(journal.entries);
          }
        } catch (error) {
          console.log(error.stack)
        }
        return next();
      }

      if (mode === 'test') {
        await migrations.test();
        return next();
      }

      return next();
    })();
  });

};


```
```sh
grunt migration:capture # captures current plugins and data
# do plugin/fw updates
grunt migration:migrate # migrates data from capture to new plugins
grunt migration:test # tests the migrations with dummy data
grunt migration:test --file=adapt-contrib-text/migrations/text.js # tests the migrations with dummy data
```
