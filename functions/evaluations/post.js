let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

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
        // Information from the POST request needed to add a new user
        const userId = requestBody.UserId;

        const compId = requestBody.CompetencyId;

        let now = new Date();
        const timeStamp = now.toISOString();

        const comp_stamp = compId + "_" + timeStamp;

        const year = requestBody.Year;
        //Note, the date is indexed at 0, so 11 is December, 10 is November, etc.
        const month = requestBody.Month;
        //The day is not indexed at 0, a day of 6 is the 6th of the month
        const day = requestBody.Day;

        const evalTime = new Date(year, month, day);
        const dateEvaluated = evalTime.toISOString();

        const userIdEvaluator = requestBody.UserIdEvaluator;

        const evalScore = requestBody.EvaluationScore;

        const comments = requestBody.Comments;

        const evidence = requestBody.Evidence;
        
        // Construct the eval object to store in the database
        const eval = {
            UserIdBeingEvaluated: userId,
            CompetencyId_Timestamp: comp_stamp,
            Timestamp: timeStamp,
            UserIdEvaluator: userIdEvaluator,
            DateEvaluated: dateEvaluated,
            EvaluationScore: evalScore,
            Comments: comments,
            Evidence: evidence
        }

        // Put the evaluation in the database
        await addEval(eval);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(eval),
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
 * Eval object follows the format in the Database Table Structures document
 * @param {Object} eval - JSON object representing a new evaluation to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addEval(eval) {
    return ddb.put({
        TableName: EVALUATIONS_DDB_TABLE_NAME,
        Item: eval,
    }).promise();
}