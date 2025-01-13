/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Delete a file
*
* fileId Integer 
* no response value expected for this operation
* */
const filesFileIdDELETE = ({ fileId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        fileId,
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
* Download or view a file
*
* fileId Integer 
* no response value expected for this operation
* */
const filesFileIdGET = ({ fileId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        fileId,
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
* Upload a file
*
* file File  (optional)
* messageId Integer  (optional)
* returns File
* */
const filesPOST = ({ file, messageId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        file,
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

module.exports = {
  filesFileIdDELETE,
  filesFileIdGET,
  filesPOST,
};
