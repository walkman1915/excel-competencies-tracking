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
        // Information from the URL that is required to get a specific user
        if (!("userId" in event.pathParameters) || event.pathParameters.userId == "") {
            response = {
				statusCode: 400,
				body: "This request is missing a necessary path variable - UserID.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
        }
        const userId = event.pathParameters.userId; // Get the userId from /users/{userId} path variable

        // Query and get the specified user's info
        const user = await getSpecificUser(userId);

        var statusCode = 200;
        // If the user object is empty, it means there was no data found for that user ID in the database
        if (isEmptyObject(user)) {
            statusCode = 204; // A 204 code represents that the action was successful but there is no content
        }

        response = {
            statusCode: statusCode,
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
 * Gets a specific user via user ID and returns the entire entry for that user in JSON format (defined in the Database Table Structures document)
 * @param {string} userId - The ID of the user whose information you want to retrieve
 * 
 * @returns {Promise} userPromise - Promise object representing a JSON object with all the data in this user's entry in the table,
 *                                 or an empty object {} if no user with that ID was found
 */
function getSpecificUser(userId) {
    return ddb.get({
        TableName: USERS_DDB_TABLE_NAME,
        Key:{
            "UserId": userId
        }
    }).promise();
}

/**
 * Checks if the provided JSON object is empty {} or not
 * @param {JSON} obj - The object to check for emptiness
 * 
 * @returns {boolean} True if this JSON object is empty, false if it is not empty
 */
function isEmptyObject(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
        }
    }
    return true;
}