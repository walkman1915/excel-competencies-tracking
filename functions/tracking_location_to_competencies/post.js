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

        console.log("Request received!");
        const requestBody = JSON.parse(event.body);

        // console.log(requestBody);

        // @todo add validation for advising?

        // Information from the POST request needed to add a new tracking location to competency
        if (!("LocationName" in requestBody) || requestBody.LocationName == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'LocationName' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const locationName = requestBody.LocationName;

        if (!("CompetencyIds" in requestBody) || requestBody.CompetencyIds == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'CompetencyIds' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const competencyIds = requestBody.CompetencyIds;

        let params = AWS.DynamoDB.QueryInput = {
            TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB,
            FilterExpression: "LocationName = :locationName",
            ExpressionAttributeValues: {
                ":locationName": locationName
            }
            
        }

        // scan the table for a match of locationName to see if creating a new Id is not necessary
        const match = await getTrackingLocation(params);

        console.log(match);

        let locationId;

        // if a match exists
        // if ("LocationId" in match) {
        if ("Items" in match && match.Items != undefined && match.Items.length != 0) {
        
            locationId = match.Items[0].LocationId;

            console.log("a match existed with id " + locationId);

        } else {

            // until a valid Id is obtained (i.e. a random number that doesn't collide is generated)
            while (locationId == null) {

                // attempting to create a new locationId
                potentialLocationId = String(Math.floor((Math.random() * 10000) + 1));

                //console.log("Attempting new id of " + potentialLocationId);

                // see if collision exists
                let collision = await getSpecificTrackingLocation(potentialLocationId);
                
                // we want collision to be empty! (since that means that potentialLocationId is a valid id!)
                if (isEmptyObject(collision)) {

                    //console.log(potentialLocationId + " doesn't exist yet!");
                    locationId = potentialLocationId;

                }
            }

        }

        
        const tracking_location = {
            LocationId: locationId,
            CompetencyIds: competencyIds,
            LocationName: locationName
        }

        console.log(tracking_location);

        // Put the tracking location to competency in the database
        await addTrackingLocation(tracking_location);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(tracking_location),
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
 * Tracking Location to Competency object follows the format in the Database Table Structures document
 * @param {Object} tracking_location - JSON object representing a tracking location to competency to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addTrackingLocation(tracking_location) {
    return ddb.put({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB,
        Item: tracking_location,
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

/**
 * Performs the API call on the table to get the results
 * 
 * @param {Object} params - a JSON representation of the params for the get request
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getTrackingLocation(params) {
    return ddb.scan(params).promise();
}