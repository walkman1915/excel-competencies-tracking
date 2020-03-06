let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_TO_TRACKING_DDB_TABLE_NAME = process.env.USERS_TO_TRACKING_DDB_TABLE_NAME;

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
        const userId = event.pathParameters.userId;

		if (isEmptyObject(userId)) {
			response = {
				statusCode: 400,
				body: "This request is missing a necessary parameter - UserId.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			};
			return response;
         }

        // Check if an evaluation with the given parameters is in the database
        const getResponse = await getUserToTracking(userId);

       
        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        if (!("Item" in getResponse)) {
            response = {
                statusCode: 404,
                body: "A user to tracking entry was not found for the given user  - " + userId,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        }

        // Remove user to tracking location entry from the database
        await removeUserToTracking(userId);

        response = {
            statusCode: 204,
            body: "The user to tracking entry with the following id has been deleted - " + userId,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response;
};

/**
 * @param {Object} userId - the userId key that will be removed from the database
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function removeUserToTracking(userId) {
    return ddb.delete({
        TableName: USERS_TO_TRACKING_DDB_TABLE_NAME,
        Key: {
            "UserId" : userId,
        }
    }).promise();
}

/**
 * @param {Object} userId - the userId key that will be removed from the database
 * 
 * @returns {Object} object - a promise representing this user to tracking item
 */
function getUserToTracking(userId) {
    return ddb.get({
        TableName: USERS_TO_TRACKING_DDB_TABLE_NAME,
        Key: {
            "UserId" : userId,
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