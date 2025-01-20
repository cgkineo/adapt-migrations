export function getConfig (content) {
  const configType = content.find(({ _type }) => _type === 'config')
  if (configType) return configType

  const config = content.find(({ __path__ }) => __path__ === 'src/course/config.json')
  return config
}
