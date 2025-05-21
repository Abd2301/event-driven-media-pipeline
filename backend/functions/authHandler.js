const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);
        
        // Get user from DynamoDB
        const params = {
            TableName: process.env.USERS_TABLE,
            Key: { email }
        };
        
        const { Item: user } = await docClient.send(new GetCommand(params));
        
        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' })
            };
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' })
            };
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                email: user.email,
                tenantId: user.tenantId,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                token,
                user: {
                    email: user.email,
                    tenantId: user.tenantId,
                    role: user.role
                }
            })
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 