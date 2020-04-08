require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/clean-filter-suggest')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_AOO_REF,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  return {
    id: x.id,
    value: x.value,
    label: x.label,
    filterType: x.filterType,
    suggest: JSON.stringify(x.suggest.map(clean)),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map((doc) => (
      knex(TABLE_FILTER_JSON)
        .insert(doc)
    ))
  if (updateQueries.length === 0) {
    return
  }
  const transaction = knex.transaction(trx => {
    return Promise.all(updateQueries.map(x => x.transacting(trx)))
      .then(trx.commit)
      .catch(trx.rollback)
  })
  return transaction
}

const batchHandler = (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const docs = items.map(parser).filter(x => x)
      await update(docs)
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Persisting data from '${TABLE_AOO_REF}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex(TABLE_AOO_REF)
      .count('*', { as: 'numFilters' })

    const { numFilters } = (await countQuery)[0]

    const query = knex
      .select([
        knex.raw(`CONCAT_WS(
          '-',
          'area',
          areaId
        ) as id`),
        'areaId as value',
        'areaName as label',
        knex.raw(`'area' as filterType`),
        knex.raw(`JSON_ARRAY(
          areaId,
          areaName,
          areaAltName
        ) as suggest`),
      ])
      .from(function() {
        this
          .select([
            knex.raw(`CONCAT_WS(
              '-',
              TRIM(aootype),
              aookey
            ) as areaId`),
            'aooname as areaName',
            'aoosort as areaAltName',
          ])
          .from(TABLE_AOO_REF)
          .as('areas')
      })

    const queryStream = query.stream()
    queryStream.on('error', err => {
      log.error('Query stream error')
      log.error(err)
      throw err
    })

    PROGRESS_BAR.start(numFilters, 0)
    const total = await streamBatchPromise(
      queryStream,
      batchHandler,
      {
        batchSize: BATCH_SIZE,
      }
    )
    PROGRESS_BAR.update(total)
    PROGRESS_BAR.stop()
    log.info(`Successfully streamed through ${total} items`)
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
