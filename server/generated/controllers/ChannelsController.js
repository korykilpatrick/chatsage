/**
 * The ChannelsController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/ChannelsService');
const channelsChannelIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdDELETE);
};

const channelsChannelIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdGET);
};

const channelsChannelIdMembersDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdMembersDELETE);
};

const channelsChannelIdMembersPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdMembersPOST);
};

const channelsChannelIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdPUT);
};

const channelsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsGET);
};

const channelsPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsPOST);
};

const workspacesWorkspaceIdChannelsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.workspacesWorkspaceIdChannelsGET);
};


module.exports = {
  channelsChannelIdDELETE,
  channelsChannelIdGET,
  channelsChannelIdMembersDELETE,
  channelsChannelIdMembersPOST,
  channelsChannelIdPUT,
  channelsGET,
  channelsPOST,
  workspacesWorkspaceIdChannelsGET,
};
