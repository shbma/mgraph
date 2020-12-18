const router = require('express').Router();


router.use('/', require('./home'))

router.use('/users', require('./users'))

router.use('/driver', require('./driver'))


module.exports = router