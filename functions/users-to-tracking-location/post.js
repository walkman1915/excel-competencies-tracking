let response;

const validate = require('/opt/validate');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
// Allows us to access the environment variables defined in the Cloudformation template

/* CONSTANTS */
const REQUIRED_ARGS = ["UserId"];
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

        // check that each required field is valid
        for (i = 0; i < REQUIRED_ARGS.length; i++) {
            ret = validate.validateField(requestBody, REQUIRED_ARGS[i]);
            if (ret != null) {
                return ret;
            }
		}

        const userId = requestBody.UserId;
        let studentIds;
        let locationIds;

        // Check if an evaluation with the given parameters is in the database
        const getUser = await getSpecificUser(userId);

        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        // because we can't add a non-existing user to this table
        ret = validate.validateField(getUser, "Item");
        if (ret != null) {
            return ret;
        }

        // Shouldn't this compare lowercase "mentor"?

        // this is a mentor so we should have data in the StudentIds parameter only
        if (getUser.Item.Role.toString().toLowerCase() === "Mentor") {

            // validating StudentIds
            ret = validate.validateField(requestBody, "StudentIds");
            if (ret != null) {
                return ret;
            }


            let allExist = await checkAllStudentsExist(requestBody.StudentIds);
            console.log(allExist);
            if (!allExist) {
                response = {
                    statusCode: 404,
                    body: "We can only add existing users to this table. The student list for this mentor included " +
                        "nonexistent users.",
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                };
                return response;
            }
            locationIds = null;
            studentIds = requestBody.StudentIds;
        }
        else {

            // validating StudentIds
            ret = validate.validateField(requestBody, "LocationIds");
            if (ret != null) {
                return ret;
            }

            let allExist = await checkAllLocationIdsExist(requestBody.LocationIds);
            console.log(allExist);
            if (!allExist) {
                response = {
                    statusCode: 404,
                    body: "We can only add existing location locations to this table. The location list for this user "
                        + "included nonexistent tracking locations.",
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                };
                return response;
            }
            locationIds = requestBody.LocationIds;
            studentIds = null;
        }

        const user_to_tracking = {
            UserId: userId,
            LocationIds: locationIds,
            StudentIds: studentIds
        };

        await addUserToTracking(user_to_tracking);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(user_to_tracking),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
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
 * @param {Array} studentIds- students being added to a mentor
 *
 * @returns {Boolean} if all the students's existed
 */
async function checkAllStudentsExist(studentIds) {
    // check all the student users exist
    for(let i = 0; i < studentIds.length; i++) {
        console.log("checking user " + studentIds[i]);
        let currStudent = await getSpecificUser(studentIds[i]);
        if (!("Item" in currStudent)) {
            return false;
        }
    }
    return true;
}

function getSpecificTrackingLocation(locationId) {
    return ddb.get({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME,
        Key:{
            "LocationId": locationId
        }
    }).promise();
}

/**
 * @param {Array} locationIds- locations being added to a student
 *
 * @returns {Boolean} if all the tracking locations existed
 */
async function checkAllLocationIdsExist(locationIds) {
    // check all the competency ids exist
    for(let i = 0; i < locationIds.length; i++) {
        let currTrackingLocation = await getSpecificTrackingLocation(locationIds[i]);
        if (!("Item" in currTrackingLocation)) {
            return false;
        }
    }
    return true;
}

/**
 * UserToTacking object follows the format in the Database Table Structures document
 * @param {Object} userToTracking - JSON object representing a user to tracking entry to add to the database,
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