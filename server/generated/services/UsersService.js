/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* List all users
*
* deactivated Boolean If true, returns only deactivated users (optional)
* returns List
* */
const usersGET = ({ deactivated }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        deactivated,
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
* Get current authenticated user
*
* returns User
* */
const usersMeGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
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
* Create a new user (alternative to /auth/register)
*
* userCreateRequest UserCreateRequest 
* returns User
* */
const usersPOST = ({ userCreateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userCreateRequest,
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
* Deactivate (soft-delete) a user
* Sets deactivated=TRUE, does not remove the user row.
*
* userId Integer 
* no response value expected for this operation
* */
const usersUserIdDELETE = ({ userId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userId,
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
* Retrieve a specific user
*
* userId Integer 
* returns User
* */
const usersUserIdGET = ({ userId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userId,
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
* Update a user's profile
*
* userId Integer 
* userUpdateRequest UserUpdateRequest 
* returns User
* */
const usersUserIdPUT = ({ userId, userUpdateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userId,
        userUpdateRequest,
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
* Reactivate a previously deactivated user
*
* userId Integer 
* returns User
* */
const usersUserIdReactivatePOST = ({ userId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userId,
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
  usersGET,
  usersMeGET,
  usersPOST,
  usersUserIdDELETE,
  usersUserIdGET,
  usersUserIdPUT,
  usersUserIdReactivatePOST,
};
