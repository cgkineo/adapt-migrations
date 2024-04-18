// Example migration script

import { describe, whereContent, whereFromPlugin, whereToPlugin, mutateContent, checkContent, throwError, ifErroredAsk, testSuccessWhere, testErrorWhere, testStopWhere } from 'adapt-migrations';

describe('update plugin from v6.1.4 to v6.1.5 and add "Ollie" to display title', async () => {
  whereFromPlugin('text v6.1.4', { name: 'adapt-contrib-text', version: '<=6.1.4' });
  whereContent('has configured displayTitles', async content =>
    content.some(({ displayTitle }) => displayTitle)
  );
  mutateContent('change displayTitle', async content => {
    const quicknavs = content.filter(({ displayTitle }) => displayTitle);
    quicknavs.forEach(item => (item.displayTitle += ' ollie'));
    return true;
  });
  checkContent('check everything is ok', async content => {
    const isInvalid = content.some(({ displayTitle }) => displayTitle && !String(displayTitle).endsWith(' ollie'));
    if (isInvalid) throw new Error('found displayTitle without ollie at the end');
    return true;
  });
  updatePlugin('update text plugin', {name: 'adapt-contrib-text', version: '6.1.5', framework: '>=5.19.4'})
});

describe('quicknav to pagenav', async () => {
  addPlugin('add pagenav plugin', { name: 'pagenav', version: '1.0.0'});
  whereFromPlugin('quicknav v1.0.0', { name: 'quicknav', version: '1.0.0' });
  whereToPlugin('pagenav v1.0.0', { name: 'pagenav', version: '1.0.0' });
  removePlugin('remove quicknav plugin', {name: 'quicknav'})
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
    if (isInvalid) throw new Error('found invalid content attribute');
    return true;
  });
  // TODO: handle errors with question, allow to run without ui
  // ifErroredAsk({ question: 'Skip error', yes: 'Yes', no: 'No', defaultSkipError: true });
  // TODO: modify stack traces one errors to refer to the original migration script rather than the cached one,keep map of cached files to original files
  testSuccessWhere('Valid plugins and content', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    content: [{ _component: 'quicknav' }]
  });
  testStopWhere('Invalid content', {
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
