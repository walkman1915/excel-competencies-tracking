var fs = require('fs');

let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template
const COMPETENCIES_DDB_TABLE_NAME = process.env.COMPETENCIES_DDB_TABLE_NAME;
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

        let csv = "Transaction Id,Time Stamp,Student User Id,Student Name,Cohort,Date Evaluated,Time Frame," +
            "Location,Competency Evaluated,Competency Id,Level,Evaluation Score,Evaluator Name,Evaluator Role," +
            "Evidence,Approved,Comments\n";


        //Log the received get request
        console.log(csv);
        //Instantiate the parameters that will be used for the get request
        //QueryInput doc: https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Types/QueryInput.html
        let params = AWS.DynamoDB.QueryInput = {
            TableName: EVALUATIONS_DDB_TABLE_NAME
        };

        //Gets the query parameters from the get request, expecting possibly the limit (number per page)
        //or exclusiveStartKey (what element to start from in the case of pagination)
        const queryStringParameters = event.queryStringParameters;
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
                };
                return response
            }
            params.Limit = +limit;
        }
        //A default limit could be set here if desired
        // params.Limit = 2;

        //Use the provided parameters to make the get API request
        const allEvals = await getEvals(params);
        console.log(allEvals);
        // Generate the response body for a successful get

        let respBody = {};
        respBody.Items = allEvals.Items; //Gets the actual items from the call

        for (let i = 0; i < allEvals.Items.length; i++) {
            let currentEval = allEvals.Items[i];
            let studentUser = (await getSpecificUser(currentEval.UserIdBeingEvaluated)).Item;
            let evaluator = (await getSpecificUser(currentEval.UserIdEvaluator)).Item;
            let competencyId = currentEval.CompetencyId_Timestamp.match("^[^_]+(?=_)")[0];
            let location = "WHERE IS THIS STORED?";
            let competency = (await getSpecificComp(competencyId)).Item;

            let date = currentEval.DateEvaluated.match("^[^T]+(?=T)")[0];
            let datesplit = date.split("-");
            let year = datesplit[0];
            let month = "" + (parseInt(datesplit[1]) + 1);
            if (month.length === 1) month = "0" + month;
            let day = datesplit[2];

            date = year + "-" + month + "-" + day;

            let timeFrame = year;
            if (parseInt(month) < 6) {
                timeFrame = "Spring " + timeFrame;
            } else {
                timeFrame = "Fall " + timeFrame;
            }

            let currentEvalString =
                currentEval.CompetencyId_Timestamp + "," +
                currentEval.Timestamp + "," +
                currentEval.UserIdBeingEvaluated + "," +
                studentUser.UserInfo["name"] + "," +
                studentUser.Cohort + "," +
                date + "," +
                timeFrame + "," +
                location + "," +
                competency.CompetencyTitle + "," +
                competencyId + "," +
                competency.Difficulty + "," +
                currentEval.EvaluationScore + "," +
                evaluator.UserInfo["name"] + "," +
                evaluator.Role + "," +
                currentEval.Evidence + "," +
                currentEval.Approved + "," +
                currentEval.Comments + "\n";
            csv = csv.concat(currentEvalString);
        }

        console.log(csv);
        //var f = new File(csv, "eval_output.txt", {type: "text/csv", lastModified: Date.now()});
        await putObjectToS3(csv);
       // var f = new File([""], "filename.txt", {type: "text/plain", lastModified: date})
        /*
        fs.writeFile('output.csv', csv, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });*/
        //let csv_file = CSV.write(csv);
        //CSV.wr

        //If there are more items after the provided ones (for example if a limit is set and this does not go to the end of the table)
        //then the response will return a LastEvaluatedKey, which can be passed back into the next call
        //as a ExclusiveStartKey in order to get the next 'page' of results.  This key is stringified and base-64 encoded
        //so that it can easily be passed back into the request to get the next page.  To get the next group of items,
        //it is expected that the user pass in the exact same key that is returned by the previous request as the ESK parameter
        if ("LastEvaluatedKey" in allEvals) {
            respBody.LastEvaluatedKey = Buffer.from(JSON.stringify(allEvals.LastEvaluatedKey),'binary').toString('base64');
        }
        //Construct the response
        response = {
            statusCode: 200,
            body: JSON.stringify(respBody),
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
 * Performs the API call on the table to get the results
 *
 * @param {Object} params - a JSON representation of the params for the get request
 *
 * @returns {Object} object - a promise representing this get request
 */
function getEvals(params) {
    return ddb.scan(params).promise();
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

function getSpecificComp(competencyId) {
    return ddb.get({
        TableName: COMPETENCIES_DDB_TABLE_NAME,
        Key:{
            "CompetencyId": competencyId
        }
    }).promise();
}

function putObjectToS3(data){
    var s3 = new AWS.S3();
    var params = {
        Bucket : "aws-sam-cli-managed-default-samclisourcebucket-1t2kf2py9cg1f",
        Key : "excel-competencies-tracking-sam-app/exports/" + Date.now() + "/out.csv",
        Body : data
    };
    s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}