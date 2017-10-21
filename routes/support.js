const User = require('../models/user');

module.exports = (app) => {

    app.get('/how-to-sell', (req,res) => {
        res.render('support/how-to-sell', {title: 'ตรวจสอบสภาพรถมือสองก่อนซื้อ || Showroomrod.com', user: req.user});
    });

    app.get('/inspect', (req,res) => {
        res.render('support/inspect', {title: 'ตรวจสอบสภาพรถมือสองก่อนซื้อ || Showroomrod.com', user: req.user});
    });

    app.get('/policy', (req,res) => {
        res.render('support/policy', {title: 'กฎกติกาการใช้งาน || Showroomrod.com', user: req.user});
    });

}