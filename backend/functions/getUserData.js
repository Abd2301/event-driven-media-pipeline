const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    try {
        // Get user email from the authorizer context
        const email = event.requestContext.authorizer.claims.email;
        
        // Get user data from DynamoDB
        const params = {
            TableName: process.env.USERS_TABLE,
            Key: { email }
        };
        
        const { Item: user } = await docClient.send(new GetCommand(params));
        
        if (!user) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' })
            };
        }
        
        // Remove sensitive information
        delete user.password;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    tenantId: user.tenantId,
                    createdAt: user.createdAt
                }
            })
        };
    } catch (error) {
        console.error('Get user data error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 