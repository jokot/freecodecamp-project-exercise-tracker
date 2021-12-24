const express = require('express')
const app = express()
require('dotenv').config()

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

const bodyParser = require('body-parser')

const router = express.Router();

const enableCORS = function (req, res, next) {
  if (!process.env.DISABLE_XORIGIN) {
    const allowedOrigins = ["https://www.freecodecamp.org"];
    const origin = req.headers.origin;
    if (!process.env.XORIGIN_RESTRICT || allowedOrigins.indexOf(origin) > -1) {
      console.log(req.method);
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
      });
    }
  }
  next();
};

const TIMEOUT = 10000;

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const User = require('./myApps.js').User;
const Log = require('./myApps.js').Log;

router.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});

router.get("/mongoose-model", function (req, res, next) {
  // try to create a new instance based on their model
  // verify it's correctly defined in some way
  let u;
  let l;
  u = new User({username: "test"});
  l = new Log({username: "test", count: 1, _id: u._id, log: [{description: "test", duration: 1, date: new Date()}]});
  res.json({u,l});
});


const createUser = require('./myApps.js').createAndSaveUser;
router.post('/users', (req, res, next)=>{
  let t = setTimeout(() => {
    next({mesage: "timeout"})
  },TIMEOUT);
  createUser(req.body.username, (err, user) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    } 
    if (!user) {
      console.log('Missing `done()` argument');
      return next({message: "Missing callback argument"});
    }
    res.json(user);
  });
})

const findUsers = require('./myApps.js').findAllUsers;
router.get('/users', (req, res, next)=>{
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  findUsers((err, users) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if(!users) {
      console.log('Missing `done()` argument');
      return next({ message: "Missing callback argument" });
    }
    res.send(users);
  });
});

const createExercie = require('./myApps.js').createAndSaveExerciseToLog;
router.post('/users/:_id/exercises', (req, res, next) => {
  let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  const date = (req.body.date) ? req.body.date : new Date();
  createExercie(req.body.description, req.body.duration, date, req.params._id, (err, exercice) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if(!exercice) {
      console.log('Missing `done()` argument');
      return next({ message: "Missing callback argument" });
    }
    res.send(exercice);
  })
})

const findLog = require('./myApps.js').findLogById;
router.get('/users/:_id/logs', (req, res, next) => {
  let t = setTimeout(() => {
    next({ mesage: "timeout" });
  }, TIMEOUT);
  findLog(req.params._id, req.query.from, req.query.to, req.query.limit, (err, log) => {
    clearTimeout(t);
    if (err) {
      return next(err);
    }
    if(!log) {
      console.log('Missing `done()` argument');
      return next({message: "Missing callback argument"});
    }
    res.send(log);
  })
})


app.use("/api", enableCORS, router);

// Error handler
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

// Unmatched routes handler
app.use(function (req, res) {
  if (req.method.toLowerCase() === "options") {
    res.end();
  } else {
    res.status(404).type("txt").send("Not Found");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
