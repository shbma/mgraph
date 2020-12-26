const router = require('express').Router()


router.post('/', (req, res) => {
    try {
        req.neo4j.read(req.body.cypher)
            .then(data => {
                let array = req.neo4j.beautify(data.records)
                res.send(array)
            })
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }
})

router.patch('/', (req, res) => {
    try {
        req.neo4j.write(req.body.cypher)
            .then(data => {
                let array = req.neo4j.beautify(data.records)
                res.send(array)
            })
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }
})

module.exports = router