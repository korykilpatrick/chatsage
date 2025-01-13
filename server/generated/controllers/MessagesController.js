/**
 * The MessagesController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/MessagesService');
const channelsChannelIdMessagesGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdMessagesGET);
};

const channelsChannelIdMessagesPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.channelsChannelIdMessagesPOST);
};

const messagesMessageIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.messagesMessageIdDELETE);
};

const messagesMessageIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.messagesMessageIdGET);
};

const messagesMessageIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.messagesMessageIdPUT);
};

const messagesMessageIdThreadGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.messagesMessageIdThreadGET);
};

const messagesMessageIdThreadPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.messagesMessageIdThreadPOST);
};


module.exports = {
  channelsChannelIdMessagesGET,
  channelsChannelIdMessagesPOST,
  messagesMessageIdDELETE,
  messagesMessageIdGET,
  messagesMessageIdPUT,
  messagesMessageIdThreadGET,
  messagesMessageIdThreadPOST,
};
