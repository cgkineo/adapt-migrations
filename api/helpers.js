export function getConfig (content) {
  return content.find(({ _type, __path__ }) => _type === 'config' || __path__.endsWith('config.json'))
}
