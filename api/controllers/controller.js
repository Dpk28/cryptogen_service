'use strict';

const config = require('../../config.json'),
    logger = require('../../logger'),
    services = require('../services/services');
   
const loggerName = "[Controller]: ";

exports.generateCrypto = function (req, res) {
    let ordererName = req.body.orderer_name;
    let ordererDomain = req.body.orderer_domain;
    let ordererHostname = req.body.orderer_hostname;
    let orgName = req.body.org_name;
    let orgDomain = req.body.org_domain;

    if (!ordererName || !ordererDomain || !ordererHostname || !orgName || !orgDomain) {
        res.status(400).json({
            success: false,
            message: 'Invalid parameters'
        });
    }

    services.generateCrypto(ordererName, ordererDomain, ordererHostname, orgName, orgDomain).then(result => {
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
    	let refID = await services.getCryptoRef(taskID);
    	res.status(200).send(refID);
    } catch(err) {
    	res.status(400).json({
            success: false,
            message: err
        });
    }
}

exports.updateTask = async function (req, res) {
    let taskID = req.body.task_id;
    let status = req.body.status;
    let refID = req.body.ref_id;

    if (!taskID || !status || !refID) {
        res.status(400).json({
            success: false,
            message: 'invalid parameters'
        });
    }

    try {
        let response = await services.updateTask(taskID, status, refID);
        res.status(200).send(response);
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
}

