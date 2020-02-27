let response;

const randomBytes = require('crypto').randomBytes;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
// Allows us to access the environment variables defined in the Cloudformation template.
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME;
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
        if (!("userId" in event.pathParameters) || event.pathParameters.userId === "") {
            response = {
                statusCode: 400,
                body: "This request is missing a necessary path variable - UserID.",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        }

        const userId = event.pathParameters.userId; // Get the userId from /users/{userId} path variable
        const getUser = await getSpecificUser(userId);

        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        // because we can't add a non-exiting user to this table
        if (!("Item" in getUser)) {
            response = {
                statusCode: 404,
                body: "We can only get data for existing users to this table. There is no user with the entered id - " + userId,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        } else if (getUser.Item.Role.toString().toLowerCase() !== "mentor") {
            response = {
                statusCode: 404,
                body: "We can only get students for mentors. The user with the entered id -  " + userId + ", is not a mentor.",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        }

        const tableEntry = await getUsersToTrackingTableEntry(userId);
        if (!("Item" in tableEntry)) {
            response = {
                statusCode: 404,
                body: "There are no students associated with this mentor - " + userId,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        }

        const studentIds = tableEntry.Item.StudentIds;
        const studentObjs = [];

        for (var i = 0; i < studentIds.length; i++) {
                const currentStudent = await getSpecificUser(studentIds[i]);
                // how should we handle the deletion of a student? they'd still be in this list
                if ("Item" in currentStudent) studentObjs.push(currentStudent.Item);
        }

        response = {
            statusCode: 200,
            body: JSON.stringify(studentObjs),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };

    } catch (err) {
        console.log(err);
        return err;
    }

    return response;
};

/**
 * Performs the API call on the table to get the results
 *
 * @param {string} userId - a JSON representation of the params for the get request
 *
 * @returns {Object} object - a promise representing this get request
 */
function getUsersToTrackingTableEntry(userId) {
    return ddb.get({
        TableName: USERS_TO_TRACKING_DDB_TABLE_NAME,
        Key:{
            "UserId": userId
        }
    }).promise();
}

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
