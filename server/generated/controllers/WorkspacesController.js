/**
 * The WorkspacesController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/WorkspacesService');
const workspacesGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesGET);
};

const workspacesWorkspaceIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdDELETE);
};

const workspacesWorkspaceIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdGET);
};

const workspacesWorkspaceIdMembersDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdMembersDELETE);
};

const workspacesWorkspaceIdMembersPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdMembersPOST);
};

const workspacesWorkspaceIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdPUT);
};


module.exports = {
  workspacesGET,
  workspacesWorkspaceIdDELETE,
  workspacesWorkspaceIdGET,
  workspacesWorkspaceIdMembersDELETE,
  workspacesWorkspaceIdMembersPOST,
  workspacesWorkspaceIdPUT,
};
