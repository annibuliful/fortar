const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const userSchema = new Schema ({
    name: {type: String},
    tel: {type: String},
    email: {type: String, unique: true},
    password: {type: String},
    profilePic: {type: String, default: 'http://showroomrod.com/images/profile-pic.png'},

    cars: [{
        type: Schema.Types.ObjectId, ref: 'Car'
    }],

    passwordResetToken: {type: String, default: ''},
    passwordResetExpires: {type: Date, default: Date.now},

    facebookId: {type: String, default: ''},
    tokens: Array,

    //created: {type: Date, default: Date.now},
    //birthday: {type: Date}, 
    //googleId: {type: String, default:''},
    //lineId: {type: String, default:''},
    //address: {type: String},

});

userSchema.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User', userSchema);