let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template




/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context, callback) => {
    try {
        console.log(event)
        console.log(event.request)
        console.log(event.request.userAttributes)        
        console.log(event.userName);
        const attrs = event.request.userAttributes;
        const userId = event.userName;
        const userInfo = {
            "Name": attrs.name,
            "Email": attrs.email,
            
        }
        const user = {
            Role: attrs["custom:role"],
            UserInfo: userInfo,
            UserId: userId

        }
        await addUser(user)
        callback(null, event);
    } catch(err) {
        console.log(err);
        return err;
    }
    return response;

}
/**
 * User object follows the format in the Database Table Structures document
 * @param {Object} user - JSON object representing a user to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addUser(user) {
    return ddb.put({
        TableName: USERS_DDB_TABLE_NAME,
        Item: user,
    }).promise();
}