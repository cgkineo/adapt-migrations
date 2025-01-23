import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'

function padNum2(value) {
  return String(value).padStart(2, '0');
}

export default class Logger {
  constructor () {
    this.logArr = []
    this.config = {
      levels: {
        error: {
          colour: 'red'
        },
        warn: {
          colour: 'yellow'
        },
        info: {
          colour: 'cyan'
        },
        debug: {
          colour: 'grey'
        }
      }
    }
  }

  // getInstance used to allow import
  static getInstance () {
    if (Logger.instance === null) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // Colour level string, easier to differentiate between info/error/warn/debug
  static colourise (str, colour) {
    const chalkFunc = chalk[colour]
    return chalkFunc ? chalkFunc(str) : str
  }

  // Use getDateStamp to return readable date/time string.
  static getDateStamp () {
    const d = new Date()
    const date = `${d.getFullYear().toString()}/${padNum2(d.getMonth() + 1)}/${padNum2(d.getDate())}`
    const time = `${padNum2(d.getHours())}:${padNum2(d.getMinutes())}:${padNum2(d.getSeconds())}.${padNum2(d.getMilliseconds())}`
    const str = `${date} ${time}`
    return str
  }

  // Add Success/Fail ?
  info (...args) {
    this.log('info', args)
  }

  error (...args) {
    this.log('error', args)
  }

  warn (...args) {
    this.log('warn', args)
  }

  debug (...args) {
    this.log('debug', args)
  }

  // Colour level for easy read, store log in this.logArr as string
  log (level, args) {
    const colour = this?.config?.levels[level]?.colour || 'grey'
    const logFunc = console[level] ?? console.log
    const dateStamp = Logger.getDateStamp()
    const argsStr = args.join(', ')
    logFunc(`(${dateStamp}) -- ${Logger.colourise(level, colour)} -- `, ...args)
    this.logArr.push(`[${dateStamp}] -- ${level} -- ${argsStr}`)
  }

  // Output this.logArr, 2 log outputs, capture & migrate
  output (dir, type) {
    const logPath = path.join(dir, './logs/')
    if (!fs.existsSync(logPath)) fs.mkdirSync(logPath)

    const outputName = `${type}_log`
    const outputFile = path.join(logPath, `${outputName}.json`)
    fs.writeJSONSync(outputFile, this.logArr, { replacer: null, spaces: 2 })
  }
}

Logger.instance = null
