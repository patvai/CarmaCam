const app = angular.module('myApp', []);
app.controller('myCtrl', ($scope, $http) => {
  // const backendUrl = 'https://cloudserver.carma-cam.com';
  const backendUrl = 'http://0.0.0.0:9001';

  $scope.requestPasswordReset = () => {
    $scope.error = '';
    $http({
      method: 'GET',
      // TODO: should validate the email first
      url: `${backendUrl}/resetPassword?email=${$scope.email}`,
    }).success((res) => {
      if (res.error) {
        $scope.error = res.error;
        window.alert(`Could not send you the email for password reset. ${res.error}`);
        return;
      }

      window.alert('The email for password reset has been sent to you, please follow the instruction in the mail');
      // window.location = 'index.html';
    }).error((err) => {
      // server response with an error status also goes here
      const errorMsg = (err.error) ? err.error : err;
      $scope.error = `Server error: ${errorMsg}`;
    });
  };
});
