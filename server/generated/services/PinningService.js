/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Unpin a message
*
* messageId Integer 
* no response value expected for this operation
* */
const messagesMessageIdPinDELETE = ({ messageId }) => new Promise(
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
* Pin a message
*
* messageId Integer 
* messagesMessageIdPinPostRequest MessagesMessageIdPinPostRequest  (optional)
* no response value expected for this operation
* */
const messagesMessageIdPinPOST = ({ messageId, messagesMessageIdPinPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        messageId,
        messagesMessageIdPinPostRequest,
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
  messagesMessageIdPinDELETE,
  messagesMessageIdPinPOST,
};
