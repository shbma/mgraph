const router = require('express').Router()
const driverController = require('../controllers/driverController')


router.post('/', driverController.read)


module.exports = router