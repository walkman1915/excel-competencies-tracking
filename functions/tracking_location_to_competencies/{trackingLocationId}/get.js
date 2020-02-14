let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TRACKING_LOCATIONS_TO_COMPETENCIES_DDB = process.env.TRACKING_LOCATIONS_TO_COMPETENCIES_DDB; // Allows us to access the environment variables defined in the Cloudformation template

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
        const trackingLocationId = event.pathParameters.trackingLocationId; // Get the trackingLocationId from /tracking_location_to_competencies/{trackingLocationId} path variable

        console.log(trackingLocationId);
        const trackingLocation = await getSpecificTrackingLocation(trackingLocationId);
        var statusCode = 200;
        
        // If the trackingLocation object is empty, it means there was no data found for that trackingLocation ID in the database
        if (isEmptyObject(trackingLocation)) {

            console.log("No match for " + trackingLocationId);

            statusCode = 204; // A 204 code represents that the action was successful but there is no content
        }

        response = {
            statusCode: statusCode,
            body: JSON.stringify(trackingLocation),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }

        console.log(response);
        
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

/**
 * Gets a specific tracking location via tracking location ID and returns the entire entry for that user in JSON format (defined in the Database Table Structures document)
 * @param {string} trackingLocationId - The ID of a trackingLocation whose information you want to retrieve
 * 
 * @returns {Promise} userPromise - Promise object representing a JSON object with all the data in this trackingLocation's entry in the table,
 *                                 or an empty object {} if no user with that ID was found
 */
function getSpecificTrackingLocation(trackingLocationId) {
    return ddb.get({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB,
        Key:{
            "LocationId": trackingLocationId
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