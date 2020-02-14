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

        // TODO: ADD MORE DATA VALIDATION
        
        // Information for the DELETE request needed to delete a new tracking location to competency

        //  // Information from the DELETE request needed to add a new tracking location to competency
        //  if (!("LocationId" in requestBody) || requestBody.LocationId == "") {
        //     response = {
        //         statusCode: 400,
        //         body: "Required body argument 'LocationId' was not specified",
        //         headers: {
        //             'Access-Control-Allow-Origin': '*',
        //         },
        //     }
        //     return response;
        // }
        // const locationId = requestBody.LocationId;

        // if (!("CompetencyIds" in requestBody) || requestBody.CompetencyIds == "") {
        //     response = {
        //         statusCode: 400,
        //         body: "Required body argument 'CompetencyIds' was not specified",
        //         headers: {
        //             'Access-Control-Allow-Origin': '*',
        //         },
        //     }
        //     return response;
        // }
        // const competencyIds = requestBody.CompetencyIds;


        // const locationName = requestBody.LocationName;
        
        // // Construct the tracking location to competency object to delete from the database
        // const key = {
        //     "LocationId": locationId,
        //     "CompetencyIds": competencyIds,
        //     "LocationName": locationName
        // }

        const locationId = requestBody.LocationId;

        console.log(locationId);

        const getResponse = await getSpecificTrackingLocation(locationId);
        
        console.log(getResponse);

        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        if (isEmptyObject(getResponse)) {

            response = {
                statusCode: 404,
                body: "A tracking location was not found with the given parameters",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        // Delete the user in the database
        await deleteEval(locationId);
        
        // Generate the response for a successful delete
        response = {
            statusCode: 200,
            body: "Delete Successful",
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
 
 * @param {String} key - JSON object representing the key of the entry to remove
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function deleteEval(trackingLocationId) {
    return ddb.delete({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB,
        Key: {
            "LocationId": trackingLocationId
        }
    }).promise();
}

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