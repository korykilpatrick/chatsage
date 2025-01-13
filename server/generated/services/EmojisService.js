/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Soft-delete an emoji
* Sets deleted=true instead of physical removal.
*
* emojiId Integer 
* no response value expected for this operation
* */
const emojisEmojiIdDELETE = ({ emojiId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        emojiId,
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
* Get specific emoji details
*
* emojiId Integer 
* returns Emoji
* */
const emojisEmojiIdGET = ({ emojiId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        emojiId,
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
* List all emojis (by default excludes deleted unless specified)
*
* includeDeleted Boolean  (optional)
* returns List
* */
const emojisGET = ({ includeDeleted }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
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
* Add a new custom emoji
*
* emojiCreateRequest EmojiCreateRequest 
* returns Emoji
* */
const emojisPOST = ({ emojiCreateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        emojiCreateRequest,
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
  emojisEmojiIdDELETE,
  emojisEmojiIdGET,
  emojisGET,
  emojisPOST,
};
