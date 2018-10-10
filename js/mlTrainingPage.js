/* eslint-disable no-underscore-dangle */
//$('#phone').intlTelInput();

const app = angular.module('myApp', []);
app.controller('mlTrainingPage', ($scope, $http) => {
    //update the backend url with correct url
  const backendUrl = 'https://cloudserver.carma-cam.com';

  $http.get(
    `${backendUrl}/loginWithCookie`,
    { withCredentials: true },
  ).then((res) => {
    if (res.error || !res.data || !res.data._id) {
      return;
    }

    window.location = `myAccount.html?_id=${res.data._id}`;
  });

  
  
  $('#capture_btn').on('click', function () {
    alert("capture image");
});

  

 

    // $http({
    //   method: 'POST',
    //   url: `${backendUrl}/login`,
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   withCredentials: true,
    //   transformRequest() {
    //     const str = [];
    //     str.push(`phone=${dialCode}${$scope.phone}`);
    //     str.push(`password=${$scope.password}`);
    //     return str.join('&');
    //   },
    // }).success((res) => {
    //   if (res.error) {
    //     $scope.error = res.error;
    //     return;
    //   }

    //   window.location = `myAccount.html?accountId=${res._id}`;
    // }).error((err) => {
    //   // server response with an error status also goes here
    //   const errorMsg = (err.error) ? err.error : err;
    //   $scope.error = `Server error: ${errorMsg}`;
    // });
});
