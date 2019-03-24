'use strict';

//Internal modules
const config = require('../../config.json'),
    logger = require('../../logger');

//External modules
const selfsigned = require('selfsigned');
  
const loggerName = "[Service]: ";

exports.generateCrypto = function(orgName, domain, country) {

	let attrs = [{ name: 'organisation', value: orgName }, 
				 { name: 'domain', value: domain  },
				 { name: 'country', value: country }];

	return new Promise((reject, resolve) => {
			selfsigned.generate(attrs, { days: 365 }, (err, pems) => {
	  		if(err) {
	  			reject(err);
	  		}

	  		resolve(pems);
		});
	});

}

exports.getCryptoAssets = function() {
    return new Promise((reject, resolve) => {
    		
    });
}