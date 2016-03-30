var app = angular.module('prApp', []);

app.filter('to_trusted', ['$sce', function($sce){
  return function(text) {
    return $sce.trustAsHtml(text);
  };
}]);

app.controller('pullsController', ['$scope', '$http', function($scope, $http) {
  var approvalKeywords = ['+1', ':+1:', ':gem:', 'lgtm'];

  $http.get('/api/pulls').then(function(response) {
    $scope.pulls = response.data;

    angular.forEach($scope.pulls, function(pull) {
      $http.get('/api/comments?url=' + pull.comments_url)
        .then(function(response) {
          pull.approvedBy = [];

          angular.forEach(response.data, function(comment) {
            var message = comment.body.replace(/^\s+|\s+$/g, '').toLowerCase();
            if (_.contains(approvalKeywords, message)) {
              pull.approvedBy.push({
                user: comment.user.login,
                avatar: comment.user.avatar_url,
                url: comment.user.html_url
              });
            }
          });
        });
    });
  });
}]);

setTimeout(function() {
  location.reload();
}, 1000 * 60);
