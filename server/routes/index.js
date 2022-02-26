var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Schema of request body:
/*
[{
  transcription: string,
  sound?: Enum.clip,
  entities: Array<entities>,
  sentiment: number
}]
*/

router.post('/', function(req, res, next) {
  console.log(req.body);
});

module.exports = router;
