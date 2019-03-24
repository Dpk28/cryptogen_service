'use strict';

const config = require('../../config.json'),
    logger = require('../../logger'),
    services = require('../services/services');
   
const loggerName = "[Controller]: ";

exports.generateCrypto = function (req, res) {
    let orgName = req.body.org_name;
    let domain = req.body.domain;
    let country = req.body.country;

    if (!orgName || !domain || !country) {
        res.status(400).json({
            success: false,
            message: 'Invalid parameters'
        });
    }

    services.generateCrypto(orgName, domain, country).then(result => {
    	res.status(202).json({
            success: true,
            message: result
        });
    }).catch(err => {
    	res.status(400).json({
            success: false,
            message: err
        });
    })
}

exports.getTaskStatus = async function (req, res) {
    let taskID = req.params.task_id;
    if (!taskID) {
        res.status(400).json({
            success: false,
            message: 'task id can\'t be empty'
        });
    }

    try {
    	let status = await services.getTaskStatus(taskID);
    	res.status(200).send(status);
    } catch(err) {
    	res.status(400).json({
            success: false,
            message: err
        });
    }
}

exports.getCryptoRef = async function (req, res) {
    let taskID = req.params.task_id;
    if (!taskID) {
        res.status(400).json({
            success: false,
            message: 'task id can\'t be empty'
        });
    }

    try {
    	let refID = await services.getTaskStatus(taskID);
    	res.status(200).send(refID);
    } catch(err) {
    	res.status(400).json({
            success: false,
            message: err
        });
    }
}