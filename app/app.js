sc2.init({
    app: 'steemthink.app',
    callbackURL: 'https://steemthink.com',
    accessToken: getCookie('steemthink_access_token'),
    scope: ['vote', 'comment']
});


var app = angular.module("myApp", ['ngRoute','ngSanitize','infinite-scroll','ngToast']);

angular.module('myApp')
    .config(['ngToastProvider', function(ngToast) {
        ngToast.configure({
            verticalPosition : 'bottom',
            timeout : '4000'
        });
    }]);

app.config(['$routeProvider', function ($routeProvider) {


    $routeProvider
            .when('/', {
                templateUrl:'/partials/front.html',
                controller: 'newCtrl'
            })

             .when('/New', {
            templateUrl:'/partials/front.html',
            controller: 'newCtrl'
            })

             .when('/Trending', {
            templateUrl:'/partials/front.html',
            controller: 'trendingCtrl'
            })

            .when('/Hot', {
            templateUrl:'/partials/front.html',
            controller: 'hotCtrl'
            })

            .when('/search/:searchText', {
            templateUrl:'/partials/searchPage.html',
            controller: 'searchCtrl'
            })

            .when('/myaccount',
            {
                templateUrl: '/partials/accountQuestions.html',
                controller: 'accountCtrl'
            })
            .when('/myaccount/questions',
            {
                templateUrl: '/partials/accountQuestions.html',
                controller: 'accountCtrl'
            })
            .when('/myaccount/answers',
            {
                templateUrl: '/partials/accountAnswers.html',
                controller: 'accountAnswersCtrl'
            })
            .when('/myaccount/replies',
            {
                templateUrl: '/partials/accountReplies.html',
                controller: 'accountRepliesCtrl'
            })
            .when('/:page', {
                templateUrl:'/partials/front.html',
                controller: 'trendingCtrl'
            })
            .when('/detail/:author/:permalink', {
                title: 'Detail',
                templateUrl: 'partials/detail.html',
                controller: 'detailCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
]);

//For sharing the userdata between different controllers
app.factory('shareData', function () {

    var shareData = {
        user: ''
    };

    return {
        getUser: function () {
            return shareData.user;
        },
        setUser: function (user) {
            shareData.user = user;
        }
    };
});

angular.module('myApp')
    .constant('tagString', "steemthink");

app.controller('Main', function($scope, $location, $http,shareData,ngToast) {

    $scope.loading = false;
    $scope.accessToken = GetParameterValues('access_token');
    $scope.expiresIn = GetParameterValues('expires_in');

    $scope.loginURL = sc2.getLoginURL();

    //Setting access token to cookie when the user is authenticated for the first time
    if ($scope.accessToken != undefined) {

        setCookie('steemthink_access_token',$scope.accessToken,$scope.expiresIn/(3600*24));

        sc2.setAccessToken($scope.accessToken);

        sc2.me(function (err, result) {

            // console.log('/me', err, result);

            if (!err) {

                $scope.user = result.account;

                //Calculate Steem Power
                getSteemPower($scope.user.name).then(result => {
                    const SP = result.toLocaleString();

                $scope.user.steemPower = SP;
                $scope.$apply();

                });

                $scope.$watch('user', function (newValue, oldValue) {
                    if (newValue !== oldValue) shareData.user(newValue);
                });

                $scope.metadata = JSON.stringify(result.user_metadata, null, 2);

                $scope.$apply();
            }
        });

        //Redirectng to the homepage after login
        document.location = '/';
    }

    //Check if user is logged in
    $scope.isAuth = function() {
        return !!$scope.user;
    };

    //Logout the user and delete cookie
    $scope.logout = function() {
        sc2.revokeToken(function (err, result) {
            console.log('You successfully logged out', err, result);
            eraseCookie('steemthink_access_token');
            delete $scope.user;
            delete $scope.accessToken;
            $scope.$apply();
        });
    };


    //Loading userdata when page is refreshed into the $scope
    if(!$scope.isAuth() && getCookie('steemthink_access_token') != null){

        sc2.me(function (err, result) {
            if (!err) {
                $scope.user = result.account;


                //Calculate Steem Power
                getSteemPower($scope.user.name).then(result => {
                    const SP = result.toLocaleString();

                $scope.user.steemPower = SP;
                $scope.$apply();

                });

                $scope.$watch('user', function (newValue, oldValue) {
                    if (newValue !== oldValue) shareData.user(newValue);
                });


                $scope.metadata = JSON.stringify(result.user_metadata, null, 2);
                $scope.$apply();
            }
        });
    }

    $scope.updateUserMetadata = function(metadata) {
        sc2.updateUserMetadata(metadata, function (err, result) {
            if (!err) {
                alert('You successfully updated user_metadata');
                console.log('You successfully updated user_metadata', result);
                if (!err) {
                    $scope.user = result.account;
                    $scope.metadata = JSON.stringify(result.user_metadata, null, 2);
                    $scope.$apply();
                }
            } else {
                console.log(err);
            }
        });
    };


    //Post a comment when user clicks post comment
    $scope.createPost = function(title,body,tags) {

        if($scope.isAuth()) {

            $scope.loading = true;
            $scope.post_msg = '';

            var postPermlink = title.split(" ").join('-').toLowerCase() + '-' + (new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase());

            var Metadata = {"tags": [], "app": "steemthink/1.0"};

            Metadata.tags = tags.split(' ').slice(0, 4);
            Metadata.tags.push("steemthink");

            console.log(JSON.stringify(Metadata));

            sc2.comment('', 'steemthink', $scope.user.name, postPermlink, title, body, Metadata, function (err, result) {

                console.log(err, result);
                $scope.loading = false;

                if (err == null) {
                    console.log();

                    ngToast.create({
                            content: '<strong>Post Submitted Successfully</strong>',
                            className: 'success'
                    });

                    $scope.post_msg = 'Done';

                }
                else {

                    ngToast.create({
                            content: '<strong>Error Submitting Post : '+err+'</strong>',
                            className: 'error'
                    });

                    $scope.post_msg = err;
                }

                $scope.$apply();

            });
        }
        else{

            window.location.href = $scope.loginURL;
        }
    };

    //Check if user is logged in or not. Otherwise redirect to steem login url
    $scope.checkUserLoggedIn = function () {

        if(!$scope.isAuth()){


            window.location.href = $scope.loginURL;

        }

    }

    //Search Function
    $scope.searchPost = function () {

        $location.path('/search/'+$scope.searchText);
    }


});

//get parameter value by query name from the link
function GetParameterValues(param) {
    var url = window.location.search.slice(window.location.search.indexOf('?') + 1).split('&');
    for (var i = 0; i < url.length; i++) {
        var urlparam = url[i].split('=');
        if (urlparam[0] == param) {
            return urlparam[1];
        }
    }
}


/*
* Set
* Get
* Erase Cookie*/

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name+'=; Max-Age=-99999999;';
}


//Calculate Steem Power
function getSteemPower(username) {
    return Promise.all([
        new Promise(function(resolve, reject) {
            // Do async job
            steem.api.getAccounts([username],function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        }),
        new Promise(function(resolve, reject) {
            // Do async job
            steem.api.getDynamicGlobalProperties(function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    ]).then(([user, globals]) => {
        const totalSteem = Number(globals.total_vesting_fund_steem.split(' ')[0]);
    const totalVests = Number(globals.total_vesting_shares.split(' ')[0]);
    const userVests = Number(user[0].vesting_shares.split(' ')[0]);

    return totalSteem * (userVests / totalVests);
});
}

