let response;

const auth = require('/opt/auth');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

/*CONSTANT VALUES */
const validEvalScores = ["0", "1", "2", "3", "4", "N"];
const validEvidence = ["Direct observation", "Assessment", "Report from employer", "Report from coach"];
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
        console.log(event.requestContext);
        let indicator = auth.verifyAuthorizerExistence(event);
        if (indicator != null) {
            return indicator;
        }
        indicator = auth.verifyValidRole(event, validRoles);
        if (indicator != null) {
            return indicator;
        }



        const requestBody = JSON.parse(event.body);
        
        // Information from the POST request needed to add a new evaluation
        if (!("UserId" in requestBody) || requestBody.UserId == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'UserId' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const userId = requestBody.UserId;

        if (!("CompetencyId" in requestBody) || requestBody.CompetencyId == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'CompetencyId' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const compId = requestBody.CompetencyId;

        let now = new Date();
        const timeStamp = now.toISOString();

        const comp_stamp = compId + "_" + timeStamp;

        if (!("Year" in requestBody) || requestBody.Year == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Year' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const year = requestBody.Year;

        if (!("Month" in requestBody) || requestBody.Month == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Month' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        //Note, the date is indexed at 0, so 11 is December, 10 is November, etc.
        const month = requestBody.Month;

        if (!("Day" in requestBody) || requestBody.Day == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Day' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        //The day is not indexed at 0, a day of 6 is the 6th of the month
        const day = requestBody.Day;

        const evalTime = new Date(year, month, day);
        const dateEvaluated = evalTime.toISOString();
        if (evalTime > now) {
            response = {
                statusCode: 400,
                body: "Given time of evaluation is in the future",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        if (!("UserIdEvaluator" in requestBody) || requestBody.UserIdEvaluator == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'UserIdEvaluator' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const userIdEvaluator = requestBody.UserIdEvaluator;

        if (!("EvaluationScore" in requestBody) || requestBody.EvaluationScore == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'EvaluationScore' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const evalScore = requestBody.EvaluationScore;
        if (!(validEvalScores.includes(evalScore))) {
            response = {
                statusCode: 400,
                body: "Evaluation score was not valid, given value: '" + evalScore + "'. Expected values: " + validEvalScores.toString(),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        //TODO: Should comments be optional, or at least allowed to be blank?
        if (!("Comments" in requestBody) || requestBody.Comments == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Comments' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const comments = requestBody.Comments;

        if (!("Evidence" in requestBody) || requestBody.Evidence == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Evidence' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const evidence = requestBody.Evidence;
        if (!(validEvidence.includes(evidence))) {
            response = {
                statusCode: 400,
                body: "Evidence was not valid, given value: '" + evidence + "'. Expected values: " + validEvidence.toString(),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        if (!("Approved" in requestBody) || requestBody.Approved == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Approved' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const approved = requestBody.Approved;


        // Construct the eval object to store in the database
        const eval = {
            UserIdBeingEvaluated: userId,
            CompetencyId_Timestamp: comp_stamp,
            Timestamp: timeStamp,
            UserIdEvaluator: userIdEvaluator,
            DateEvaluated: dateEvaluated,
            EvaluationScore: evalScore,
            Comments: comments,
            Evidence: evidence,
            Approved: approved
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

// /**
//  * Verifies that the event contains an authorizer with some claims
//  * @param {Object} event the event object from the lambda
//  * @returns the error response that should be returned if the authorizer is incorrect,
//  * else returns null to indicate success
//  */
// function verifyAuthorizerExistence(event) {
//     if (!("authorizer" in event.requestContext) || !("claims" in event.requestContext.authorizer)) {
//         response = {
//             statusCode: 401,
//             body: "Authorization is missing from request",
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     return null;
// }

// function verifyValidRole(event, validRoles) {
//     if (!("custom:role" in event.requestContext.authorizer.claims)) {
//         response = {
//             statusCode: 403,
//             body: "User does not have any assigned role",
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     const role = event.requestContext.authorizer.claims['custom:role'];
//     if (!validRoles.includes(role)) {
//         response = {
//             statusCode: 403,
//             body: "User role is not permitted to perform this action. Role " + role 
//             + " must be one of " + validRoles.toString(),
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     return null;
// }