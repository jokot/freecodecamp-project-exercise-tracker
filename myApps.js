require('dotenv').config()
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const { Schema } = mongoose;
const mongoUri = process.env['MONGO_URI'];

mongoose.connect(mongoUri, { useNewUrlParser: true }).then(() => {
    console.log("mongoose connected");
}).catch((err) => {
    console.log("mongoose connection error:", err);
});

const userSchema = new Schema({
    username: String,
    count: Number,
    log: [{
        description: String,
        duration: Number,
        date: Date
    }]
});

let User = mongoose.model('User', userSchema);

const createAndSaveUser = (username, done) => {
    let user = new User({ username });
    user.save((err, user) => {
        if (err) return done(err);
        findUserById(user._id, (err, user) => {
          if (err) return done(err);
          return done(null, user);
        })
    });
}

const findUserById = (_id, done) => {
    User.findById(_id)
    .select('-__v -log')
    .exec((err, user) => {
        if (err) return done(err);
        return done(null, user);
    });
}

const findAllUsers = (done) => {
    User.find({})
    .select('username _id')
    .exec((err, users) => {
        if (err) return done(err);
        return done(null, users);
    });
}

const createAndSaveExerciseToLog = ( description, duration, date, _id, done) => {
    let dateString = new Date(date).toDateString()
    User.findByIdAndUpdate({ _id}, {  $inc: { count: 1 }, $push: { log: { description, duration, date } } }).select('-__v -log -count').exec((err, user) => {
        if (err) return done(err);
        var exercise = JSON.parse(JSON.stringify(user));
        exercise["description"] = description;
        exercise["duration"] = Number(duration);
        exercise["date"] = dateString;
        return done(null, exercise);
    });
}

const findLogById = (_id, from, to, limit, done) => {
    User.findById(_id)
    .select('-__v -log._id')
    .exec((err, user) => {
        if (err) return done(err);
        if ((!from && !to)){
            return done(null, convertLogDate(user, limit));
        }else {
            filterLog(user, from, to, limit, (err, log) => {
                if (err) return done(err);
                return done(null, log);
            })
        }
    });
}

const filterLog = (user, from, to, limit, done) => {
    var log = user.log;
    var f = new Date(from).getTime();
    var t = new Date(to).getTime();
    var result = log.filter( l => {
      var time = new Date(l.date).getTime();
      return (from && to) ? f <= time && time <= t : (from) ? time >= f : time <= t;
    });
    var newUser = JSON.parse(JSON.stringify(user));
    newUser["log"] = result
    newUser = convertLogDate(newUser, limit);
    if (from) newUser["from"] = new Date(from).toDateString();
    if (to) newUser["to"] = new Date(to).toDateString();
    return done(null, newUser);
}

const convertLogDate = (user, limit) => {
    let log = user.log
    var newUser = JSON.parse(JSON.stringify(user));
    let newLog = JSON.parse(JSON.stringify(log));
    newLog.forEach( (element, index) => {
        var updated = JSON.parse(JSON.stringify(element));;
        updated.date = String(new Date(updated.date).toDateString());
        newLog[index] =updated ;
    })
    newUser["log"] = (limit) ? newLog.slice(0, Number(limit)): newLog
    return newUser;
}

exports.User = User;
exports.createAndSaveUser = createAndSaveUser;
exports.createAndSaveExerciseToLog = createAndSaveExerciseToLog;
exports.findLogById = findLogById;
exports.findAllUsers = findAllUsers;