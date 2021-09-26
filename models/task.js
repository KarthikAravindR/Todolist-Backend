const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = mongoose.Schema

const taskSchema = new schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    completed: {type: Boolean, required: true},
})

taskSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Task', taskSchema)