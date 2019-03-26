'use strict';

module.exports = function (app) {
    let controller = require('../controllers/controller');

    app.route('/api/v1/generate')
       .post(controller.generateCrypto);

    app.route('/api/v1/status/:task_id')
       .get(controller.getTaskStatus);

    app.route('/api/v1/referance/:task_id')
       .get(controller.getCryptoRef);

    app.route('/api/v1/task/update')
       .post(controller.updateTask);
};
