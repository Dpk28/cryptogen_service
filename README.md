# Cryptogen micro-service
Cyptogen micro-service for generating crypto assets using fabric cryptogen tool.

### Swagger API 
 * http://aca555066563a11e98b450ab0abea834-78908697.ap-south-1.elb.amazonaws.com:4000/api-docs

### Prerequisites

To run this Crytogen API server, you'll need to:

* [Install Node 8+](https://nodejs.org/en/download/)
* Clone this repository:

      $ git clone https://github.com/Dpk28/cryptogen_service.git
      $ cd cryptogen_service

* Install node module dependencies:

      $ npm install

* Start API server:

      $ npm start

* Run unit test cases:

      $ npm test

* Build docker image 

      $ docker build -t cryptogen_service:1.0 .
