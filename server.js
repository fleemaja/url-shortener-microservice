var express = require('express');
var mongo = require('mongodb');
var app = express();

var path = process.cwd();
var port = process.env.PORT || 3500;
var appURL = 'https://radiant-spire-93686.herokuapp.com/';

mongo.MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/url-shortener-microservice', function(err, db) {

  if (err) {
    throw new Error('Database failed to connect!');
  } else {
    console.log('Successfully connected to MongoDB on port 27017.');
  }
  
  function validURL(url) {
    // Regex from https://gist.github.com/dperini/729294
    var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url);
  }
  
  function save(obj, db) {
    var sites = db.collection('sites');
    sites.save(obj, function(err, result) {
      if (err) throw err;
      console.log('Successfully saved ' + result);
    });
  }
  
  function randId() {
    var num = Math.floor(Math.random() * 1001).toString();
    return num;
  }
  
  db.createCollection("sites", {
    capped: true,
    size: 5242880,
    max: 5000
  });
  
  app.set('view engine', 'jade');

  app.get("/", function(request, response) {
    response.render('index');
  });
  
  app.get("/new", function(request, response) {
    response.render("index", { err: "Error: You need to add a proper URL"});
  });
  
  app.get("/:url", function(request, response) {
    var sites = db.collection("sites");
    
    sites.findOne({
      "shortened_url": appURL + request.params.url
    }, function(err, result) {
      if (err) throw err;
      if (result) {
        response.redirect(result.actual_url);
      } else {
        response.send({ "error": "this URL is not in the database" });
      }
    });
  });
  
  app.get("/new/:url*", function(request, response) {
    var url = request.url.slice(5);
    
    if (validURL(url)) {
      var urlObj = {
        actual_url: url,
        shortened_url: appURL + randId()
      }
      response.send(urlObj);
      save(urlObj, db);
    } else {
      var urlObj = {
        "error": "Wrong URL format. Invalid protocol and/or site."
      };
      response.send(urlObj);
    };
  });
  
  app.listen(port);
  
});
