export function getConfig (content) {
  return content.find(({ _type, __path__ }) => _type === 'config' || __path__.endsWith('config.json'))
}

export function getGlobals (content) {
  const course = content.find(({ _type, __path__ }) => _type === 'course' || __path__.endsWith('course.json'));
  return course?._globals;
}
