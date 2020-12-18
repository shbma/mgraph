const router = require('express').Router()


router.post('/', async (req, res) => {
    try {
        req.neo4j.read(req.body.cypher)
            .then(data => res.send(data.records))
            .catch(error => console.log(error))
    } catch (err) {
        console.log(err)
        res.render('error/500')
    }
})

router.get('/', (req, res) => {
    req.neo4j.write(req.query.cypher.toString())
        .then(result => res.send(result))
        .catch(error => console.log(error))
})


module.exports = router