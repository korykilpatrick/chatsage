/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Get all reactions for a message
*
* messageId Integer 
* returns List
* */
const messagesMessageIdReactionsGET = ({ messageId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Add a reaction to a message
*
* messageId Integer 
* messagesMessageIdReactionsPostRequest MessagesMessageIdReactionsPostRequest 
* no response value expected for this operation
* */
const messagesMessageIdReactionsPOST = ({ messageId, messagesMessageIdReactionsPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
        messagesMessageIdReactionsPostRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Remove a reaction from a message
*
* messageId Integer 
* reactionId Integer 
* no response value expected for this operation
* */
const messagesMessageIdReactionsReactionIdDELETE = ({ messageId, reactionId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
        reactionId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  messagesMessageIdReactionsGET,
  messagesMessageIdReactionsPOST,
  messagesMessageIdReactionsReactionIdDELETE,
};
