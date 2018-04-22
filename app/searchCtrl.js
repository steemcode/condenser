app.controller('searchCtrl',function($scope, $http, $location, $routeParams,Search) {

     $scope.searchText = $routeParams.searchText;

     $scope.searchFactory = new Search($scope.searchText);

});

//Infinite scroll front page
app.factory('Search', function($http) {

    var Search = function(searchText) {
        this.lists = [];
        this.busy = false;
        this.done = false;
        this.first = false;
        this.pageNumber = 1;
        this.searchText = searchText;
    };

    Search.prototype.nextPage = function() {


        if (this.busy) return;
        this.busy = true;

        $http({
            method : 'GET',
            // cache : true,
            url : 'https://api.asksteem.com/search?q='+this.searchText+'&pg='+this.pageNumber

        }).then(function successCallback(response) {

            var lists = response.data.results;

            for(var i=0; i < lists.length ; i++){

                lists[i].summary = lists[i].summary.substring(0,170)+'...';
                lists[i].created = formatDate(new Date(Date.parse(lists[i].created)));
            }

            for (var i = 0; i < lists.length; i++) {
                this.lists.push(lists[i]);
            }


            if(response.data.pages.has_next)
                 this.pageNumber++;

            this.busy = false;

            //change value of done if no more posts are available
            if(!response.data.pages.has_next)
                this.done = true;

        }.bind(this));

    };

    return Search;
});

