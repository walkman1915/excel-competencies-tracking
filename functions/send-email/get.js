var aws = require('aws-sdk');
var nodemailer = require('nodemailer');

var ses = new aws.SES();
var s3 = new aws.S3();

function getS3File(bucket, key) {
    return new Promise(function (resolve, reject) {
        s3.getObject(
            {
                Bucket: bucket,
                Key: key
            },
            function (err, data) {
                if (err) return reject(err);
                else return resolve(data);
            }
        );
    })
}

exports.handler = function (event, context, callback) {

    getS3File('excel-competencies-track-evaluationsexports3bucke-xmp154eiitun', 'export/DummyData.csv')
        .then(function (fileData) {
            var mailOptions = {
                from: 'xavier17victor@gmail.com',
                subject: 'This is an email sent from a Lambda function!',
                html: `<p>You got a contact message from: <b>${event.emailAddress}</b></p>`,
                to: 'xavier17victor@gmail.com',
                // bcc: Any BCC address you want here in an array,
                attachments: [
                    {
                        filename: "A Dumb CSV File.csv",
                        content: fileData.Body
                    }
                ]
            };

            console.log('Creating SES transporter');
            // create Nodemailer SES transporter
            var transporter = nodemailer.createTransport({
                SES: ses
            });

            // send email
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err);
                    console.log('Error sending email');
                    callback(err);
                } else {
                    console.log('Email sent successfully');
                    callback();
                }
            });
        })
        .catch(function (error) {
            console.log(error);
            console.log('Error getting attachment from S3');
            callback(error);
        });
};
