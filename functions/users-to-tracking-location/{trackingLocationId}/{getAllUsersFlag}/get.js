let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const USERS_TO_TRACKING_LOCATION_DDB_TABLE_NAME = process.env.USERS_TO_TRACKING_LOCATION_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME;

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

    
        
        //Log the received get request
        console.log("Recieved Get Request");

        //Get the userId from the path parameter
        const trackingLocationId = event.pathParameters.trackingLocationId;
        const getAllUsersFlag = event.pathParameters.getAllUsersFlag;

        //Instantiate the parameters that will be used for the get request
        //QueryInput doc: https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Types/QueryInput.html
        let params = AWS.DynamoDB.QueryInput = {
            TableName: USERS_TO_TRACKING_LOCATION_DDB_TABLE_NAME
        };
        //Gets the query parameters from the get request, expecting possibly the limit (number per page)
        //or exclusiveStartKey (what element to start from in the case of pagination)
        const queryStringParameters = event.queryStringParameters
        console.log(queryStringParameters);
        
        //Checks and gets the ExclusiveStartKey.  The queryparams need to be null-checked because if no params are provided
        //then the object will be null.  It is assumed that the ESK is base-64 encoded JSON (i.e. the exact same thing 
        //that was given back to the user in the previous response)
        if (queryStringParameters != null && "ExclusiveStartKey" in queryStringParameters && queryStringParameters.ExclusiveStartKey != "") {
             params.ExclusiveStartKey = JSON.parse(Buffer.from(queryStringParameters.ExclusiveStartKey,'base64').toString('binary'));
        }
        //Gets the provided limit (maximum number of items it will display) and verifies that it is a valid value
        //If no limit is provided, it will default to returning every single item
        if (queryStringParameters != null && "Limit" in queryStringParameters && queryStringParameters.Limit != "") {
             let limit = queryStringParameters.Limit;
             console.log("Limit: " + limit);
             //Validation if the limit is an actual number or not, and it must be positive or a 400 is returned
             if (isNaN(+limit) || +limit <= 0) {
                response = {
                    statusCode: 400,
                    body: "Limit must be a positive number if it is provided",
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                }
                return response
             }
             params.Limit = +limit;
        }
        //A default limit could be set here if desired
        // params.Limit = 2;
        
        //NOTE: Since a filter is applied to these results, there may be fewer results than the limit specified,
        //Even when the query is not at the end of the table.


        //Use the provided parameters to make the get API request
        const allUsers = await getUsers(params);
        console.log(allUsers);
        // Generate the response body for a successful get
        
        let respBody = {};

        //If there are more items after the provided ones (for example if a limit is set and this does not go to the end of the table)
        //then the response will return a LastEvaluatedKey, which can be passed back into the next call
        //as a ExclusiveStartKey in order to get the next 'page' of results.  This key is stringified and base-64 encoded
        //so that it can easily be passed back into the request to get the next page.  To get the next group of items,
        //it is expected that the user pass in the exact same key that is returned by the previous request as the ESK parameter
        if ("LastEvaluatedKey" in allUsers) {
            respBody.LastEvaluatedKey = Buffer.from(JSON.stringify(allUsers.LastEvaluatedKey),'binary').toString('base64');
        }

        //--------------------------------------------------------------------
        //Filtering through returned Users to see if they have the desired competency ID
        let userIds = [];
        let allUsersToTrackingItems = allUsers.Items;

        for(let i = 0; i < allUsersToTrackingItems.length; i++) {
            let currentTrackingLocations = allUsersToTrackingItems[i].LocationIds;
            for (let j = 0; j < currentTrackingLocations.length; j++) {
                console.log(currentTrackingLocations[j]);
                console.log(trackingLocationId);
                if (currentTrackingLocations[j].toString()== trackingLocationId) {
                    if (getAllUsersFlag == "True") {
                        let userObject = await getSpecificUser(allUsersToTrackingItems[i].UserId);
                        userIds.push(userObject)
                    } else {
                        userIds.push(allUsersToTrackingItems[i].UserId);

                    }
                }
            }
        }

        //Construct the response
        response = {
            statusCode: 200,
            body: JSON.stringify(userIds),
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
 * Performs the API call on the table to get the results
 * 
 * @param {Object} params - a JSON representation of the params for the get request
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getUsers(params) {
    return ddb.scan(params).promise();
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