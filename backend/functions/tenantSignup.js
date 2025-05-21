const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    try {
        const { email, password, companyName, firstName, lastName } = JSON.parse(event.body);
        
        // Generate tenant ID
        const tenantId = uuidv4();
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create tenant record
        const tenantParams = {
            TableName: process.env.TENANTS_TABLE,
            Item: {
                tenantId,
                companyName,
                createdAt: new Date().toISOString(),
                status: 'active'
            }
        };
        
        // Create admin user record
        const userParams = {
            TableName: process.env.USERS_TABLE,
            Item: {
                email,
                password: hashedPassword,
                tenantId,
                firstName,
                lastName,
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        };
        
        // Save both records
        await Promise.all([
            docClient.send(new PutCommand(tenantParams)),
            docClient.send(new PutCommand(userParams))
        ]);
        
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Tenant created successfully',
                tenantId
            })
        };
    } catch (error) {
        console.error('Tenant signup error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 