const mongoose = require('mongoose') 
const uniqueValidator = require('mongoose-unique-validator')

const schema = mongoose.Schema

const userSchema = new schema({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
    image: {type: String, required: true},
    tasks: []
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User',userSchema)