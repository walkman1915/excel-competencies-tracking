let response;

const auth = require('/opt/auth');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const COMPETENCIES_DDB_TABLE_NAME= process.env.COMPETENCIES_DDB_TABLE_NAME; 

/* Hardcoding valid inputs */
const VALID_DOMAINS = ["TRANSPORTATION", "EMPLOYMENT_AND_CAREERS", "HEALTH_AND_WELLNESS", "FINANCIAL_LITERACY", "HOUSING", "SOCIAL_AND_LEADERSHIP", "TECHNOLOGY_AND_COMMUNICATION"];
const VALID_DIFFICULTY = ["1", "2", "3", "4"];
const VALID_FREQUENCIES = ["MONTHLY", "SEMESTERLY", "YEARLY"];
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

		const competencyId = requestBody.CompetencyId;
		if (!("CompetencyId" in requestBody) || competencyId == "") {
			response = {
				statusCode: 400,
				body: "This request is missing a necessary parameter - CompetencyId.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		} else if (!/^\d+$/.test(competencyId)) {
			response = {
				statusCode: 400,
				body: "This request must contain a non-empty CompetencyId with only numeric characters. You entered : " + competencyId,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}
		
        const competencyTitle = requestBody.CompetencyTitle;
		if (!("CompetencyTitle" in requestBody) || competencyTitle == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - CompetencyTitle.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}
		
		const domain = requestBody.Domain;
		if (!("Domain" in requestBody) || domain == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - Domain.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		} else if (!VALID_DOMAINS.includes(domain)) {
			response = {
				statusCode: 400,
				body: "This request must contain a pre-defined domain. You entered : " + domain + "; but the only valid options are " + VALID_DOMAINS.toString(),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}

		const subcategory = requestBody.Subcategory;
		if (!("Subcategory" in requestBody) || subcategory == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - Subcategory.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}

		const difficulty = requestBody.Difficulty;
		if (!("Difficulty" in requestBody) || difficulty == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - Difficulty.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		} else if (!VALID_DIFFICULTY.includes(difficulty)) {
			response = {
				statusCode: 400,
				body: "This request must contain a pre-defined domain. You entered : " + difficulty + "; but the only valid options are " + VALID_DIFFICULTY.toString(),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}


		const evaluationFrequency = requestBody.EvaluationFrequency;
		if (!("EvaluationFrequency" in requestBody) || evaluationFrequency == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - EvaluationFrequency.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		} else if (!VALID_FREQUENCIES.includes(evaluationFrequency)) {
			response = {
				statusCode: 400,
				body: "This request must contain a pre-defined domain. You entered : " + evaluationFrequency + "; but the only valid options are " + VALID_FREQUENCIES.toString(),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}

        // Since unique evaluation is future work it's optional
        const uniqueEvaluationScale = ("UniqueEvaluationScale" in requestBody && requestBody.UniqueEvaluationScale != "")  ? requestBody.UniqueEvaluationScale : null;
        
        // Construct the competency object to store in the database
        const competency = {
            CompetencyId : competencyId,
			CompetencyTitle : competencyTitle,
            Domain : domain,
            Subcategory: subcategory,
            Difficulty: difficulty,
            EvaluationFrequency: evaluationFrequency,
			UniqueEvaluationScale : uniqueEvaluationScale
        }

		// Put the user in the database
		await addComp(competency);

		// Generate the response for a successful post
		response = {
			statusCode: 201,
			body: JSON.stringify(competency),
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
 * Competencies object  follows the format in the Database Table Structures document
 * @param {Object} competency - JSON object representing a competency to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addComp(competency) {
    return ddb.put({
        TableName: COMPETENCIES_DDB_TABLE_NAME,
        Item: competency,
    }).promise();
}