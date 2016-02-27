console.log(Date() + " Load started");
var clickEvent = 'tap';
enableClick = true;
var cachedData = {};
var touchStartPos;
var pushNotification;
var initialLoad = true;
var cbc = {
    installationId: "",
    hidingCard: "",
    activeCard: "",
    activeCardId: "",
    isBack: false,
    activeRecord: null,
    fixPhone: function(phone){
        console.log("Input: " + phone);
        if(phone.substr(0,3) == "+61"){
            phone = "0" + phone.substr(3);
        }
        if(phone.length == 10){
            if(phone.substr(0,2) == "04" || phone.substr(0,4) == "1300" || phone.substr(0,4) == "1800"){

                phone = phone.substr(0,4) + " " + phone.substr(4,3) + " " + phone.substr(7,3);
            }
            else{
                phone = phone.substr(0,2) + " " + phone.substr(2,4) + " " + phone.substr(6,4);
            }

        }
        console.log("Output: " + phone);
        return phone;
    },
    userMessage: function(message){
        alert(message);
    },
    openDrivingDirections: function(lat,lng){

        //window.location.href =  "geo:" + lat + "," + lng + "";
        //window.location.href = "https://maps.google.com/?daddr=" + lat + "," + lng + "";
        try{
            var devicePlatform = device.platform;
            if(devicePlatform == "Android"){
                window.plugins.webintent.startActivity({
                        action: window.plugins.webintent.ACTION_VIEW,
                        //url: 'geo:0,0?q=' + lat + "," + lng},
                        url: 'http://maps.google.com/maps?daddr='+lat+','+lng},
                    function() {},
                    function() {alert('Failed to open URL via Android Intent')});
            }
            else{
                //iOS
                window.location.href = "maps://maps.apple.com/?q="+lat+","+lng;
            }
        }
        catch(ex){
            //not on a device!
            window.location.href = 'http://maps.google.com/maps?daddr='+lat+','+lng;
        }


    },
    showCard: function(cardId, isBack, extraInfo){
        if(cardAttributes.length == 0){
            loadCards();
        }
        var attributes = cardAttributes[cardId];
        if(isBack){
            if(history.state != undefined){

                attributes.extraInfo = history.state.extraInfo;
            }
        }
        else{
            attributes.extraInfo = extraInfo;
        }


        var header = null;
        var jqCard = $(attributes.cardId);
        cbc.activeCardId = attributes.cardId;
        if(cbc.activeCard != ""){
            cbc.hidingCard = cbc.activeCard;
            cbc.hidingCard.css({'z-index': '1'});
        }

        cbc.activeCard = jqCard;
        cbc.activeCard.css({'z-index': '10001'});
        $(".header").hide();
        $(".header").removeClass("show-action-button");
        $(".card").hide();
        if(attributes.showHeader == true){
            if(attributes.canGoBack == true){
                header = $(".header-with-back");
            }
            else{
                header = $(".header-no-back");
            }
            if(attributes.header == ""){
                header.children(".title").html("&nbsp;");
            }
            else{
                header.children(".title").text(attributes.header);
            }
            header.show();
        }
        if(typeof(attributes.actionBtnText) != "undefined" && attributes.actionBtnText != ""){
            $(".action-btn").text(attributes.actionBtnText);
            $(".header").addClass("show-action-button");
        }
        if(attributes.showFooter == true){
            $(".footer").show();
        }
        else{
            $(".footer").hide();
        }

        //$(".card").hide();
        if(attributes.animation == "fade"){
            jqCard.fadeIn(200);
        }
        if(attributes.animation == "slideBottom"){
            jqCard.css({top: "100%"});
            jqCard.show();
            jqCard.animate({top: "0px"}, 200);
            cbc.log("Animating " + attributes.header + " from bottom.");
        }
        if(cbc.hidingCard != ""){
            cbc.hidingCard.hide();
        }


        //card specific code to run.
        if(cardId == "welcome" && Parse.applicationId){
            parseLoad.reloadCachedData();
        }
        if(cardId == "eventRSVP"){
            $(".header-with-back > .title").text(cbc.activeRecord.attributes.EventName);
            var templateHTML = $("#eventRSVPTemplate").html();
            var tpl = _.template(templateHTML);
            $("#eventRSVP").html("");
            var compiled = tpl({object: event});
            $("#eventRSVP").append(compiled);

            //has user already RSVP'd for this event?

            var existingRSVP = null;
            //was there already an RSVP for this device/event?
            _.each(cachedData.rsvps, function(rsvp){
                if(rsvp.attributes.deviceToken == cbc.installationId && rsvp.attributes.eventObjectId == cbc.activeRecord.id){
                    //there is already an RSVP.

                    existingRSVP = rsvp;
                }
            });

            if(existingRSVP){
                navigator.notification.confirm("You have already RSVP'd for this event. Update response or delete previous RSVP?", function(button){
                    switch(button){
                        case 1:
                            existingRSVP.destroy();
                            alert("Your RSVP was deleted.");
                            $("#RSVP_form_name").val("");
                            $("#RSVP_form_number").val("");
                            parseLoad.reloadCachedData();
                            break;
                        case 2:
                            cbc.log("User chose to update - program will update existing.");
                            $("#RSVP_form_name").val(existingRSVP.attributes.name);
                            $("#RSVP_form_number").val(existingRSVP.attributes.number);
                            break;
                    }
                }, "Warning", "Delete,Update");
            }



        }
        if(cardId=="sports")
        {


        }
        if(cardId == "teamDetail"){
            $(".rangeSelector").attr("data-show","7days");
            $(".rangeSelector").html("Show All");

            $(".header-with-back > .title").text(attributes.extraInfo.text);
            $("#teamDetailList").html("<li class='list-group-item'>Loading...</li>");
            parseLoad.teamDetail(window.localStorage['sport'],extraInfo.text);
            var isSubscribed = false;
            if(cachedData.subscriptions != undefined){
                $.each(cachedData.subscriptions,function(index, sub){
                    if(sub === attributes.extraInfo.text){
                        isSubscribed = true;
                    }
                });
            }

            if(isSubscribed){
                $(".action-btn").text("Unsubscribe");
            }
            else{
                $(".action-btn").text("Subscribe");
            }
            $(".header").removeClass("show-action-button");
        }
        if(cardId == "sportsDetail"){
            window.localStorage['sport']=attributes.extraInfo.text;
            $(".header-with-back > .title").text(attributes.extraInfo.text);
            $("#sportsDetailList").html("<li class='list-group-item'>Loading...</li>");
            parseLoad.sportsDetail(attributes.extraInfo.text);
            var isSubscribed = false;
            if(cachedData.subscriptions != undefined){
                $.each(cachedData.subscriptions,function(index, sub){
                    if(sub === attributes.extraInfo.text){
                        isSubscribed = true;
                    }
                });
            }

            if(isSubscribed){
                $(".action-btn").text("Unsubscribe");
            }
            else{
                $(".action-btn").text("Subscribe");
            }
            $(".header").addClass("show-action-button");
        }
        if(cardId == "contactsDetail"){
            $(".header-with-back > .title").text(attributes.extraInfo.text);
            var contact = _.findWhere(cachedData.contacts, {id: attributes.extraInfo.objectId});
            if(contact != undefined){
                cbc.activeRecord = contact;

                if(!contact.attributes.phone_fixed){
                    contact.attributes.PhoneNumber = cbc.fixPhone(contact.attributes.PhoneNumber);
                }
                var templateHTML = $("#ContactsDetailTemplate").html();
                var tpl = _.template(templateHTML);
                $("#contactsDetail").html("");
                var compiled = tpl({object: contact});
                $("#contactsDetail").append(compiled);

                var $img = $("#contactsDetail").find("img");
                var wh = $(window).height();
                var mapTop = $img.position().top;
                var mapH = $(window).height() - $img.position().top+10;
                $img.css({height: mapH});
            }
        }
        if(cardId == "eventDetail"){
            $(".header-with-back > .title").html("&nbsp;");
            var event = _.findWhere(cachedData.events, {id: attributes.extraInfo.objectId});
            if(event != undefined){
                cbc.activeRecord = event;
                var templateHTML = $("#eventDetailTemplate").html();
                var tpl = _.template(templateHTML);
                $("#eventDetail").html("");
                var compiled = tpl({object: event});
                $("#eventDetail").append(compiled);

            }
            else{
                parseLoad.events();
                window.setTimeout(function(){
                    var event = _.findWhere(cachedData.events, {id: attributes.extraInfo.objectId});
                    if(event != undefined){
                        cbc.activeRecord = event;
                        var templateHTML = $("#eventDetailTemplate").html();
                        var tpl = _.template(templateHTML);
                        $("#eventDetail").html("");
                        var compiled = tpl({object: event});
                        $("#eventDetail").append(compiled);
                    }},2000);
            }
        }


        if(!isBack){
            attributes.extraInfo = extraInfo;
            history.pushState(attributes,attributes.header,"index.html?page=" + attributes.url);
        }
    },
    log: function(message){
        //alert(message);
        console.log(message);
    }
};


var parseLoad = {
    reloadCachedData: function(){
        parseLoad.sports();
        parseLoad.contacts();
        parseLoad.maps();
        parseLoad.messages();
        parseLoad.events();
        parseLoad.cacheSubscriptions();
        parseLoad.cacheRSVPs();
    },
    subscribeAppleInit: function(){
        try{
            var channel = "device";
            cbc.log("attempting subscribe to " + channel);
            window.parsePlugin.subscribe(channel, function() {
                cbc.log('subscribed');
                parseLoad.cacheSubscriptions();
            }, function(e) {
                cbc.log('could not subscribe.');
                parseLoad.cacheSubscriptions();
            });
        }
        catch(ex){
            cbc.log(ex.message);
        }
    },
    subscribe: function(channel){
        try{
            cbc.log("attempting subscribe to " + channel);
            window.parsePlugin.subscribe(channel, function() {
                cbc.log('subscribed');
                $(".action-btn").text("Unsubscribe");
                parseLoad.cacheSubscriptions();
            }, function(e) {
                cbc.log('could not subscribe.');
            });
        }
        catch(ex){
            cbc.log(ex.message);
        }
    },
    unsubscribe: function(channel){
        try{
            cbc.log("attempting unsubscribe to " + channel);
            window.parsePlugin.unsubscribe(channel, function() {
                cbc.log('unsubscribed');
                parseLoad.cacheSubscriptions();
                $(".action-btn").text("Subscribe");
            }, function(e) {
                cbc.log('could not unsubscribe.');
            });
        }
        catch(ex){
            cbc.log(ex.message);
        }
    },
    cacheRSVPs: function(){
        try {
            cbc.log("attempting to cache RSVPs.");
            var myRSVPs = Parse.Object.extend('EventsRSVP');
            var rsvpQuery = new Parse.Query(myRSVPs);
            rsvpQuery.find({
                success: function(results){
                    cbc.log("Loaded all RSVPs.");
                    cachedData.rsvps = results;
                    _.each(results, function(result){
                        cbc.log(result.attributes);
                    })
                },
                error: function(error){
                    cbc.log(error);
                }
            });
        }
        catch(ex){

        }
    },
    cacheSubscriptions: function(){
        try{
            cbc.log("Loading list of subs.");
            window.parsePlugin.getSubscriptions(function(subscriptions) {
                //comes in looking like [SampleChannel, Test]
                if(subscriptions != null){
                    cbc.log('subs: ' + subscriptions);
                    if(typeof(subscriptions) === "string") {
                        subscriptions = subscriptions.replace("[","").replace("]","").split(", ");
                    }
                    cachedData.subscriptions = subscriptions;//.replace("[","").replace("]","").split(", ")
                }
                else{
                    cbc.log("Subscriptions were null.");
                }

            }, function(e) {
                cbc.log('sub error');
            });
        }
        catch(ex){

        }
    },

    sports: function(){

        var Sports = Parse.Object.extend('Sports');

        var sportsQuery = new Parse.Query(Sports);
        sportsQuery.equalTo("Active", true);
        sportsQuery.ascending("SportsName");
        sportsQuery.find({
            success: function(results){
                $("#sports").css({top:0});
                refreshing =false;
                var templateHTML = $("#sportTemplate").html();
                var tpl = _.template(templateHTML);
                $("#sportsList").html("<li class='list-group-item clickable'>Refreshing data...</li>");
                $.each(results,function(index,object){
                    var compiled = tpl({object: object});
                    $("#sportsList").append(compiled)
                });
            },
            error: function(error){
                cbc.log(error);
            }
        });
    },
    contacts: function(){
        var Contacts = Parse.Object.extend('Contacts');

        var ContactsQuery = new Parse.Query(Contacts);
        ContactsQuery.find({
            success: function(results){
                results = _.sortBy(results, function(result){return result.attributes.ContactName.toLowerCase();});
                cachedData.contacts = results;
                var templateHTML = $("#contactTemplate").html();
                var tpl = _.template(templateHTML);
                $("#contactsList").html("");
                $.each(results,function(index,object){
                    var compiled = tpl({object: object});
                    $("#contactsList").append(compiled)
                });
            },
            error: function(error){
                cbc.log(error);
            }
        });
    },
    events: function(){
        var Events = Parse.Object.extend('Events');
        var EventsQuery = new Parse.Query(Events);
        EventsQuery.equalTo("Active", true);
        EventsQuery.find({
            success: function(results){
                results = _.sortBy(results, function(result){return moment(result.attributes.EventDateTime);});
                cachedData.events = results;

                var templateHTML = $("#eventTemplate").html();
                var tpl = _.template(templateHTML);
                $("#eventsList").html("");
                var counted = 0;
                $.each(results,function(index,object){

                    var thatMoment = moment(object.attributes.EventDateTime,"DD/MM/YYYY HH:mm");
                    var thisMoment = moment(new Date());
                    //sent in the last 7 days.
                    //hide events that happened more than 2 days ago.
                    if(thatMoment > thisMoment.subtract('d',1)){
                        var compiled = tpl({object: object});
                        $("#eventsList").append(compiled)
                        counted +=1;
                    }
                });
                if(counted == 0){

                    $("#eventsList").html(makeBackDialog("There are no events."));
                }
            },
            error: function(error){
                cbc.log(error);
            }
        });
    },
    maps: function(){
        var Maps = Parse.Object.extend('Maps');

        var MapsQuery = new Parse.Query(Maps);
        MapsQuery.limit(1000); //AER
        MapsQuery.find({
            success: function(results){
                results = _.sortBy(results, function(result){return result.attributes.Venue.toLowerCase();});
                cachedData.maps = results;
                var templateHTML = $("#mapTemplate").html();
                var tpl = _.template(templateHTML);
                $("#mapsList").html("");
                $.each(results,function(index,object){
                    var compiled = tpl({object: object});
                    $("#mapsList").append(compiled)
                });
            },
            error: function(error){
                cbc.log(error);
            }
        });
    },
    messages: function(){
        var Messages = Parse.Object.extend('MessageHistory');
        var messageQuery = new Parse.Query(Messages);
        //sdQuery.greaterThan('createdAt', {"__type":"Date", "iso":moment().toISOString()});
        messageQuery.ascending("createdAt");


        messageQuery.find({
            success: function(results){
                $("#messages").css({top:0});
                refreshing =false;
                var templateHTML = $("#messageTemplate").html();
                var tpl = _.template(templateHTML);
                $("#messagesList").html("");
                $("#messagesList").html("<li class='list-group-item clickable'>Refreshing data...</li>");

                var counted = 0;
                $.each(results,function(index,object){
                    var thatMoment = moment(object.createdAt);
                    var thisMoment = moment(new Date());
                    //sent in the last 7 days.
                    object.attributes.date_formatted = thatMoment.format("DD/MM");
                    if(thatMoment > thisMoment.subtract('d',7)){
                        var compiled = tpl({object: object});
                        $("#messagesList").append(compiled);
                        counted +=1;
                    }

                });
                if(counted == 0){
                    $("#messagesList").html(makeBackDialog("There are no messages."));
                }
            },
            error: function(error){
                cbc.log(error);
            }
        });

    },
    sportsDetail: function(sport){
        var Sport = Parse.Object.extend(sport);
        var sdQuery = new Parse.Query(Sport);
        //sdQuery.greaterThan('createdAt', {"__type":"Date", "iso":moment().toISOString()});
        sdQuery.ascending("Team");

        //   window.localStorage['sport']=sport;

        sdQuery.find({
            success: function(results){
                var templateHTML = $("#sportsDetailTemplate").html();
                var tpl = _.template(templateHTML);

                $("#sportsDetailList").html("");
                var counted = 0;
                var teamArray=[];

                $.each(results,function(index,object){
                    teamArray.push(object);
                });
                var uniqueNames = [],uniqueTeams=[];
                $.each(teamArray, function(i, el){
                    if($.inArray(el.attributes.Team, uniqueNames) === -1) {
                        uniqueNames.push(el.attributes.Team);
                        uniqueTeams.push(el);
                    }
                });
                $.each(uniqueTeams,function(index,object){
                    var compiled = tpl({object: object}); 
                    $("#sportsDetailList").append(compiled);
                    counted +=1;
                });
                if(counted == 0){
                    var templateHTML = $("#sportsDetailNoSports").html();
                    var tpl = _.template(templateHTML);
                    var compiled = tpl({sport: sport});
                    $("#sportsDetailList").append(compiled);
                }
            },
            error: function(error){
                cbc.log(error);
            }
        });

    },
    teamDetail: function(sport,team,rangeSelector){
        var Sport = Parse.Object.extend(sport);
        var sdQuery = new Parse.Query(Sport);
        //sdQuery.greaterThan('createdAt', {"__type":"Date", "iso":moment().toISOString()});
        sdQuery.ascending("DateTime");

        var templist=[];
        sdQuery.find({
            success: function(results){
                var templateHTML = $("#teamDetailTemplate").html();
                var tpl = _.template(templateHTML);
                if(!rangeSelector)
                    rangeSelector="7days";
                //   alert(rangeSelector);
                $("#teamDetailList").html("");
                var counted = 0;
                $.each(results,function(index,object){
                    //   alert(team);
                    //  alert(object.attributes.Team);

                    if(object.attributes.Team==team) {
                        var thatMoment = moment(object.attributes.DateTime, "DD-MM-YYYY HH:mm");
                        var thisMoment = moment(new Date());
                        //will happen in next 7 days.
                        if ((rangeSelector == '7days' && thatMoment < thisMoment.add('d', 7) && thatMoment > moment(new Date()).subtract('d',1)) || (rangeSelector == 'all')) {
                            var compiled = tpl({object: object});
                            //$("#teamDetailList").append(compiled);
                            templist[counted]=object;
                            counted += 1;
                        }
                    }

                });
                templist.sort(date_compare);
                for(var i=0;i<templist.length;i++)
                {
                    $("#teamDetailList").append(tpl({object:templist[i]}));
                }
                if(counted == 0){
                    var templateHTML = $("#sportsDetailNoSports").html();
                    var tpl = _.template(templateHTML);
                    var compiled = tpl({sport: sport});
                    $("#teamDetailList").append(compiled);
                }
            },
            error: function(error){
                cbc.log(error);
            }
        });

    },
    saveRSVP: function(eventObject, name, number, existingObj){
        if(existingObj == null){
            var EventsRSVP = Parse.Object.extend('EventsRSVP');
            var eventsRSVP = new EventsRSVP();
            eventsRSVP.set("deviceToken",cbc.installationId);
            eventsRSVP.set("eventName",eventObject.attributes.EventName);
            eventsRSVP.set("eventObjectId",eventObject.id);
        }
        else{
            eventsRSVP = existingObj;
        }

        eventsRSVP.set("name",name);
        eventsRSVP.set("number",parseInt(number));
        eventsRSVP.save(null,{
            success: function(item){
                alert("Your RSVP was saved!");
                parseLoad.reloadCachedData();
            },
            error: function(item,error){
                alert("Your RSVP was not saved - please try again.");
                cbc.log(error);
            }});
    },
    deleteRSVP: function(objectId){
        alert('delete not implemented yet.');
    },
    updateRSVP: function(objectId){
        alert('update not implemented yet.');
    }
};
var cardAttributes = [];
var loadCards = function (){
    cardAttributes["welcome"] = {
        cardName: "welcome",
        canGoBack: false,
        header: "Welcome",
        cardId: "#welcome",
        showHeader: false,
        showFooter: true,
        url: "welcome",
        animation: "fade"
    };
    cardAttributes["sports"] = {
        cardName: "sports",
        canGoBack: true,
        header: "Sports",
        cardId: "#sports",
        showHeader: true,
        showFooter: false,
        url: "sports",
        animation: "slideBottom"
    };
    cardAttributes["sportsDetail"] = {
        cardName: "sportsDetail",
        canGoBack: true,
        forceBackTo: "sports",
        header: "",
        cardId: "#sportsDetail",
        showHeader: true,
        showFooter: false,
        url: "sportsDetail",
        animation: "slideBottom",
        actionButtonAvailable: true
    };
    cardAttributes["teamDetail"] = {
        cardName: "teamDetail",
        canGoBack: true,
        forceBackTo: "sportsDetail",
        header: "",
        cardId: "#teamDetail",
        showHeader: true,
        showFooter: false,
        url: "teamDetail",
        animation: "slideBottom",
        actionButtonAvailable: true
    };
    cardAttributes["events"] = {
        cardName: "events",
        canGoBack: true,
        header: "Events",
        cardId: "#events",
        showHeader: true,
        showFooter: false,
        url: "events",
        animation: "slideBottom"
    };
    cardAttributes["eventRSVP"] = {
        cardName: "eventRSVP",
        canGoBack: true,
        header: "",
        cardId: "#eventRSVP",
        showHeader: true,
        showFooter: false,
        url: "eventRSVP",
        animation: "slideBottom"
    };
    cardAttributes["eventDetail"] = {
        cardName: "eventDetail",
        canGoBack: true,
        forceBackTo: "events",
        header: "",
        cardId: "#eventDetail",
        showHeader: true,
        showFooter: false,
        url: "eventDetail",
        animation: "slideBottom",
        actionBtnText: "RSVP"
    };
    cardAttributes["maps"] = {
        cardName: "maps",
        canGoBack: true,
        header: "Maps",
        cardId: "#maps",
        showHeader: true,
        showFooter: false,
        url: "maps",
        animation: "slideBottom"
    };
    cardAttributes["contacts"] = {
        cardName: "contacts",
        canGoBack: true,
        header: "Contacts",
        cardId: "#contacts",
        showHeader: true,
        showFooter: false,
        url: "contacts",
        animation: "slideBottom"
    };
    cardAttributes["contactsDetail"] = {
        cardName: "contactsDetail",
        canGoBack: true,
        forceBackTo: "contacts",
        header: "",
        cardId: "#contactsDetail",
        showHeader: true,
        showFooter: false,
        url: "contactsDetail",
        animation: "slideBottom"
    };
    cardAttributes["messages"] = {
        cardName: "messages",
        canGoBack: true,
        header: "Messages",
        cardId: "#messages",
        showHeader: true,
        showFooter: false,
        url: "messages",
        animation: "slideBottom"
    };
};
loadCards();

window.onpopstate = function(event){
    cbc.log("attempting popstate of " + event);
    if(typeof(event) !== "undefined"){
        cbc.isBack = true;
        cbc.showCard(event.state.cardName, true);
    }

};
function date_compare(a,b)
{
    var aDate= a.attributes.DateTime.toString().split(" ")[0];
    var bDate= b.attributes.DateTime.toString().split(" ")[0];
    var date1=aDate.split('/')[2]+aDate.split('/')[1]+aDate.split('/')[0];
    var date2=bDate.split('/')[2]+bDate.split('/')[1]+bDate.split('/')[0];
    return date1-date2;
}
function wasSwipe(){
    var distance = touchStartPos - $(window).scrollTop();
    if(distance > 20 || distance < -20){
        return true;
    }
    return false;
}
function makeBackDialog(message){
    return "<div class='dialog' onclick='window.history.back();return false;'>" + message + "</div>";
}
function tokenHandler (result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
    // alert('device token = ' + result);
}
function errorHandler (error) {
    //alert('error = ' + error);
    console.log(error);
}
// iOS
function onNotificationAPN (event) {
    try{
        if ( event.alert )
        {
            navigator.notification.alert(event.alert);
        }

        if ( event.sound )
        {
            var snd = new Media(event.sound);
            snd.play();
        }

        if ( event.badge )
        {
            pushNotification.setApplicationIconBadgeNumber(null, errorHandler, event.badge);
        }
    }
    catch(err){
        //alert(err);
    }

}
$(function(){
    cbc.log(Date() + " Document.ready");




    function disableClick(){
        enableClick =false;
        window.setTimeout(function(){
            enableClick = true;
        },500);
    }


    var UI_events = function(){
        //still use 'click' for this so user can swipe.
        $(".btn-card").on(clickEvent,function(){
            var cardId = $(this).attr('data-card-id');
            if(cardId=="sports")
            {
                //alert('abc');
                //$(".action-btn").css("display","block");
                $(".title").css("padding-right","120px");
            }
            else
            {
                //$(".action-btn").css("display","none");
                $(".title").css("padding-left","53px");
            }
            cbc.showCard(cardId, false);

        });
        $("a").on('click',function(){
            if(enableClick == false){
                return false;}
        });
        $("body").on('touchstart',function(){
            touchStartPos = $(window).scrollTop();
        });
        $("body").on(clickEvent,'.open-map',function(e){
            //this button should open a map!
            var objectId = $(this).attr('data-object-id');
            var map = _.findWhere(cachedData.maps, {id: objectId});
            if(map != null){
                cbc.openDrivingDirections(map.attributes.Location._latitude, map.attributes.Location._longitude);
            }
            else{

                //check events.
                map = _.findWhere(cachedData.events, {id: objectId});
                if(map != null){
                    if(map.attributes.EventLocation != undefined){
                        cbc.openDrivingDirections(map.attributes.EventLocation._latitude, map.attributes.EventLocation._longitude);
                    }
                    else{

                        alert("No directions for this venue are available.");
                    }
                }
            }
            e.preventDefault();
            return false;

        });
        $("body").on(clickEvent,'.back-btn',function(){
            window.history.back();return false;

        });
        $("body").on(clickEvent,'.clickable',function(e){
            //this button likely opens a detail card.
            e.preventDefault();
            var text = $(this).text().trim();
            var cardId = $(this).attr('data-card-id');
            var objectId = $(this).attr('data-object-id');
            disableClick();
            cbc.showCard(cardId, false, {text: text, objectId: objectId});

        });




        $("body").on(clickEvent,'.action-btn',function(){
            //act based on which card is shown.
            switch(cbc.activeCardId){
                case '#sports':

                    switch($(this).text()){
                        case "Subscribe":
                            if(parseLoad.subscribe('device')){
                                cbc.log("sbscribe passed back.");
                                $(this).text("Unsubscribe");
                            }
                            break;
                        case "Unsubscribe":
                            if(parseLoad.unsubscribe('device')){
                                cbc.log("unsubscribe passed back.");
                                $(this).text("Subscribe");
                            }
                            break;
                    }
                    break;
                case "#sportsDetail":
                    switch($(this).text()){
                        case "Subscribe":
                            if(parseLoad.subscribe($(".header .title").text())){
                                cbc.log("sbscribe passed back.");
                                $(this).text("Unsubscribe");
                            }
                            break;
                        case "Unsubscribe":
                            if(parseLoad.unsubscribe($(".header .title").text())){
                                cbc.log("unsubscribe passed back.");
                                $(this).text("Subscribe");
                            }
                            break;
                    }
                    break;
                case "#teamDetail":
                    switch($(this).text()){
                        case "Subscribe":
                            if(parseLoad.subscribe($(".header .title").text())){
                                cbc.log("sbscribe passed back.");
                                $(this).text("Unsubscribe");
                            }
                            break;
                        case "Unsubscribe":
                            if(parseLoad.unsubscribe($(".header .title").text())){
                                cbc.log("unsubscribe passed back.");
                                $(this).text("Subscribe");
                            }
                            break;
                    }
                    break;
                case "#eventDetail":
                    //user wants to RSVP for this event.
                    cardId = "eventRSVP";
                    cbc.showCard(cardId, false);
                    break;
            }
        });
        $("body").on(clickEvent, '.open-by-data-venue',function(){
            // parse schema does not hold a map ID for this type of data. the data-venue attribute holds the venue name
            // that we have to look up in the map cache.
            // if theres a result, open internal map. If not, show message.

            var data_venue = $(this).attr('data-venue');
            var map = null;
            _.each(cachedData.maps, function(cachedMap){
                if(cachedMap.attributes.Venue == data_venue){
                    map = cachedMap;
                    return;
                }
            });
            if(map != undefined){
                cbc.openDrivingDirections(map.attributes.Location._latitude, map.attributes.Location._longitude);
            }else{
                cbc.userMessage("Map not available for this location.");
            }

        });
        $("body").on(clickEvent, "#RSVP_form_submit", function(){
            var name = $("#RSVP_form_name").val();
            var number = $("#RSVP_form_number").val();
            cbc.log(cbc.installationId + ": " + cbc.activeRecord.id);
            var existingRSVP = null;
            //was there already an RSVP for this device/event?
            _.each(cachedData.rsvps, function(rsvp){
                if(rsvp.attributes.deviceToken == cbc.installationId && rsvp.attributes.eventObjectId == cbc.activeRecord.id){
                    //there is already an RSVP.

                    existingRSVP = rsvp;
                }
            });

            if(existingRSVP == null){
                cbc.log("RSVP dd not exist, create new");
                parseLoad.saveRSVP(cbc.activeRecord, name, number, null);
            }
            else{
                cbc.log("RSVP eixsted, updated.");
                parseLoad.saveRSVP(cbc.activeRecord, name, number, existingRSVP);
            }
            return false;
        });

        $("body").on(clickEvent, '.rangeSelector',function(){
            // parse schema does not hold a map ID for this type of data. the data-venue attribute holds the venue name
            // that we have to look up in the map cache.
            // if theres a result, open internal map. If not, show message.

            if($(this).attr('data-show')=='7days' ) {
                $(this).attr('data-show', 'all');
                $(this).html('Show Next 7 days');
                parseLoad.teamDetail(window.localStorage['sport'],$(".title").html(),'all');

            }
            else if (!$(this).attr('data-show')||$(this).attr('data-show')=='all') {
                $(this).attr('data-show', '7days');
                $(this).html('Show All');
                parseLoad.teamDetail(window.localStorage['sport'],$(".title").html(),'7days');
            }

            //  cbc.userMessage("Map not available for this location.");

        });
    }();

    if(history.state == undefined){
        cbc.showCard("welcome",false,null);
    }


    /* CBC Keys */
    /* var parseConfigApplicationKey = "juzUHhpCxzz64N3m6OA3xpCrNlk27UnGEAw6mIP9";
     var parseConfigJavascriptKey = "PQOu9Qf3ToK8WrmlBmLpGL6r1DxrmSFgsve2eYXZ";
     var parseConfigClientKey = "QoxbLCyHSmcu3UBlRj0lg070vT8XXh0gwAzWLTg2";*/
    var parseConfigApplicationKey = "wXdan9gZiUO0rvOHblqOiK4GnZpqRSY56MuThxBM";
    var parseConfigJavascriptKey = "RAmgQw4u4sDnMzdyBASFtKrALP9WYzcnGyUQvHE0";
    var parseConfigClientKey = "4rOvO5PkUYioDrvnBf2ih8yKY57yOYfSe87Hqfcr";
    /* Code WOrkshop Keys */
    /*var parseConfigApplicationKey = "GmkZn4IXIh1GdBeP9WJQVslLJKQ5VvLiP92CfpoH";
     var parseConfigJavascriptKey = "vudcOMnwATgQoCf74gofhKToscOCRQjj1tnxSf7c";
     var parseConfigClientKey = "D1TtwOfbskexDaFDyGONyIyhKWlFpcTjGXcWSKhC";*/

    Parse.$ = $;
    Parse.initialize(parseConfigApplicationKey,
        parseConfigJavascriptKey);


    try{
        window.parsePlugin.initialize(parseConfigApplicationKey, parseConfigClientKey, function() {
            console.log('success');
        }, function(e) {
            console.log('error');
        });
        window.parsePlugin.getInstallationId(function(id) {
            installationID = id;
            console.log(installationID);

        }, function(e) {
            console.log("Error Getting ID: " + e.code + " : " + e.message);
        });
    }
    catch(err) {


    }

    parseLoad.reloadCachedData();
    window.setTimeout(function(){
        try{
            window.parsePlugin.initialize(parseConfigApplicationKey, parseConfigClientKey, function() {
                cbc.log('success');
            }, function(e) {
                cbc.log('error');
            });
            window.parsePlugin.getInstallationId(function(id) {
                installationID = id;
                cbc.installationId = id;
                cbc.log(cbc.installationId);

            }, function(e) {
                cbc.log("Error Getting ID: " + e.code + " : " + e.message);
            });
        }
        catch(ex){
            cbc.log(ex.message);
        }
        parseLoad.subscribeAppleInit();
        parseLoad.cacheRSVPs();


    },1000);
    var owl = $(".owl-carousel");
    owl.owlCarousel({
        itemsMobile: [500, 3],
        autoPlay: false,
        pagination: false,
        afterInit: function(el){
            el.trigger('owl.jumpTo',2);
        }
    });
    cbc.log(Date() + " Document.ready finished.");
});