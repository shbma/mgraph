const neo4j = require('neo4j-driver')
const config = require('./config')


const driver = neo4j.driver(config.neo4j.url, neo4j.auth.basic(config.neo4j.username, config.neo4j.password))

driver.onError = error => {
    console.log(error)
}


module.exports = {
    read: (cypher, database = config.neo4j.database) => {
        const session = driver.session({
            defaultAccessMode: neo4j.session.READ
        })

        return session.run(cypher)
            .then(res => {
                session.close()
                return res
            })
            .catch(e => {
                session.close()
                throw e
            })
    },
    write: (cypher, database = config.neo4j.database) => {
        const session = driver.session({
            defaultAccessMode: neo4j.session.WRITE
        })

        return session.run(cypher)
            .then(res => {
                session.close()
                return res
            })
            .catch(e => {
                session.close()
                throw e
            })
    },

    beautify: (records) => {  // уплощает структуру результата запроса
        let array = []
        let keys = records[0].keys
        records.forEach(record => {
            let newRecord = {}
            for(let i = 0; i < record._fields.length; i++) {
                if (typeof(record._fields[i]) == 'object') {
                    newRecord[keys[i]] = record._fields[i] != null ? record._fields[i].low : null
                } else {
                    newRecord[keys[i]] = record._fields[i]
                }
            }
            array.push(newRecord)
        })
        return array
    }
}