/* eslint-disable no-underscore-dangle */
$('#phone').intlTelInput();

const app = angular.module('myApp', []);
app.controller('myCtrl', ($scope, $http) => {
  const backendUrl = 'https://cloudserver.carma-cam.com';

// TODO: do we need to change the backend api endpoint too?
  // $http.get(
  //   `${backendUrl}/loginWithCookie`,
  //   { withCredentials: true },
  // ).then((res) => {
  //   if (res.error || !res.data || !res.data._id) {
  //     return;
  //   }

  //   window.location = `myAccount.html?_id=${res.data._id}`;
  // });

  $scope.signup = () => {
    window.location = 'register.html';
  };

  $scope.forgotPassword = () => {
    window.location = 'forgotPassword.html';
  };

  $scope.submitData = () => {
    if ($scope.phone === '' || $scope.password === '') {
      $scope.error = 'Please enter all the details';
      return;
    }

    // TODO: find a way to notify that country is not selected (sometimes the flag area is gray)
    const countryData = $('#phone').intlTelInput('getSelectedCountryData');
    const { dialCode } = countryData;

    $http({
      method: 'POST',
      url: `${backendUrl}/login`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      withCredentials: true,
      transformRequest() {
        const str = [];
        str.push(`phone=${dialCode}${$scope.phone}`);
        str.push(`password=${$scope.password}`);
        return str.join('&');
      },
    }).success((res) => {
      if (res.error) {
        $scope.error = res.error;
        return;
      }

      // added to check the authorization
      // changed part
      if (res.token) {
        $scope.token = res.token;
      } 

      window.location = `myAccount.html?accountId=${res._id}`;
    }).error((err) => {
      // server response with an error status also goes here
      const errorMsg = (err.error) ? err.error : err;
      $scope.error = `Server error: ${errorMsg}`;
    });
  };
});
