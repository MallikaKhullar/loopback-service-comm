'use strict';

var FCM = require('fcm-push');
var serverKey = 'put-your-server-key-here';

var fcm = new FCM(serverKey);

module.exports = function(Notification) {

    const sendSingleNotification = (fcmId, email, title, body, imageUrl) => {
        
        return Notification.create({fcmId, email, title, body, imageUrl})
            .then(() => {
                var message = {
                    to: fcmId,
                    notification: {
                        title: title,
                        body: body,
                        image: imageUrl,
                        priority: "high"
                    }
                }

                console.log(message)
                
                return fcm.send(message, function(err, response){
                    if (err) {
                        return {success:0, err:err}
                    } else {
                        return {data:response, success:0}
                    }
                })

            })
            .catch ((err) => {
                console.log(err)
                return err
            });
    }

    const sendAllNotifications = async(employees, title, body, imageUrl, fn) => {
        var finalArray = employees.map(async(employee) => {
            return await fn(employee.fcmId, employee.email, title, body, imageUrl)
        })

        return await Promise.all(finalArray)
    }

    const sendNotificationToBatch = async(employees, title, body, imageUrl) => {
        var allNotificationsObjects = await sendAllNotifications(employees, title, body, imageUrl, sendSingleNotification)

        return allNotificationsObjects == undefined || allNotificationsObjects == null || allNotificationsObjects.length == 0 
        ? {
            success: 0,
            error: "Could not push notifications"
        } : {
            success: 1,
            data: allNotificationsObjects
        }
    }

    Notification.sendNotificationToFcmIds = async(req) => {

        if (req.employees == undefined || req.employees == null || req.title == undefined || req.title == null) {
            console.log("Can't send notification: Not enough params")
            return {success: 0}
        }

        return sendNotificationToBatch(req.employees, req.title, req.body, req.imgUrl)
        
    };

    Notification.remoteMethod('sendNotificationToFcmIds', {
        accepts: [
            // pass the request object to remote method
            { arg: 'req', type: 'object', http: { source: 'body' } }
        ],
        returns: {
            arg: 'response',
            type: 'Object',
            root: true
        },
        http: { path: '/sendNotificationToFcmIds', verb: 'post' },
    })

}