let response;

const auth = require('/opt/auth');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template
const validRoles = ["Admin", "Faculty/Staff", "Coach", "Mentor"];
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
        let indicator = auth.verifyAuthorizerExistence(event);
        if (indicator != null) {
            return indicator;
        }
        indicator = auth.verifyValidRole(event, validRoles);
        if (indicator != null) {
            return indicator;
        }
        const requestBody = JSON.parse(event.body);

        // Information from the POST request needed to add a new user
        if (!("UserId" in requestBody) || requestBody.UserId == "") {
            return createMissingParameterErrorResponse("UserId");
        }
        const userId = requestBody.UserId;

        // TODO: decide what info must be present in UserInfo blob
        if (!("UserInfo" in requestBody) || requestBody.UserInfo == "") {
            return createMissingParameterErrorResponse("UserInfo");
        }
        const userInfo = requestBody.UserInfo;

        if (!("Role" in requestBody) || requestBody.Role == "") {
            return createMissingParameterErrorResponse("Role");
        }
        const role = requestBody.Role;

        // Cohort and GTID are optional, so if they are not present we set them to null
        // TODO: can ensure cohort is present if this is a required field for all students
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

function createMissingParameterErrorResponse(missingParameter) {
    response = {
        statusCode: 400,
        body: "This request is missing a necessary parameter - " + missingParameter + ".",
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    }
    return response;
}