# adapt-migrations

### Todos
https://github.com/cgkineo/adapt-migrations/issues/1

### Commands API
https://github.com/cgkineo/adapt-migrations/blob/master/api/commands.js
* `load({ cwd, cachePath, scripts })` - loads all migration tasks
* `capture({ cwd, content, fromPlugins })` - captures current plugins and content
* `migrate({ cwd, toPlugins })` - migrates content from capture to new plugins
* `test({ cwd })` - tests the migrations with dummy content

### Migration script API
Functions:
* `describe(description, describeFunction)` Describe a migration
* `whereContent(description, contentFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `whereStartPlugin(description, startPluginFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `whereFromPlugin(description, fromPluginFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `whereToPlugin(description, toPluginFilterFunction)` Limit when the migration runs, return true/false/throw Error
* `mutateContent(contentFunction)` Change content, return true/false/throw Error
* `checkContent(contentFunction)` Check content, return true/false/throw Error
* `throwError(description)` Throw an error
* `testSuccessWhere({ fromPlugins, toPlugins, content })` Supply some tests content which should end in success
* `testStopWhere({ fromPlugins, toPlugins, content })` Supply some tests content which should end prematurely
* `testErrorWhere({ fromPlugins, toPlugins, content })` Supply some tests content which will trigger an error

Arguments:
* `describeFunction = () => {}` Function body has a collection of migration script functions
* `contentFilterFunction = content => {}` Function body should return true/false/throw Error
* `fromPluginFilterFunction = fromPlugins => {}` Function body should return true/false/throw Error
* `toPluginFilterFunction = toPlugins => {}` Function body should return true/false/throw Error
* `contentFunction = content => { }` Function body should mutate or check the content, returning true/false/throw Error
* `fromPlugins = [{ name: 'quickNav , version: '1.0.0' }]` Test data describing the original plugins
* `toPlugins = [{ name: 'pageNav , version: '1.0.0' }]` Test data describing the destination plugins
* `content = [{ _id: 'c-05, ... }]` Test content for the course content

### Grunt Commands
```sh
grunt migration:capture # captures current plugins and content
# do plugin/fw updates
grunt migration:migrate # migrates content from capture to new plugins
grunt migration:test # tests the migrations with dummy content
grunt migration:test --file=adapt-contrib-text/migrations/text.js # tests the migrations with dummy content
```
