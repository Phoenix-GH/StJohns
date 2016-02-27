var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
      //  alert(device.platform);
        var parseConfigApplicationKey = "wXdan9gZiUO0rvOHblqOiK4GnZpqRSY56MuThxBM";
        var parseConfigJavascriptKey = "RAmgQw4u4sDnMzdyBASFtKrALP9WYzcnGyUQvHE0";
        var parseConfigClientKey = "4rOvO5PkUYioDrvnBf2ih8yKY57yOYfSe87Hqfcr";
      //  alert('ready');
        try{
            window.parsePlugin.initialize(parseConfigApplicationKey, parseConfigClientKey, function() {
           //     alert('success');
                console.log('success');


            }, function(e) {
                console.log('error');
            });
            window.parsePlugin.getInstallationId(function(id) {
                installationID = id;
             //   alert(id);
                console.log(installationID);

            }, function(e) {
               // console.log("Error Getting ID: " + e.code + " : " + e.message);
            });
        }
        catch(err){
            //alert(err);
        }
        try{
            pushNotification = window.plugins.pushNotification;
            pushNotification.register(
                tokenHandler,
                errorHandler,
                {
                    "badge":"true",
                    "sound":"true",
                    "alert":"true",
                    "ecb":"onNotificationAPN"
                });
        }
        catch(err){
            console.log("Push n error.");

        }

        try {
            //reset badge no.
            window.plugins.pushNotification.setApplicationIconBadgeNumber(null, errorHandler, 0);
        }
        catch(err){

        }
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

    }
};
function tokenHandler(result)
{
    //alert(result);
}
app.initialize();