const { elasticMapping } = require('charity-base-schema')
const insert = require('./stream-processor')
const esClient = require('./elastic-client')
const { db, elastic } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const NUM_CHARITIES_ESTIMATE = 170000

const createIndex = () => new Promise((resolve, reject) => {
  esClient.indices.create({
    index: elastic.index,
    body: {
      settings: {
        'index.mapping.coerce': true,
        'index.mapping.ignore_malformed': false,
        'index.requests.cache.enable': true,
      },
      mappings: elasticMapping()
    }
  }, (err, res) => {
    if (err) {
      return reject(err)
    }
    return resolve(res)
  })
})


const esIndex = () => {
  let progressBar

  return connectToDb(db, { useNewUrlParser: true })
  .then(createIndex)
  .then(() => {
    progressBar = getProgressBar('Indexing charities')
    progressBar.start(NUM_CHARITIES_ESTIMATE, 0)
    return insert(
      Charity,
      esClient,
      elastic.index,
      progressBar.update.bind(progressBar),
    )
  })
  .then(counter => {
    progressBar.update(NUM_CHARITIES_ESTIMATE)
    progressBar.stop()
    log.info(`Streamed through ${counter} charities`)
    process.exit(0)
  })
  .catch(e => {
    log.error(e)
    process.exit(1)
  })
}

esIndex()
