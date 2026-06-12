export const authSwaggerSchema = {
  loginBody: {
    description: 'Login with email or employeeId plus password',
    schema: {
      type: 'object',
      required: ['password'],
      properties: {
        email: {
          type: 'string',
          example: 'user@example.com',
        },
        employeeId: {
          type: 'string',
          example: 'EMP-001',
        },
        password: {
          type: 'string',
        },
      },
    },
  },
};
