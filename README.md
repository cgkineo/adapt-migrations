# adapt-migrations


```js
import { describe, whereData, whereFromPlugin, whereToPlugin, mutateData, checkData, throwError, ifErroredAsk, testSuccessWhere, testErrorWhere, testStopWhere } from 'adapt-migrations';

describe('add "ollie" to displayTitle where exists', async () => {
  whereData('has configured displayTitles', async data => {
    return data.some(({ displayTitle }) => displayTitle);
  });
  mutateData('change displayTitle', async data => {
    const quicknavs = data.filter(({ displayTitle }) => displayTitle);
    quicknavs.forEach(item => (item.displayTitle += ' ollie'));
    return true;
  });
  checkData('check everything is ok', async data => {
    const isInvalid = data.some(({ displayTitle }) => displayTitle && !String(displayTitle).endsWith(' ollie'));
    if (isInvalid) throw new Error('found displayTitle without ollie at the end');
    return true;
  });
});

describe('quicknav to pagenav', async () => {
  whereFromPlugin('quicknav v1.0.0', { name: 'quicknav', version: '1.0.0' });
  whereToPlugin('pagenav v1.0.0', { name: 'pagenav', version: '1.0.0' });
  whereData('has configured quicknavs', async data => {
    return data.some(({ _component }) => _component === 'quicknav');
  });
  mutateData('change _component name', async data => {
    const quicknavs = data.filter(({ _component }) => _component === 'quicknav');
    quicknavs.forEach(item => (item._component = 'pagenav'));
    return true;
  });
  checkData('check everything is ok', async data => {
    const isInvalid = data.some(({ isInvalid }) => isInvalid);
    if (isInvalid) throw new Error('found invalid data attribute');
    return true;
  });
  // TODO: handle errors with question, allow to run without ui
  // ifErroredAsk({ question: 'Skip error', yes: 'Yes', no: 'No', defaultSkipError: true });
  // TODO: modify stack traces one errors to refer to the original migration script rather than the cached one,keep map of cached files to original files
  testSuccessWhere('Valid plugins and data', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    data: [{ _component: 'quicknav' }]
  });
  testStopWhere('Invalid data', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    data: [{ _component: 'quicknav1' }]
  });
  testStopWhere('Invalid origin plugins', {
    fromPlugins: [{ name: 'quicknav', version: '0.1.0' }],
    toPlugins: [{ name: 'pagenav', version: '0.1.0' }],
    data: [{ _component: 'quicknav' }]
  });
  testStopWhere('Invalid destination plugins', {
    data: [{ _component: 'quicknav' }],
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '0.1.0' }]
  });
  testErrorWhere('Has invalid configuration', {
    fromPlugins: [{ name: 'quicknav', version: '1.0.0' }],
    toPlugins: [{ name: 'pagenav', version: '1.0.0' }],
    data: [{ _component: 'quicknav', isInvalid: true }]
  });
});

describe('where quicknav is weirdly configured', async () => {
  checkData('check everything is ok', async data => {
    const isInvalid = data.some(({ isInvalid }) => isInvalid);
    if (isInvalid) throw new Error('Something went wrong');
    return true;
  });
  throwError('this is an error');
});
```
