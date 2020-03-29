let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template
const COMPETENCIES_DDB_TABLE_NAME = process.env.COMPETENCIES_DDB_TABLE_NAME;
const USERS_DDB_TABLE_NAME = process.env.USERS_DDB_TABLE_NAME;
const TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME = process.env.TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME;
const EXPORT_EVALUATION_BUCKET = process.env.EXPORT_EVALUATION_BUCKET;

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
        let csv = "Transaction Id,Time Stamp,Student User Id,Student Name,Cohort,Date Evaluated,Time Frame," +
            "Location,Competency Evaluated,Competency Id,Level,Evaluation Score,Evaluator Name,Evaluator Role," +
            "Evidence,Approved,Comments\n";

        ///Instantiate the parameters that will be used for the get request
        //QueryInput doc: https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Types/QueryInput.html
        let params = AWS.DynamoDB.QueryInput = {
            TableName: EVALUATIONS_DDB_TABLE_NAME
        };

        //Use the provided parameters to make the get API request
        const allEvals = await getEvals(params);

        // Generate the response body for a successful get
        let respBody = {};
        respBody.Items = allEvals.Items; //Gets the actual items from the call

        for (let i = 0; i < allEvals.Items.length; i++) {
            let currentEval = allEvals.Items[i];
            let location = "WHERE IS THIS STORED?";
            // Data not requiring table look ups
            let transactionId = (currentEval.hasOwnProperty("CompetencyId_Timestamp"))
                ? currentEval.CompetencyId_Timestamp : "";
            let timestamp = (currentEval.hasOwnProperty("Timestamp")) ? currentEval.Timestamp : "";
            let evaluationScore = (currentEval.hasOwnProperty("EvaluationScore"))
                ? currentEval.EvaluationScore : "";
            let evidence = (currentEval.hasOwnProperty("Evidence")) ? currentEval.Evidence : "";
            let approved = (currentEval.hasOwnProperty("Approved")) ? currentEval.Approved : "";
            let comments = (currentEval.hasOwnProperty("Comments")) ? currentEval.Comments : "";
            // Evaluation time frame / date data
            let timeFrame = "";
            let date = "";
            if (currentEval.hasOwnProperty("DateEvaluated")) {
                let datesplit = currentEval.DateEvaluated.match("^[^T]+(?=T)");
                if (datesplit != null) {
                    datesplit = datesplit[0].split("-");
                    // month indexes starting at 0, change so January == 1
                    let month = "" + (parseInt(datesplit[1]) + 1);
                    if (month.length === 1) month = "0" + month;
                    date = /* year */ datesplit[0] + "-" + month + "-" + /* day */ datesplit[2];
                    timeFrame = /* year */ datesplit[0];
                    if (month !== "" && parseInt(month) < 6) {
                        timeFrame = "Spring " + timeFrame;
                    } else {
                        timeFrame = "Fall " + timeFrame;
                    }
                }
            }
            // Student being eval-ed data
            let studentUserName = "";
            let studentUserCohort = "";
            let userIdBeingEvaluated = "";
            if (currentEval.hasOwnProperty("UserIdBeingEvaluated")) {
                userIdBeingEvaluated = currentEval.UserIdBeingEvaluated;
                let studentUser = (await getSpecificUser(userIdBeingEvaluated));
                if (!isEmptyObject((studentUser))) {
                    studentUser = studentUser.Item;
                    studentUserName = studentUser.hasOwnProperty("UserInfo") ? studentUser.UserInfo["name"] : "";
                    studentUserCohort = studentUser.hasOwnProperty("Cohort") ? studentUser.Cohort : "";
                }
            }
            // Evaluator data
            let evaluatorName = "";
            let evaluatorRole = "";
            if (currentEval.hasOwnProperty("UserIdEvaluator")) {
                let evaluator = (await getSpecificUser(currentEval.UserIdEvaluator));
                if (!isEmptyObject((evaluator))) {
                    evaluator = evaluator.Item;
                    evaluatorName = evaluator.hasOwnProperty("UserInfo") ? evaluator.UserInfo["name"] : "";
                    evaluatorRole = evaluator.hasOwnProperty("Role") ? evaluator.Role : "";
                }
            }
            // Competency data
            let competencyIdArr = transactionId.match("^[^_]+(?=_)");
            let competencyId = (competencyIdArr == null) ? transactionId : competencyIdArr[0];
            let competency = (await getSpecificComp(competencyId));
            let competencyTitle = "";
            let competencyDifficulty = "";
            if (!isEmptyObject((competency))) {
                competency = competency.Item;
                competencyTitle = competency.hasOwnProperty("CompetencyTitle") ? competency.CompetencyTitle : "";
                competencyDifficulty = competency.hasOwnProperty("Difficulty") ?  competency.Difficulty : "";
            }

            let currentEvalString =
                transactionId + "," +
                timestamp + "," +
                userIdBeingEvaluated + "," +
                studentUserName + "," +
                studentUserCohort + "," +
                date + "," +
                timeFrame + "," +
                location + "," +
                competencyTitle + "," +
                competencyId + "," +
                competencyDifficulty + "," +
                evaluationScore + "," +
                evaluatorName + "," +
                evaluatorRole + "," +
                evidence + "," +
                approved + "," +
                comments + "\n";
            csv = csv.concat(currentEvalString);
        }

        console.log(csv);
        await putObjectToS3(csv); // this does nothing currently, i think

        console.log("successful upload!!!?!?!?");

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
        // these params are all super wrong, btw
        Bucket : EXPORT_EVALUATION_BUCKET,
        //Key : "excel-competencies-tracking-sam-app/exports/" + Date.now() + "/out.csv",
        Key: "export1.csv",
        Body : data
    };
    // return s3.putObject(params, function(err, data) {
    //     if (err) {
    //         console.log(err, err.stack); // an error occurred
    //     } else {
    //         console.log("SUCCESSFUL UPLOAD");

    //     }     console.log(data);           // successful response
    // }).promise();
    return s3.putObject(params).promise();
}

/**
 * Checks if the provided JSON object is empty {} or not
 * @param {JSON} obj - The object to check for emptiness
 *
 * @returns {boolean} True if this JSON object is empty, false if it is not empty
 */
function isEmptyObject(obj) {
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}