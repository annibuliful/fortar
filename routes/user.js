const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user')
const secret = require('../secret/secret');

//ES6 Arrow function
//const passport = require('passport'); instead of (passport)
module.exports = (app,passport) => {

    //(app) = to access app in server
    app.get('/', (req,res,next) => {
        //ถ้าไม่ได้เข้าเวปนานๆ
        if(req.session.cookie.originalMaxAge !== null) {
            res.redirect('/login');
        } else {
            res.render('index', {title: 'โชว์รูมรถ แหล่งซื้อขายรถมือสอง || showroomrod.com', user: req.user});
        }
    })

    app.get('/signup', (req,res) => {
        var errors = req.flash('error');
        res.render('user/signup', {title: 'สมัครสมาชิก || Showroomrod.com', messages: errors, hasErrors: errors.length > 0});
    });

    app.post('/signup', signupValidation, passport.authenticate('local.signup', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get('/login', (req,res) => {
        var errors = req.flash('error');
        res.render('user/login', {title: 'เข้าสู่ระบบ || Showroomrod.com', messages: errors, hasErrors: errors.length > 0});
    })

    app.post('/login', loginValidation, passport.authenticate('local.login', {
        //successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }), (req,res) => {
        if(req.body.rememberme) {
            req.session.cookie.maxAge = 30*24*60*60*1000;   // 30 days
        } else {
            req.session.cookie.expires = null;  //if null go to index
        }
        res.redirect('/sell')
    });

    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/sell',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/forgot', (req,res) => {
        var errors = req.flash('error');
        var info = req.flash('info');
        res.render('user/forgot', {title: 'ลืมรหัสผ่าน || Showroomrod.com', messages: errors, hasErrors: errors.length > 0, info: info, noErrors: info.length > 0})
    });

    app.post('/forgot', (req,res,next) => {
        async.waterfall([
            function(callback){
                crypto.randomBytes(20, (err, buf) => {
                    var rand = buf.toString('hex');
                    callback(err, rand);
                });
            },

            //Check whether email is exist or not
            function(rand, callback){
                User.findOne({'email':req.body.email}, (err, user) => {
                    if(!user){
                        req.flash('error', 'อีเมล์นี้ยังไม่เคยสมัครสมาชิก');
                        return res.redirect('/forgot');
                    }
                    user.passwordResetToken = rand;
                    user.passwordResetExpires = Date.now() + 60*60*1000;
                    
                    user.save((err) => {
                        callback(err, rand, user);
                    });
                })
            },
            
            //Sent email to user
            function(rand, user, callback){
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: secret.auth.user,
                        pass: secret.auth.pass
                    }
                });

                var mailOptions = {
                    to: user.email,
                    from: 'Showroomrod.com '+'<'+secret.auth.user+'>',
                    subject: 'รีเซตรหัสผ่านใหม่กับ Showroomrod.com',
                    text: 'คุณได้ทำการขอเปลี่ยนรหัสผ่านใหม่ \n\n'+
                        'กรุณากดลิ้งค์ด้านล่างเพื่อเข้าไปแก้ไขรหัสผ่าน: \n\n'+
                        'http://showroomrod.com/reset/'+rand+'\n\n'
                };
                
                smtpTransport.sendMail(mailOptions, (err, response) => {
                    req.flash('info', 'สำเร็จ! กรุณาเช็คอีเมล์ '+ user.email + ' เพื่อแก้ไขรหัสผ่านภายใน 1 ชัวโมงนะครับ');
                    return callback(err, user);
                });
            }
        ], (err) => {
            if(err){
                return next(err);
            }
            
            res.redirect('/forgot');
        })
    });

    app.get('/reset/:token', (req,res) => {
        User.findOne({passwordResetToken: req.params.token, passwordResetExpires: {$gt: Date.now()}}, (err,user) => {
            if(!user) {
                req.flash('error', 'ล้มเหลว! ลิ้งค์นี้ใช้ไม่ได้แล้ว กรุณากรอกอีเมล์เพื่อขอรหัสผ่านใหม่อีกครั้ง')
                return res.redirect('/forgot')
            }
            var errors = req.flash('error')
            var success = req.flash('success')
            res.render('user/reset', {title: 'เปลี่ยนรหัสผ่านใหม่ || Showroomrod.com', messages: errors, hasErrors: errors.length > 0, noErrors: success.length > 0});
        });
    });

    app.post('/reset/:token', (req,res) => {
        async.waterfall([
            function(callback) {
                User.findOne({passwordResetToken: req.params.token, passwordResetExpires: {$gt: Date.now()}}, (err,user) => {
                    if(!user) {
                        req.flash('error', 'ล้มเหลว! ลิ้งค์นี้ใช้ไม่ได้แล้ว กรุณากรอกอีเมล์เพื่อขอรหัสผ่านใหม่อีกครั้ง')
                        return res.redirect('/forgot')
                    }

                    req.checkBody('password','กรุณากรอกรหัสผ่าน').notEmpty();
                    req.checkBody('password','กรุณากรอกรหัสผ่านอย่างน้อย 4 หลัก').isLength({min:4});

                    var errors = req.validationErrors();
                    if(req.body.password == req.body.cpassword) {
                        if(errors) {
                            var messages = [];
                            errors.forEach((error) => {                  
                                messages.push(error.msg)              
                            })
                            var errors = req.flash('error', 'กรุณากรอกรหัสผ่านอย่างน้อย 4 หลัก'); 
                            res.redirect('/reset/' + req.params.token);
                        } else {
                            user.password = user.encryptPassword(req.body.password);
                            user.passwordResetToken = undefined;
                            user.passwordResetExpires = undefined;        
                            user.save((err) => {
                                req.flash('success', 'รหัสผ่านของคุณได้ถูกเปลี่ยนเรียบร้อยแล้ว')
                                callback(err,user)
                            })
                        }
                    } else {
                        req.flash('error', 'คุณกรอกรหัสผ่านไม่เหมือนกัน กรุณากรอกใหม่อีกครั้ง')
                        res.redirect('/reset/' + req.params.token)
                    }
                });
            },
            
            function (user,callback) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: secret.auth.user,
                        pass: secret.auth.pass
                    }
                });

                var mailOptions = {
                    to: user.email,
                    from: 'Showroomrod.com '+'<'+secret.auth.user+'>',
                    subject: 'รหัสผ่านของคุณได้เปลี่ยนแปลงเรียบร้อยแล้ว Showroomrod.com',
                    text: 'อีเมล์ถูกส่งมาเพื่อยืนยันว่ารหัสผ่าน Showroomrod.com ของอีเมล์ ' + user.email + ' ได้เปลี่ยนเรียบร้อยแล้ว \n\n'
                };
                
                smtpTransport.sendMail(mailOptions, (err, response) => {
                    callback(err,user);         
                    var error = req.flash('error');
                    var success = req.flash('success');
                    res.render('user/reset', {title: 'เปลี่ยนรหัสผ่านใหม่|| Showroomrod.com', messages: error, hasErrors: error.length > 0, 
                        success: success, noErrors: success.length > 0});
                });
            }
        ])
    })

    app.get('/profile', (req, res) => {
        var success = req.flash('success');
        User.findOne({'_id': req.user._id}, (err,data) => {
            res.render('user/profile', {title: 'My Profile', data: data, user: req.user, success: success, noErrors: success.length > 0})
        })
    })
        
    app.post('/profile', (req, res) => {
        User.findOne({ _id: req.user._id }, function(err, user) {
            if (user) {
                if (req.body.name) user.name = req.body.name;
                if (req.body.email) user.email = req.body.email;
                if (req.body.tel) user.tel = req.body.tel
                user.save(function(err) {
                    req.flash('success', 'ข้อมูลของคุณแก้ไขสำเร็จเรียบร้อยแล้ว');
                    res.redirect('/profile');
                });
            }
        });
    })

    app.get('/logout', (req,res) => {
        req.logout();
        req.session.destroy((err) => {
            res.redirect('/')
        })
    })
}

function signupValidation(req,res,next) {
    req.checkBody('name','กรุณากรอกชื่อและนามสกุล').notEmpty();
    req.checkBody('tel','กรุณากรอกเบอร์มือถือ').notEmpty();
    req.checkBody('tel','กรุณากรอกเบอร์มือถือ 10 หลัก').isLength(10);
    req.checkBody('email','กรุณากรอกอีเมล์').notEmpty();
    req.checkBody('email','กรุณากรอกอีเมล์ที่ถูกต้อง').isEmail();
    req.checkBody('password','กรุณากรอกรหัสผ่าน').notEmpty();
    req.checkBody('password','กรุณากรอกรหัสผ่านอย่างน้อย 4 หลัก').isLength({min:4});
    
    var signupErrors = req.validationErrors();
    
    if(signupErrors) {
        var messages = [];
        signupErrors.forEach((error) => {
            messages.push(error.msg);
        });
        req.flash('error', messages);
        res.redirect('/signup');
    } else {
        return next();
    }
}

function loginValidation(req,res,next) {
    req.checkBody('email','กรุณากรอกอีเมล์').notEmpty();
    req.checkBody('email','กรุณากรอกอีเมล์ที่ถูกต้อง').isEmail();
    req.checkBody('password','กรุณากรอกรหัสผ่าน').notEmpty();
    req.checkBody('password','กรุณากรอกรหัสผ่านอย่างน้อย 4 หลัก').isLength({min:4});
    
    var loginErrors = req.validationErrors();
    
    if(loginErrors) {
        var messages = [];
        loginErrors.forEach((error) => {
            messages.push(error.msg);
        });
        req.flash('error', messages);
        res.redirect('/login');
    } else {
        return next();
    }
}

function isLoggedIn (req,res,next) {
    if(req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login');
    }
}
