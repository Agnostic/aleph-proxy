var app = angular.module('prApp', []);

app.controller('pullsController', ['$scope', '$http', function($scope, $http) {
  $http.get('/api/pulls').then(function(response) {
    $scope.pulls = response.data;
  });
}]);
