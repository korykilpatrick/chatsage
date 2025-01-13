/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* User Login
*
* authLoginPostRequest AuthLoginPostRequest 
* returns AuthTokens
* */
const authLoginPOST = ({ authLoginPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authLoginPostRequest,
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
* Logout user
*
* no response value expected for this operation
* */
const authLogoutPOST = () => new Promise(
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
* Refresh Access Token
*
* authRefreshPostRequest AuthRefreshPostRequest 
* returns AuthTokens
* */
const authRefreshPOST = ({ authRefreshPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authRefreshPostRequest,
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
* Register a new user (email-based verification)
*
* authRegisterPostRequest AuthRegisterPostRequest Creates a user record (deactivated=false) and sends a verification email.
* no response value expected for this operation
* */
const authRegisterPOST = ({ authRegisterPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authRegisterPostRequest,
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
* Verify user email
*
* authVerifyEmailPostRequest AuthVerifyEmailPostRequest 
* no response value expected for this operation
* */
const authVerifyEmailPOST = ({ authVerifyEmailPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authVerifyEmailPostRequest,
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
  authLoginPOST,
  authLogoutPOST,
  authRefreshPOST,
  authRegisterPOST,
  authVerifyEmailPOST,
};
