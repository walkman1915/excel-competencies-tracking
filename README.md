# Excel Competencies Tracking 

This describes the resources that make up the Excel Competencies Tracking System REST API v0. The Excel Program at Georgia Tech is a 4-year program for students with intellectual and developmental disabilities to develop life skills. This API provides a way to create, manage, export users and tracking data associated with the Excel Program.

## Revelant Terms

#### Competency
A demonstratable skill or knowledge achieved by a student. Each competency is associated with a domain and has a fixed evaluation schedule. Professors, __mentors__, and __coaches__ can input competency evaluations for students.

#### Tracking Location
A class, seminar, job, or other location that is associated with progress towards a compentency. Students and evaluators may be associated with one or more tracking location. 

#### Evaluation
Formal record of a student's progress towards a competency. 

#### Mentor

#### Coach

## Authentication

To be determined.

## API Calls

### Evalutaions 

#### Adding an Evaluation

You can add an evaluation by sending a POST request to the following address: <TBD>. In the body of the request there should be a JSON block of the following format. 
  
```json
 {
   "UserId": "jdoe",
   "CompetencyId": "T6",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Comments": "Wonderful student!",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
_Please see below for an explaination of each parameter used above._

__UserId__ : (String, Required) The identification number of the user being evaluated. Must be a student.

__CompetencyId__: (String, Required)  The identification tag of the competency being evaluated. View [Excel Tracking Table]() for a list of Competency Ids.

__Year__: (String, Required)  Year this evaluation is being submitted for.

__Month__: (String, Required)  Month this evaluation is being submitted for.

__Day__: (String, Required)  Day this evaluation is being submitted for.

__UserIdEvaluator__: (String, Required) The identification number of the user evaluating. Must not be a student.

__EvaluationScore__: (String, Required)  The numeric score that user received in the evalutation. View [Evaluation Score Table]()for a list of qualitative and competency speficic descriptions of these scores.

__Comments__: (String, Optional)  Additional comments made by evaluator.

__Evidence__: (String, Required) The mode of data that led to the evaluation. 

__Approved__: (Boolean, Required) Indicates whether an administrator as approved this evaluation.

Once a request has been recieved it will give back Status Code 200, input the data in our database, and return a JSON block matching the data was entered in the sent body.
