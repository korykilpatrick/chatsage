/* eslint-disable no-unused-vars */
const Service = require('./Service');
const { db } = require('../../../db');
const { messages, users, channels } = require('../../../db/schema');
const { eq, and, ilike, or } = require('drizzle-orm');

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
      // Base query for messages
      let query = db.select({
        messages: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(channels, eq(messages.channelId, channels.id));

      // Add conditions based on parameters
      const conditions = [];

      if (keyword) {
        conditions.push(ilike(messages.content, `%${keyword}%`));
      }

      if (workspaceId) {
        conditions.push(eq(messages.workspaceId, workspaceId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Execute query
      const results = await query.execute();

      // Format results
      const formattedResults = results.map(result => ({
        id: result.messages.id,
        content: result.messages.content,
        createdAt: result.messages.createdAt,
        user: {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName,
        },
        channel: {
          id: result.channel.id,
          name: result.channel.name,
          workspaceId: result.channel.workspaceId,
        },
        workspaceId: result.messages.workspaceId,
      }));

      resolve(Service.successResponse({
        messages: formattedResults,
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