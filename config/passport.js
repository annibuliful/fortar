const passport = require('passport');
const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const secret = require('../secret/secret');

passport.serializeUser((user,done) => {
    done(null, user.id); 
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err,user) => {
        done(err,user);
    });
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email', // >> you can use username or tel instead of email here <<
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => { // >> you can use username or tel instead of email here << 
    User.findOne({'email': email}, (err,user) => {
        if(err) {
            return done(err);
        }
        if(user) {
            return done(null, false, req.flash('error','อีเมล์นี้ถูกใช้สมัครไปแล้ว'));
        } 
        var newUser = new User();
        newUser.name = req.body.name;
        newUser.tel = req.body.tel;
        newUser.email = req.body.email;
        newUser.password = newUser.encryptPassword(req.body.password);
        newUser.save((err)=>{
            return done(null, newUser);
        });
    })
}));

passport.use('local.login', new LocalStrategy({
    usernameField: 'email', // >> you can use username or tel instead of email here <<
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => { // >> you can use username or tel instead of email here << 
    User.findOne({'email': email}, (err,user) => {
        if(err) {
            return done(err);
        }

        var messages = [];
        if(!user || !user.validPassword(password)) {
            messages.push('อีเมล์นี้ยังไม่เคยสมัครใช้งานหรือรหัสผ่านไม่ถูกต้อง');
            return done(null, false, req.flash('error', messages));
        } 
        return done(null,user)
    })
}));

passport.use(new FacebookStrategy(secret.facebook, (req,token,refreshToken,profile,done) => {
    User.findOne({facebookId: profile.id}, (err,user) => {
        if(err){
            return done(err)
        }
        // If already user
        if(user){
            return done(null,user);

        // First time
        } else {
            var newUser = new User();
            newUser.facebookId = profile.id;
            newUser.name = profile.displayName;
            //newUser.tel = 
            newUser.email = profile._json.email;
            newUser.profilePic = 'https://graph.facebook.com/' + profile.id + '/picture?type=large'
            newUser.tokens.push({token:token});
            newUser.save((err) => {
                if (err) throw err;
                return done(null,newUser);
            })
        }
    })
}))