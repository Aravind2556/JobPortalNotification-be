const mongoose = require('mongoose')
const imageSchema = mongoose.Schema({
   image64 : { type: String, required: true, trim: true },
})

const imageModel = mongoose.model('blob-model', imageSchema)

module.exports = imageModel