export const UserSwaggerSchema = {
    createUserBody: {
      description: 'Body for creating user',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
          phone:{
            type: 'string',
          },
          address:{
            type: 'string',
          },
          role: {
            type: 'string',
          },

        },
      },
    },
  };
