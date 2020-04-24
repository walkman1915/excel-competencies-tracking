let response;


const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID;
const USER_POOL_CLIENT = process.env.USER_POOL_CLIENT;

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
        

        // grab request body
        const requestBody = JSON.parse(event.body);

        

        // Information from the POST request needed to login
        const username = requestBody.Username;
        const password = requestBody.Password;
        params = {
            "UserPoolId": USER_POOL_ID,
            "ClientId": USER_POOL_CLIENT,
            "AuthFlow": "ADMIN_NO_SRP_AUTH",
            "AuthParameters": {
                "USERNAME": username,
                "PASSWORD": password
            }
        }
        let request = cognitoidentityserviceprovider.adminInitiateAuth(params);
        console.log(await request.promise());
        let tokens;
        await request.send(function(err, data) {
            console.log(err);
            console.log(data)
            tokens = data;
        });

        

        // Generate the response for a successful post
        response = {
            statusCode: 200,
            body: tokens.AuthenticationResult.IdToken,
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
