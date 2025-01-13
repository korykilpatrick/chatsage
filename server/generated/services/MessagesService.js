/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* List messages in a channel with pagination (excluded deleted unless requested)
*
* channelId Integer 
* limit Integer  (optional)
* offset Integer  (optional)
* before Date  (optional)
* includeDeleted Boolean  (optional)
* returns List
* */
const channelsChannelIdMessagesGET = ({ channelId, limit, offset, before, includeDeleted }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
        limit,
        offset,
        before,
        includeDeleted,
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
* Send a message in the channel
*
* channelId Integer 
* messageCreateRequest MessageCreateRequest 
* returns Message
* */
const channelsChannelIdMessagesPOST = ({ channelId, messageCreateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
        messageCreateRequest,
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
* Soft-delete a message
* Sets deleted=true for a Slack-like 'message removed' placeholder.
*
* messageId Integer 
* no response value expected for this operation
* */
const messagesMessageIdDELETE = ({ messageId }) => new Promise(
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
* Get message details (including soft-deleted if found)
*
* messageId Integer 
* returns Message
* */
const messagesMessageIdGET = ({ messageId }) => new Promise(
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
* Update a message's content
*
* messageId Integer 
* messageUpdateRequest MessageUpdateRequest 
* returns Message
* */
const messagesMessageIdPUT = ({ messageId, messageUpdateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
        messageUpdateRequest,
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
* Retrieve replies in the thread (excludes deleted unless requested)
*
* messageId Integer 
* returns List
* */
const messagesMessageIdThreadGET = ({ messageId }) => new Promise(
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
* Post a reply in the thread
*
* messageId Integer 
* messageCreateRequest MessageCreateRequest 
* returns Message
* */
const messagesMessageIdThreadPOST = ({ messageId, messageCreateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
        messageCreateRequest,
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
  channelsChannelIdMessagesGET,
  channelsChannelIdMessagesPOST,
  messagesMessageIdDELETE,
  messagesMessageIdGET,
  messagesMessageIdPUT,
  messagesMessageIdThreadGET,
  messagesMessageIdThreadPOST,
};
