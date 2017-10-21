const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema ({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    make: {type: String},
    model: {type: String},
    price: {type: Number},
    mileage: {type: Number},
    year: {type: Number},
    detail: {type: String},
    locationProvince: {type: String},
    locationDistrict: {type: String},
    //image: { type: [String] },
    image: {type: Array},
    image_resized: {type: Array},
    created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Car', carSchema);