var express = require('express');
const app = require('../app');
const db = require('../src/db');
var router = express.Router();

router.get('/random-joke', function(req, res, next) {
    //TODO: change hard coded to something from the DB
    res.send("knock knock");
});

router.post('/add-joke', async function(req, res, next) {
    console.log("body", req.body);
    const jokeText = req.body.text
    var savedJoke;
    try {
        savedJoke = await db.saveCustomJoke(jokeText)
    } catch(err) {
        //TODO: error handling
    }
    console.log(savedJoke)
    res.send('Added a joke')
});

router.post('/delete-last-joke', async function(req, res, next) {

    var deletedJoke;
    try {
        deletedJoke = await db.deleteLastJoke()

    }catch(err) {
        //TODO: error handling
    }
    console.log(deletedJoke)
    res.send('Deleted last joke')
});

router.post('/post-joke-to-slack', async function(req, res, next) {
    // calling into another node module, with exported methods that 
    // integrate slack.. 
    // probalby async since it will call slack API
})

module.exports = router;
  