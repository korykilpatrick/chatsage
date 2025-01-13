/**
 * The EmojisController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/EmojisService');
const emojisEmojiIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.emojisEmojiIdDELETE);
};

const emojisEmojiIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.emojisEmojiIdGET);
};

const emojisGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.emojisGET);
};

const emojisPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.emojisPOST);
};


module.exports = {
  emojisEmojiIdDELETE,
  emojisEmojiIdGET,
  emojisGET,
  emojisPOST,
};
