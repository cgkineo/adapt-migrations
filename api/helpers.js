export function getConfig (content) {
  const configType = content.find(({ _type }) => _type === 'config')
  const config = (!configType) ? content.find(({ __path__ }) => __path__ === 'src/course/config.json') : configType

  return config
}
