let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
// Allows us to access the environment variables defined in the Cloudformation template
const USERS_TO_TRACKING_DDB_TABLE_NAME = process.env.USERS_TO_TRACKING_DDB_TABLE_NAME;
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME;
const TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME = process.env.TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME;
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

        // Information from the POST request needed to add a new user
        if (!("UserId" in requestBody) || requestBody.UserId === "") {
            return createMissingParameterErrorResponse("UserId");
        }

        const userId = requestBody.UserId;

        // Check if an evaluation with the given parameters is in the database
        const getUser = await getSpecificUser(userId);

        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        // because we can't add a non-exiting user to this table
        if (!("Item" in getUser)) {
            response = {
                statusCode: 404,
                body: "We can only add existing users to this table. There is no user with the entered id - " + userId,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            };
            return response;
        }

        // this is a mentor so we should have data in the StudentIds parameter only
        if (getUser.Item.Role.toString().toLowerCase() === "mentor") {
            if (!("StudentIds" in requestBody) || requestBody.StudentIds === "") {
                return createMissingParameterErrorResponse("StudentIds");
            }
            // TODO: implement this
            checkAllStudentsExist();
            const user_to_tracking = {
                UserId: userId,
                CompetencyIds: requestBody.CompetencyIds,
                StudentIds: requestBody.StudentIds
            };
            await addUserToTracking(user_to_tracking);
        }

        if (getUser.Item.Role.toString().toLowerCase() === "student") {
            if (!("CompetencyIds" in requestBody) || requestBody.CompetencyIds === "") {
                return createMissingParameterErrorResponse("CompetencyIds");
            }
            // TODO: implement this
            checkAllCompetencyIdsExist();
            const user_to_tracking = {
                UserId: userId,
                CompetencyIds: requestBody.CompetencyIds,
                StudentIds: null
            };
            await addUserToTracking(user_to_tracking);
        }

        // Construct the user object to store in the database
        const user = {
            UserId: userId
        };

        // Put the user in the database
        //await addUser(user);

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

function checkAllStudentsExist(studentIds) {
    // check all the student users exist
}

function checkAllCompetencyIdsExist(competencyIds) {
    // check all the competency ids exist
}

/**
 * UserToTacking object follows the format in the Database Table Structures document
 * @param {Object} user - JSON object representing a user to tracking entry to add to the database,
 * with null for non-existing values
 *
 * @returns {Object} object - a promise representing this put request
 */
function addUserToTracking(userToTracking) {
    return ddb.put({
        TableName: USERS_TO_TRACKING_DDB_TABLE_NAME,
        Item: userToTracking,
    }).promise();
}

function createMissingParameterErrorResponse(missingParameter) {
    response = {
        statusCode: 400,
        body: "This request is missing a necessary parameter - " + missingParameter + ".",
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    };
    return response;
}