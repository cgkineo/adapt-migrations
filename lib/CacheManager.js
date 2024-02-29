import crypto from 'crypto'
import path from 'path'
import globs from 'globs'
import fs from 'fs-extra'
import os from 'os'

export const ONE_MINUTE = 60 * 1000
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_WEEK = 7 * 24 * ONE_HOUR

export default class CacheManager {
  constructor (maxAge = ONE_WEEK) {
    this.maxAge = maxAge
  }

  static hash (path) {
    return crypto
      .createHash('sha1')
      .update(path, 'utf8')
      .digest('hex')
  }

  async getTempPath () {
    const osTempPath = await fs.promises.realpath(path.resolve(os.tmpdir()))
    const tempPath = path.posix.join(osTempPath, 'migrations')
    await fs.ensureDir(tempPath)
    return tempPath
  }

  async getCachePath ({ basePath = process.cwd(), outputPath, tempPath }) {
    const projectHash = CacheManager.hash(path.join(basePath, outputPath))
    const cachePath = path.join(tempPath ?? await this.getTempPath(), `${projectHash}.cache`)
    return cachePath
  }

  async getCheckFilePath () {
    const checkFilePath = path.join(await this.getTempPath(), 'last.touch')
    return checkFilePath
  }

  async isCleaningTime () {
    // By default, clean once a day, or with a floor of one hourly intervals
    const checkInterval = Math.max(this.maxAge / 7, ONE_HOUR)
    const checkFilePath = await this.getCheckFilePath()
    // Check if checkFile is older than the cleaning interval
    return (!fs.existsSync(checkFilePath) || Date.now() - (await fs.stat(checkFilePath)).mtime >= checkInterval)
  }

  async clean () {
    if (!await this.isCleaningTime()) return
    const checkFilePath = await this.getCheckFilePath()
    // Touch checkFile
    await fs.writeFile(checkFilePath, String(Date.now()))
    console.log.ok('Clearing compilation caches...')
    const tempPath = await this.getTempPath()
    // Fetch all cache files except checkFile
    const files = await new Promise((resolve, reject) => globs([
      `${tempPath}/**`,
      `!${checkFilePath}`
    ], {
      nodir: true
    }, (err, files) => err ? reject(err) : resolve(files)))
    // Fetch file ages
    const fileAges = []
    const now = Date.now()
    for (const index in files) {
      const file = files[index]
      let age = this.maxAge
      try {
        const stat = await fs.stat(file)
        age = (now - stat.mtime)
      } catch (err) {}
      fileAges[index] = { file, age }
    }
    // Sort by oldest
    fileAges.sort((a, b) => b.age - a.age)
    // Filter by expired
    const toRemove = fileAges.filter(fileAge => fileAge.age >= this.maxAge)
    // Delete expired cache files
    for (const fileAge of toRemove) {
      try {
        await fs.unlink(fileAge.file)
      } catch (err) {
        console.log.warn(`Could not clear cache file ${fileAge.file}`)
      }
    }
  }
};
