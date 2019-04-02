'use strict';

//Internal modules
const config = require('../../config.json'),
    logger = require('../../logger'),
    taskModel = require('../models/task');

//External modules
const { renderString, renderTemplateFile } = require('template-file');
const uuidv1 = require('uuid/v1');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const archiver = require('archiver');
const recursive = require('recursive-readdir');
const removeDir = require("rimraf");

const exec = require('child_process').exec;
  
const loggerName = '[Service]: ';

const kmsUrl = process.env.KMS_URL || config.kmsUrl,
	  kmsApiVersion = process.env.KMS_API_VERSION || config.kmsApiVersion;

const axiosConfig = {
	headers: {
		'Content-Type': 'application/json;charset=UTF-8'
	}
};

const kmsServiceURL = `${kmsUrl}/${kmsApiVersion}`;

/**
 * Generate cryptos on the basis of user parameters
 * @param {String} ordererName
 * @param {String} ordererDomain
 * @param {String} ordererHostname
 * @param {String} orgName
 * @param {String} orgDomain
 *
 * @returns {Promise}
 */
exports.generateCrypto = function(ordererName, ordererDomain, ordererHostname, orgName, orgDomain) {
	let attrs = {
		'orderer_name': ordererName,
		'orderer_domain': ordererDomain,
		'orderer_hostname': ordererHostname,
		'org_name': orgName,
		'org_domain': orgDomain
	}

	return new Promise(async(resolve, reject) => {
			//generate task ID using UUID node module on the basis of current timestamp
		  	let taskID = uuidv1();
		  	let configContent = "";

		  	//Generating crypto-config file content on the basis of user attributes
			try {
			    configContent = await renderTemplateFile(path.resolve(__dirname + '/../../crypto-config.yaml'), attrs);
			} catch(err) {
				logger.error(loggerName, err);
			  	reject(err);
			}

			//crypto config yaml file will be created or overwritten by default.
			fs.writeFile(path.resolve(__dirname + `/../scripts/crypto-config.yaml`), configContent, async (err) => {
			    if(err) {
			    	logger.error(loggerName, err);
			        reject(err);
			    }

			//Execute cryptogen script to generate crypto assets
			let scriptDirPath = path.resolve(__dirname + `/../scripts`);
			exec(path.resolve(`${scriptDirPath}/script.sh ${scriptDirPath}`), (err, stdout, stderr) => {
			    if (err) {
			    	logger.error(loggerName, err);
			        reject(err);
			    }
				
				//Read cryptogen tool generated assets files 
				recursive(path.resolve(__dirname + `/../../crypto-config`)).then(async files => {
					let encodedAsset = await concatenateAssetFiles(files);
					
					//Invoke KMS service to store encoded crypto assets
					let response = await axios.post(`${kmsServiceURL}/store`, {task_id: taskID, asset: encodedAsset}, axiosConfig);

					let taskObj = { task_id: taskID, status: response.data.status, reference_id:response.data.referenceID};
					let task = new taskModel(taskObj);

					taskObj.status = response.data.status;
					taskObj.reference_id = response.data.referenceID; 

					//save task details in DB
					task.save(function (err, savedTask) {
						if (err) {
							logger.error(loggerName, err);
							reject(err);
						} 

						//Remove asset directory 	
						removeDir.sync(path.resolve(__dirname + `/../../crypto-config`));

						resolve(savedTask);
					});	
				}).catch(err => {
					logger.error(loggerName, err);
					reject(err);
				})
			});
		}); 
	});

}

/**
 * Returns referenace id corresponding to taskID
 * @param {String} taskID
 *
 * @returns {Promise}
 */
exports.getCryptoRef = function(taskID) {
    return new Promise((resolve, reject) => {
    	taskModel.findOne({ task_id: taskID })
    	    .select({ 'reference_id': 1, "_id": 0})
    	    .exec((err, result) => {
		        if(err) { 
		        	logger.error(loggerName, err);
		        	reject(err); 
		        } else if(!result) {
		        	reject('Invalid taskID.');
		        } else if(JSON.stringify(result) === '{}') {
		        	reject('No referenace id present.');
		        }

		    	resolve(result);
    		});
    });
}

/**
 * Returns task status corresponding to taskID
 * @param {String} taskID
 *
 * @returns {Promise}
 */
exports.getTaskStatus = function(taskID) {
    return new Promise((resolve, reject) => {
    	taskModel.findOne({ task_id: taskID })
    	    .select({ 'status': 1, "_id": 0})
    	    .exec((err, result) => {
		        if(err) { 
		        	logger.error(loggerName, err);
		        	reject(err); 
		        } else if(!result) {
		        	reject('Invalid taskID.');
		        }

		    	resolve(result);
    		});
    });
}

/**
 * Update task status and add ref ID (if present)
 * @param {String} taskID
 *
 * @returns {Promise}
 */
exports.updateTask = function(taskID, status, refID) {
    return new Promise((resolve, reject) => {
    	taskModel.findOneAndUpdate({ task_id: taskID }, { $set: { status: status, reference_id: refID }}, function (argument) {
    		if (err) { 
    			logger.error(loggerName, err);
    			reject(err);
    		 }

    		resolve("Successfully update task.");
    	})
    	
    });
}

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
function zipAssetDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

/**
 * Concatenate content of assset folder and encode using base64 encoding
 * @param {Array} files
 * @returns {Promise}
 */
function concatenateAssetFiles(files) {
  let concatenateContent = {};
  return new Promise((resolve, reject) => {
  	files.forEach(function(file) {
  	  try {
  	  	let arr = file.split("/");
  	  	let contents = fs.readFileSync(file, 'utf8');
  	  	concatenateContent[arr[arr.length - 1]] = contents;
  	  } catch(err) {
  	  	reject(err);
  	  }
	});

	//Encode using base64
	let buff = new Buffer(JSON.stringify(concatenateContent));  
	let base64data = buff.toString('base64');

	resolve(base64data);
  });
}

/**
 * Decode base64 encoded asset string
 * @param {String} data
 * @returns {Promise}
 */
 function decodeAsset(data) {
  return new Promise((resolve, reject) => { 
  	try {
  		let buff = new Buffer(data, 'base64');  
		let decodeData= buff.toString('ascii');
		resolve(JSON.parse(decodeData));
  	} catch(err) {
  		reject(err);
  	} 
  });
}

