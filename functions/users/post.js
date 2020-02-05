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
exports.lambdaHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);

        // TODO: ADD MORE DATA VALIDATION
        // Information from the POST request needed to add a new user
        const userId = requestBody.UserId;
        const userInfo = requestBody.UserInfo;
        const role = requestBody.Role;
        // Cohort and GTID are optional, so if they are not present we set them to null
        const cohort = ("Cohort" in requestBody && requestBody.Cohort != "")  ? requestBody.Cohort : null;
        const gtId = ("GTId" in requestBody && requestBody.Email != "")  ? requestBody.GTId : null;
        
        // Construct the user object to store in the database
        const user = {
            UserId: userId,
            UserInfo: userInfo,
            Role: role,
            Cohort: cohort,
            GTId: gtId
        }

        // Put the user in the database
        await addUser(user);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(user),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

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