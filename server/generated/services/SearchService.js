/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Search across messages, channels, and users
*
* keyword String  (optional)
* workspaceId Integer  (optional)
* returns _search_get_200_response
* */
const searchGET = ({ keyword, workspaceId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        keyword,
        workspaceId,
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
  searchGET,
};
