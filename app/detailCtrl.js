app.controller('detailCtrl',function ($scope,$location,$routeParams,$http,shareData,ngToast) {

    var permlink = $routeParams.permalink;
    var author = $routeParams.author;

    var md = new Remarkable(
        {
            html: true,
            breaks:true,
            linkify: true
        }
    );

    $scope.$watch(function () { return shareData.getUser(); }, function (newValue, oldValue) {
        if (newValue !== oldValue) $scope.user = newValue;
    });

    //Get the post data on page load
    $http({
        method: 'GET',
        cache: true,
        url: 'https://api.steemjs.com/get_content?author='+author+'&permlink='+permlink
    }).then(function successCallback(response) {
        $scope.lists = response.data;


            $scope.lists.created = formatDate(new Date(Date.parse($scope.lists.created)));
            $scope.lists.json_metadata = angular.fromJson($scope.lists.json_metadata);
            $scope.lists.author_reputation = steem.formatter.reputation($scope.lists.author_reputation);


            if($scope.lists.json_metadata.format !== 'html'){

                 $scope.lists.body = md.render( $scope.lists.body);

             }

    }, function errorCallback(response) {
    });


    //Get the answer/comments for the question
    $scope.getComments = function () {

        $http({
            method: 'GET',
            url: 'https://api.steemjs.com/get_content_replies?author=' + author + '&permlink=' + permlink
        }).then(function successCallback(response) {

            $scope.answers = response.data;

            for (var i = 0; i < $scope.answers.length; i++) {

                $scope.answers[i].created = formatDate(new Date(Date.parse($scope.answers[i].created)));

                $scope.answers[i].body  = md.render( $scope.answers[i].body);

                if($scope.answers[i].json_metadata)
                    $scope.answers[i].json_metadata = angular.fromJson($scope.answers[i].json_metadata);

                $scope.answers[i].author_reputation = steem.formatter.reputation($scope.answers[i].author_reputation);

            }

        }, function errorCallback(response) {
        });
    }


    //Post a comment when user clicks post comment
    $scope.doComment = function(message) {


        if(message === undefined || message == '')
        {
            ngToast.create(
                {
                    content: '<strong>Answer field can not be empty</strong>',
                    className: 'alert alert-danger'
                }
            );

        }
        else if($scope.$parent.isAuth()) {

            $scope.loadingComment = true;

            var commentPermlink = steem.formatter.commentPermlink(author, permlink);

            if (commentPermlink.length > 255) {
                // STEEMIT_MAX_PERMLINK_LENGTH
                commentPermlink = commentPermlink.substring(commentPermlink.length - 255, commentPermlink.length);
            }
            // only letters numbers and dashes shall survive
            commentPermlink = commentPermlink.toLowerCase().replace(/[^a-z0-9-]+/g, '');

            sc2.comment(author, permlink, $scope.user.name, commentPermlink, '', message, '', function (err, result) {

                // console.log(err, result);

                $scope.loadingComment = false;

                if(!err){

                    ngToast.create(
                        {
                            content: '<strong>You comment successfully posted</strong>',
                            className: 'success'
                        }
                    );
                }
                else {

                    ngToast.create(
                        {
                            content: '<strong>Error Posting Comment</strong>',
                            className: 'alert alert-danger'
                        }
                    );
                }

                $scope.getComments();

                $scope.$apply();
            });
        }
        else {

            window.location.href = $scope.$parent.loginURL;
        }
    };


    //Cast Vote
    $scope.vote = function(author, permlink, weight) {

        if($scope.$parent.isAuth()) {

            $scope.loadingVote = true;
            $scope.loadingVotePermlink = permlink;

            sc2.vote($scope.user.name, author, permlink, weight, function (err, result) {

                $scope.loadingVote = false;

                if (!err) {

                    /* alert('You successfully voted for @' + author + '/' + permlink);
                     console.log('You successfully voted for @' + author + '/' + permlink, err, result);*/

                    if(weight > 0) {
                        ngToast.create(
                            {
                                content: '<strong>You successfully voted for @' + author +'</strong>',
                                className: 'success'
                            }
                        );
                    }else {

                        ngToast.create(
                            {
                                content: '<strong>You successfully removed vote for @' + author +'</strong>',
                                className: 'success'
                            }
                        );
                    }

                    $scope.getComments();



                } else {

                    ngToast.create(
                        {
                            content: '<strong>Your vote was unsuccessfull</strong>',
                            className : 'alert alert-danger'
                        }

                    );
                    console.log(err);
                }
            });
        }else {

            window.location.href = $scope.$parent.loginURL;

        }
    };

    //check if the current upvote openation loading
    $scope.checkLoadingVote = function (permlink) {

        if($scope.loadingVotePermlink === permlink && $scope.loadingVote)
            return true;

        return false;

    }


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

});

