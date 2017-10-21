const async = require('async');
const Car = require('../models/car')
const User = require('../models/user');

const multer = require('multer');
const gm = require('gm').subClass({imageMagick: true});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'photo')
    },
    filename: function (req, file, cb) {
        //cb(null, file.fieldname + '-' + Date.now() + '.png')
        cb(null, 'car-' + Date.now() + '.jpg')
    },
})
const upload = multer({ storage: storage })

function paginate(req, res, next) {
	var perPage = 30
	var page = req.params.page || 1

    Car.find({})
        .sort({created: -1})
		.skip((perPage * page) - perPage)
		.limit(perPage)
		.exec(function(err, data) {
			Car.count().exec(function(err, count) {
				if (err) return next(err)
				res.render('car/buy', {
                    title: 'หาซื้อรถมือสอง || Showroomrod.com', 
                    user: req.user, 
                    data: data,
                    current: page,
					pages: Math.ceil(count / perPage)
				})
			})
        })
}

//ES6 Arrow function
//const passport = require('passport'); can be used instead of (passport)
//(app) = to access app in server
module.exports = (app,passport) => {

    //Filter by searchbar (left-side bar of buy page)
    app.get('/find', (req,res) => {
        
        var queryCond = {};
        if(!req.query.minyear || req.query.minyear == '')       { req.query.minyear = 1900 }
        if(!req.query.maxyear || req.query.maxyear == '')       { req.query.maxyear = 2100 } 
        if(!req.query.minprice || req.query.minprice == '')     { req.query.minprice = 0 } 
        if(!req.query.maxprice || req.query.maxprice == '')     { req.query.maxprice = 100000000 }
        if(!req.query.minmileage || req.query.minmileage == '') { req.query.minmileage = 0 } 
        if(!req.query.maxmileage || req.query.minmileage == '') { req.query.maxmileage = 1000000 }
        //if(req.query.locationProvince  == 0)                    { req.query.}
        
        queryCond.price =   { $gte: req.query.minprice, $lte: req.query.maxprice }
        queryCond.year =    { $gte: req.query.minyear, $lte: req.query.maxyear }
        queryCond.mileage = { $gte: req.query.minmileage, $lte: req.query.maxmileage }
        //queryCond.locationProvince = req.query.locationProvince;
            
        Car.find(queryCond, (err,data) => {
            if (err) {
                console.log(err)
            }
            res.render('car/find', {title: 'ผลการค้นหารถมือสอง || Showroomrod.com', data:data})
        }).sort({created: -1});
    });

    //Search by typing (head bar of buy page)
    app.post('/search', (req,res) => {
        var make = req.body.search
        var regex = new RegExp(make, 'i')
        Car.find({'$or': [{'make': regex}, {'model': regex}]}, (err,data) => {
            if(err) {
                console.log(err)
            }
            res.render('car/search', {title: 'ผลการค้นหารถมือสอง || Showroomrod.com', data:data})
        })
    });

    //Filter by sorting (head bar of buy page) >> min to max 
    //How to do instant search?

    app.get('/buy', (req,res,next) => {
        paginate(req,res,next);
    });

    app.get('/page/:page', function(req,res,next) {
        paginate(req,res,next);
    })

    /* Ex-render to car page
    app.get('/buy', (req,res) => {
        Car.find({}, (err,result) => {
            res.render('car/buy', {title: 'โชว์รูมรถ ตลาดรถมือสอง || showroomrod.com', user: req.user, data: result});
            console.log(result) 
        }).sort({created: -1})
    })
    */

    app.get('/car/:id', (req,res) => {
        Car.findOne({'_id': req.params.id})
            .populate('owner')      
            .exec(function (err,data) {
                res.render('car/car', {title: 'รถที่คุณสนใจ || Showroomrod.com', user: req.user, id: req.params.id, data:data});
            })
    });

    app.get('/sell', isLoggedIn, (req,res) => {
        var success = req.flash('success')
        res.render('car/sell', {title: 'อยากขายรถมือสอง || Showroomrod.com', user: req.user, success: success, noErrors: success.length > 0});
        //console.log(req.user)
    })

    app.post('/sell', isLoggedIn, upload.any(), (req, res, next) => {
        async.waterfall([
          function(callback) {
            console.log('files', req.files)
            
            if (req.files.length > 0) {
                req.files.map(function(file) {
                    gm(file.path)
                    .resize(800, 640)
                    .gravity('Center')
                    //.extent(250, 250)
                    .noProfile()
                    .quality(80)
                    .write('./photo/resized/' + file.filename +'-800x640', function(err) {
                        if (err) {
                        console.log('error : ', err)
                        } else {
                            var newCar = new Car();
                            newCar.owner = req.user._id;
                            newCar.make = req.body.make;
                            newCar.model = req.body.model;
                            newCar.year = req.body.year;
                            newCar.mileage = req.body.mileage;
                            newCar.price = req.body.price;
                            newCar.detail = req.body.detail;
                            newCar.locationProvince = req.body.locationProvince;
                            newCar.locationDistrict = req.body.locationDistrict;
                            newCar.image = req.files; 
                            newCar.image_resized = './photo/resized/' + file.filename +'-800x640.jpg' ; 
                            newCar.save((err) => {
                                callback(err, newCar);
                            }); 
                            console.log(file.filename + ' resized!')
                            console.log('Guide' + file.path)
                        }
                    });
                })
            }

  
                
            },
            function (newCar, callback) {
                User.update (
                    {
                        _id: req.user._id
                    },{
                        $push: {cars: newCar._id }
                    }, function (err,count) {
                        req.flash('success', 'สำเร็จ! รถของคุณลงประกาศขายเรียบร้อยแล้ว')
                        res.redirect('/buy')
                    }
                )
            }
        ]);
    });

    app.get('/myshowroom', (req,res) => {
        Car.find({'owner': req.user._id}, (err,result) => {
            res.render('car/myshowroom', {title: 'รถที่ฉันลงประกาศขาย || Showroomrod.com', data: result, user: req.user});
            //console.log(result)
        });
    });

    //TODO: Create modal before delete
    app.get('/removecar/:id', (req, res) => {
        Car.remove({'_id': req.params.id}, (err,delData) => {
            res.redirect('/myshowroom');
        })
    })

    //TODO: Express-Validation for number, ...
    //change to Car.update({ _id }, xxx ) -> to reduce double database touch.
    app.get('/updatecar/:id', (req, res) => {
        Car.findOne({'_id': req.params.id}, (err,data) => {
            res.render('car/updatecar', {title: 'แก้ไขข้อมูลรถที่ลงประกาศขาย || Showroomrod.com', data: data, user: req.user});
            //console.log(data)
        })
    })

    app.post('/updatecar/:id', (req, res) => {
        Car.findOne({ _id: req.params.id }, (err, data) => {
            if (data) {
                if (req.body.make) data.make = req.body.make;
                if (req.body.model) data.model = req.body.model;
                if (req.body.price) data.price = req.body.price;
                if (req.body.detail) data.detail = req.body.detail;
                data.save(function(err) {
                    //req.flash('success', 'Your details have been updated');
                    //console.log('save')
                    res.redirect('/myshowroom');
                });
            }
        });
    })
    
}

function isLoggedIn (req,res,next) {
    if(req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/login');
    }
}

function sellValidation(req,res,next) {
    req.checkBody('make','กรุณาเลือกยี่ห้อรถ').notEmpty();
    req.checkBody('model','กรุณาเลือกรุ่นรถ').notEmpty();
    req.checkBody('year','กรุณาเลือกปี').notEmpty();
    req.checkBody('mileage','กรุณากรอกเลขไมล์').notEmpty();
    req.checkBody('mileage','กรุณากรอกเลขไมล์เป็นตัวเลขเท่านั้น').isInt();
    req.checkBody('price','กรุณากรอกราคาขาย').notEmpty();
    req.checkBody('price','กรุณากรอกราคาขายเป็นตัวเลขเท่านั้น').isInt();
    req.checkBody('locationProvince','กรุณาเลือกจังหวัดที่ดูรถ').notEmpty();
    req.checkBody('locationProvince','กรุณาเลือกอำเภอ/เขตที่ดูรถ').notEmpty();
    
    var sellErrors = req.validationErrors();
    
    if(sellErrors) {
        var messages = [];
        sellErrors.forEach((error) => {
            messages.push(error.msg);
        });
        req.flash('error', messages);
        res.redirect('/sell');
    } else {
        return next();
    }
}