'use strict';

//Internal modules
const config = require('../../config.json'),
    logger = require('../../logger'),
    taskModel = require('../models/task');

//External modules
const selfsigned = require('selfsigned');
const uuidv1 = require('uuid/v1');
  
const loggerName = "[Service]: ";

/**
 * Generate cryptos on the basis of user parameters
 * @param {String} orgName
 * @param {String} domain
 * @param {String} country
 *
 * @returns {Object}
 */
exports.generateCrypto = function(orgName, domain, country) {
	let attrs = [{ name: 'organisation', value: orgName }, 
				 { name: 'domain', value: domain  },
				 { name: 'country', value: country }];

	return new Promise((resolve, reject) => {
			selfsigned.generate(attrs, { days: 365 }, (err, pems) => {
	  		if(err) {
	  			reject(err);
	  		}

	  		//generate task ID using UUID node module on the basis of current timestamp
	  		let taskID = uuidv1();
	  		let taskObj = { task_id: taskID, status: 'pending' };

	  		let task = new taskModel(taskObj);

	  		//save task details in DB
	  		task.save(function (err, savedTask) {
			    if (err) {
			    	reject(err);
			    } 
			    resolve(taskObj);
		  	});
		});
	});

}

/**
 * Returns referenace id corresponding to taskID
 * @param {String} taskID
 *
 * @returns {Object}
 */
exports.getCryptoRef = function(taskID) {
    return new Promise((resolve, reject) => {
    	taskModel.findOne({ task_id: taskID })
    	    .select({ 'reference_id': 1, "_id": 0})
    	    .exec((err, result) => {
		        if(err) { reject(err); }

		    	resolve(result);
    		});
    });
}

/**
 * Returns task status corresponding to taskID
 * @param {String} taskID
 *
 * @returns {Object}
 */
exports.getTaskStatus = function(taskID) {
    return new Promise((resolve, reject) => {
    	taskModel.findOne({ task_id: taskID })
    	    .select({ 'status': 1, "_id": 0})
    	    .exec((err, result) => {
		        if(err) { reject(err); }

		    	resolve(result);
    		});
    });
}

