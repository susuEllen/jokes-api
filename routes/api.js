var express = require('express');
var router = express.Router();

router.get('/random-joke', function(req,res, next) {
    res.send("knock knock");
});

module.exports = router
/* GET users listing. */
// router.get('/', function(req, res, next) {
//     res.send('respond with a resource');
//   });
  
//   module.exports = router;
  