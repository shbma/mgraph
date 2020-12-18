var express = require('express');
var router = express.Router();

let deskController = require('../controllers/deskController');

router.get('/', function(req, res, next) {
  res.redirect('/subject');
});

/* Получить содержимое доски с указанным id */
router.get('/desk/:deskID', deskController.desk);

/* Получить содержимое доски c id по-умолчанию */
router.get('/desk', deskController.desk);


/* Предметная доска по-умолчанию */
router.get('/subject', function(req, res, next) {
  res.render('main/indexSubject', { title: 'mGraph' });
});

/* Доска с типологией*/
router.get('/typology', function(req, res, next) {
  res.render('main/indexTypo', { title: 'mGraph' });
});

module.exports = router;
