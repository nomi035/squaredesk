export const authSwaggerSchema = {
  loginBody: {
    description: 'Body for credentials',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
    },
  },


};
