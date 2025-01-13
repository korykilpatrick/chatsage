/**
 * The UsersController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/UsersService');
const usersGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersGET);
};

const usersMeGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersMeGET);
};

const usersPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersPOST);
};

const usersUserIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersUserIdDELETE);
};

const usersUserIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersUserIdGET);
};

const usersUserIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersUserIdPUT);
};

const usersUserIdReactivatePOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.usersUserIdReactivatePOST);
};


module.exports = {
  usersGET,
  usersMeGET,
  usersPOST,
  usersUserIdDELETE,
  usersUserIdGET,
  usersUserIdPUT,
  usersUserIdReactivatePOST,
};
