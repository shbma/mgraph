var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('/subject');
});

/* Предметная доска по-умолчанию */
router.get('/subject', function(req, res, next) {
  res.render('main/indexSubject', { title: 'mGraph' });
});

/* Доска с типологией*/
router.get('/typology', function(req, res, next) {
  res.render('main/indexTypo', { title: 'mGraph' });
});

module.exports = router;
