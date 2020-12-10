const router = require('express').Router()


router.post('/', (req, res) => {
    try {
        req.neo4j.read(req.body.cypher)
            .then(data => {
                let array = []
                let keys = data.records[0].keys
                data.records.forEach(record => {
                    let newRecord = {}
                    for(let i = 0; i < record._fields.length; i++) {
                        if (typeof(record._fields[i]) == 'object') {
                            newRecord[keys[i]] = record._fields[i].low
                        } else {
                            newRecord[keys[i]] = record._fields[i]
                        }
                    }
                    array.push(newRecord)
                })
                res.send(array)
            })
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }
})


module.exports = router