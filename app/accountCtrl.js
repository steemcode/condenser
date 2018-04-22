app.controller('accountCtrl',function ($scope,$location,$routeParams,$http,shareData,Questions) {

    $scope.$watch(function () { return shareData.getUser(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.user = newValue;
    });

    $scope.questions = new Questions();

    // $scope.questions = new Answers();
});

//Infinite scroll Questions
app.factory('Questions', function($http,tagString) {
    var Questions = function() {
        this.userContent = [];
        this.busy = false;
        this.after = '';
        this.done = false;
        this.first = false;
    };

    Questions.prototype.nextPage = function(username) {

        if (this.busy) return;
        this.busy = true;

        $http({
            method: 'GET',
            cache: true,
            url: 'https://api.steemjs.com/get_discussions_by_blog?query={"tag":"'+username+'", "limit": "5"'+this.after+'}'
        }).then(function successCallback(response) {

            var userContent = response.data;

            for(var i=0; i < userContent.length ; i++){

                userContent[i].body = userContent[i].body.substring(0,170)+'...';
                userContent[i].created = formatDate(new Date(Date.parse(userContent[i].created)));

                if(userContent[i].json_metadata)
                userContent[i].json_metadata = angular.fromJson(userContent[i].json_metadata);
            }

            var index = userContent.length -1;
            this.after = ',"start_author":"'+userContent[index].author+'","start_permlink":"'+userContent[index].permlink+'"';


            this.busy = false;

            //change value of done if no more posts are available
            if(userContent.length == 1)
                this.done = true;

            var i = 1;

            //Check for first time loading
            if(!this.first)
            {
                i = 0;
                this.first = true;
            }

            for (; i < userContent.length; i++) {

                //check if the content has steemthink tag
                if( userContent[i].json_metadata.tags)
                    if(userContent[i].json_metadata.tags.indexOf(tagString) >= 0)
                        this.userContent.push(userContent[i]);
            }

        }.bind(this));

    };

    return Questions;
});



app.controller('accountAnswersCtrl',function ($scope,$location,$routeParams,$http,shareData,Answers) {

    $scope.$watch(function () { return shareData.getUser(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.user = newValue;
    });

    $scope.answers = new Answers();
});


//Infinite scroll Comments/Answers
app.factory('Answers', function($http) {
    var Answers = function() {
        this.userContent = [];
        this.busy = false;
        this.after = '';
        this.done = false;
        this.first = false;
    };

    Answers.prototype.nextPage = function(username) {

        if (this.busy) return;
        this.busy = true;

        //for the very first call
        if(!this.first)
        this.after = ',"start_author":"'+username+'","start_permlink":""';


        $http({
            method: 'GET',
            cache: true,
            url: 'https://api.steemjs.com/get_discussions_by_comments?query={"tag":"'+username+'", "limit": "5"'+this.after+'}'
        }).then(function successCallback(response) {

            var userContent = response.data;

            for(var i=0; i < userContent.length ; i++){

                userContent[i].body = userContent[i].body.substring(0,170)+'...';
                userContent[i].created = formatDate(new Date(Date.parse(userContent[i].created)));

                if(userContent[i].json_metadata)
                userContent[i].json_metadata = angular.fromJson(userContent[i].json_metadata);
            }

            var i = 1;

            //Check for first time loading
            if(!this.first)
            {
                i = 0;
                this.first = true;
            }

            for (; i < userContent.length; i++) {
                this.userContent.push(userContent[i]);
            }

            var index = userContent.length -1;
            this.after = ',"start_author":"'+userContent[index].author+'","start_permlink":"'+userContent[index].permlink+'"';


            this.busy = false;

            //change value of done if no more posts are available
            if(userContent.length == 1)
                this.done = true;

        }.bind(this));

    };

    return Answers;
});


app.controller('accountRepliesCtrl',function ($scope,$location,$routeParams,$http,shareData,Replies) {

    $scope.$watch(function () { return shareData.getUser(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.user = newValue;
    });

    $scope.replies = new Replies();
});



//Infinite scroll
app.factory('Replies', function($http) {
    var Replies = function() {
        this.userContent = [];
        this.busy = false;
        this.after = '';
        this.done = false;
        this.first = false;
    };

    Replies.prototype.nextPage = function(username) {

        if (this.busy) return;
        this.busy = true;

        //for the very first call
        if(!this.first) {

            this.after = ',"start_author":"' + username + '","start_permlink":""';

            $http({
                method: 'GET',
                cache: true,
                url: 'https://api.steemjs.com/get_state?path=/@'+username+'/recent-replies',

            }).then(function successCallback(response) {


                var object = response.data.content;
                var i = 0;
                var userContent = [];

                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        userContent[i] = object[key];
                        i++;
                    }
                }

                //Sort the content by date in descending order
                userContent.sort(function(a,b) {
                    return new Date(b.created).getTime() - new Date(a.created).getTime()
                });

                for(var i = 0 ; i < userContent.length; i++){

                    userContent[i].body = userContent[i].body.substring(0,170)+'...';
                    userContent[i].created = formatDate(new Date(Date.parse(userContent[i].created)));

                    if(userContent[i].json_metadata)
                    userContent[i].json_metadata = angular.fromJson(userContent[i].json_metadata);

                }

                var i = 1;

                //Check for first time loading
                if (!this.first) {
                    i = 0;
                    this.first = true;
                }

                for (; i < userContent.length; i++) {
                    this.userContent.push(userContent[i]);
                }

                var index = userContent.length - 1;
                this.after = 'startAuthor=' + userContent[index].author + '&startPermlink=' + userContent[index].permlink;

                this.busy = false;

                //change value of done if no more posts are available
                if (userContent.length == 1)
                    this.done = true;

            }.bind(this));

        }
        else {

            $http({
                method: 'GET',
                cache: true,
                url: 'https://api.steemjs.com/get_replies_by_last_update?limit=10&' + this.after,
            }).then(function successCallback(response) {

                var userContent = response.data;

                for (var i = 0; i < userContent.length; i++) {

                    userContent[i].body = userContent[i].body.substring(0, 170) + '...';
                    userContent[i].created = formatDate(new Date(Date.parse(userContent[i].created)));

                    if(userContent[i].json_metadata)
                    userContent[i].json_metadata = angular.fromJson(userContent[i].json_metadata);
                }

                var i = 1;

                //Check for first time loading
                if (!this.first) {
                    i = 0;
                    this.first = true;
                }

                for (; i < userContent.length; i++) {
                    this.userContent.push(userContent[i]);
                }

                var index = userContent.length - 1;
                this.after = 'startAuthor=' + userContent[index].author + '&startPermlink=' + userContent[index].permlink;

                this.busy = false;

                //change value of done if no more posts are available
                if (userContent.length == 1)
                    this.done = true;

            }.bind(this));
        }
    };

    return Replies;
});


function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day + ', ' + year;
}