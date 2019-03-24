'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    task_id: String,
    reference_id: String,
    status: String
},{
    usePushEach: true
});

module.exports = mongoose.model('task', taskSchema);