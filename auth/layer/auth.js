/**
 * Verifies that the event contains an authorizer with some claims
 * @param {Object} event the event object from the lambda
 * @returns the error response that should be returned if the authorizer is incorrect,
 * else returns null to indicate success
 */
module.exports.verifyAuthorizerExistence = function verifyAuthorizerExistence(event) {
    console.log(event.requestContext);
    if (!("authorizer" in event.requestContext) || !("claims" in event.requestContext.authorizer)) {
        response = {
            statusCode: 401,
            body: "Authorization is missing from request",
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
        return response;
    }
    return null;
}
/**
 * Verifies that the claims included in the authorizer contain an authorized role
 * @param {Object} event the event object from the lambda
 * @param {Object} validRoles the list of valid roles for this action
 * @returns the error response that should be returned if the user does not have the correct role,
 * else returns null to indicate success
 */
module.exports.verifyValidRole = function verifyValidRole(event, validRoles) {
    if (!("custom:role" in event.requestContext.authorizer.claims)) {
        response = {
            statusCode: 403,
            body: "User does not have any assigned role",
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
        return response;
    }
    const role = event.requestContext.authorizer.claims['custom:role'];
    if (!validRoles.includes(role)) {
        response = {
            statusCode: 403,
            body: "User role is not permitted to perform this action. Role " + role 
            + " must be one of " + validRoles.toString(),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
        return response;
    }
    return null;
}