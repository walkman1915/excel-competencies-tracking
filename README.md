# Excel Competencies Tracking 

This describes the resources that make up the Excel Competencies Tracking System REST API v0. The Excel Program at Georgia Tech is a 4-year program for students with intellectual and developmental disabilities to develop life skills. This API provides a way to create, manage, export users and tracking data associated with the Excel Program.

For quick access to the following sections, select the hyperlinks below.
1. [Revelant Terms](#revelant-terms)
2. [API Calls For Evaluations](#evaluations)
3. [API Calls For Users & User Relationships]()
4. [API Calls For Competencies]()
5. [API Calls For TrackingLocations]()
6. [Full API Tree](#api-tree)

## Relevant Terms

#### Competency
A demonstratable skill or knowledge achieved by a student. Each competency is associated with a domain and has a fixed evaluation schedule. Professors, __mentors__, and __coaches__ can input competency evaluations for students.

#### Tracking Location
A class, seminar, job, or other location that is associated with progress towards a compentency. Students and evaluators may be associated with one or more tracking location. 

#### Evaluation
Formal record of a student's progress towards a competency. 

#### Mentor

#### Coach

# Authentication

To be determined.

# API Calls

## Evaluations 

### Useful Parameters

_The following data parameters describe the sort information contained in an Evaluation entry._

- __UserId__ : (String, Required) The identification number of the user being evaluated. Must be a student.

- __CompetencyId__: (String, Required)  The identification tag of the competency being evaluated. View [Excel Tracking Table]() for a list of Competency Ids.

- __Year__: (String, Required)  Year this evaluation is being submitted for.

- __Month__: (String, Required)  Month this evaluation is being submitted for.  This is indexed at 0, so month 0 is January, 1 is February, etc.

- __Day__: (String, Required)  Day this evaluation is being submitted for.

- __UserIdEvaluator__: (String, Required) The identification number of the user evaluating. Must not be a student.

- __EvaluationScore__: (String, Required)  The numeric score that user received in the evalutation. View [Evaluation Score Table]() for a list of qualitative and competency speficic descriptions of these scores.

- __Comments__: (String, Optional)  Additional comments made by evaluator.

- __Evidence__: (String, Required) The mode of data that led to the evaluation. 

- __Approved__: (Boolean, Required) Indicates whether an administrator as approved this evaluation.

### Adding an Evaluation

You can add an evaluation by sending a POST request to the following address: <TBD>. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
 {
   "UserId": "jdoe",
   "CompetencyId": "T6",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. Such as the example below. Note an optional data parameter, "Comments" was defaulted to being empty.
```json
 {
   "UserId": "jdoe",
   "CompetencyId": "T6",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Comments": "",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
### Errors 

If a required data field is missing, the request will return a __Status Code 400__: Bad Request and the body of this response will contain a detailed message about which parameter was missing, malformed, or of the wrong type. For example consider the following input, which is missing the required parameter "CompetencyId".
```json
 {
   "UserId": "jdoe",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
In addition to receiving a Status Code 400 response, the reponse's body would contain the following message.
```
  "Required body argument 'CompetencyId' was not specified"
```
[Back To Top](#excel-competencies-tracking)

# API Tree
```
/competencies
   GET  [Get all competencies]
   POST [Add a new competency]
   /{competencyId}
       GET    [Get a specific competency given its id]
       DELETE [Delete a specific competency given its id]
/evaluations
   GET  [Get all evaluations]
   POST [Add a new evaluation]
   /{userId}
       GET  [Get all evaluations for a given specific user]
       /{compId}
           GET  [Get all evaluations for a given specific user and specific competency]
           /{timeStamp}
               GET    [Get all evaluations for a given specific user, specific competency, and specific time stamp]
               DELETE [Delete all evaluations for a given specific user, specific competency, and specific time stamp]
/evaluation_scale
    GET   [Get the evaluation scale]
    POST  [Add a new evaluation scale item]
/tracking_locations_to_competencies
    GET   [Get all tracking locations]
    POST  [Add a new tracking location]
    /{locationId}
        GET    [Get a specific tracking locations given its id]
        DELETE [Delete a specific tracking locations given its id]
/users
    POST   [Add a new user]
    /{userID}
        GET    [Get a specific user given their id]
        DELETE [Delete a specific user given their id]
```
