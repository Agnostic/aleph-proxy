var app = angular.module('prApp', []);

app.filter('to_trusted', ['$sce', function($sce){
  return function(text) {
    return $sce.trustAsHtml(text);
  };
}]);

app.controller('pullsController', ['$scope', '$http', function($scope, $http) {
  $http.get('/api/pulls').then(function(response) {
    $scope.pulls = response.data;
  });
}]);
