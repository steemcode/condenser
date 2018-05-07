app.controller('trendingCtrl',function($scope, $http, $location, $routeParams,Steem) {

    $scope.trendingTab = 'active';

    $scope.steem = new Steem('get_discussions_by_trending',true);
});

app.controller('newCtrl',function($scope, $http, $location, $routeParams,Steem) {

    $scope.newTab = 'active';

    var cacheState = true;
    if ($routeParams.reloadState == 'reload')
        cacheState = false;

    $scope.steem = new Steem('get_discussions_by_created',cacheState);
});

app.controller('hotCtrl',function($scope, $http, $location, $routeParams,Steem) {

    $scope.hotTab = 'active';

    $scope.steem = new Steem('get_discussions_by_hot',true);

});

//Infinite scroll front page
app.factory('Steem', function($http,tagString) {

    var Steem = function(activeTab,cacheState) {
        this.lists = [];
        this.busy = false;
        this.after = '';
        this.done = false;
        this.first = false;
        this.activeTab = activeTab;
        this.cacheState = cacheState;
    };

    Steem.prototype.nextPage = function() {

        if (this.busy) return;

        this.busy = true;

        $http({
            method: 'GET',
            cache: this.cacheState,
            url: 'https://api.steemjs.com/'+this.activeTab+'?query={"tag":"'+tagString+'", "limit": "10"'+this.after+'}'
        }).then(function successCallback(response) {

           var lists = response.data;

            for(var i=0; i < lists.length ; i++){

                lists[i].body = lists[i].body.substring(0,170)+'...';
                // lists[i].body =  lists[i].body = md.render(  lists[i].body);

                lists[i].created = formatDate(new Date(Date.parse(lists[i].created)));
                lists[i].json_metadata = angular.fromJson(lists[i].json_metadata);
                lists[i].author_reputation = steem.formatter.reputation(lists[i].author_reputation);
            }

            var i = 1;
            //Check for first time loading
            if(!this.first)
            {
                i = 0;
                this.first = true;
            }

            for (; i < lists.length; i++) {
                this.lists.push(lists[i]);
            }

            var index = lists.length -1;
            this.after = ',"start_author":"'+lists[index].author+'","start_permlink":"'+lists[index].permlink+'"';
            this.busy = false;

            //change value of done if no more posts are available
            if(lists.length == 1)
                this.done = true;

        }.bind(this));
        
    };

    return Steem;
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

/*
function change(reputation){
    if (reputation == null) return reputation;
    reputation = parseInt(reputation);
    let rep = String(reputation);
    const neg = rep.charAt(0) === "-";
    rep = neg ? rep.substring(1) : rep;
    const str = rep;
    const leadingDigits = parseInt(str.substring(0, 4));
    const log = Math.log(leadingDigits) / Math.log(10);
    const n = str.length - 1;
    let out = n + (log - parseInt(log));
    if (isNaN(out)) out = 0;
    out = Math.max(out - 9, 0);
    out = (neg ? -1 : 1) * out;
    out = out * 9 + 25;
    out = parseInt(out);
    return out;
};*/
