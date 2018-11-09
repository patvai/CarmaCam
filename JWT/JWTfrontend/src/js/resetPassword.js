/* eslint-disable no-underscore-dangle */
$('#phone').intlTelInput();

const app = angular.module('myApp', []);
app.controller('myCtrl', ($scope, $http) => {
  // const backendUrl = 'https://cloudserver.carma-cam.com';
  const backendUrl = 'http://0.0.0.0:9001';
  // ?pinCode=xx&email=xx
  const [pinCodeData, emailData] = window.location.search.split('&');
  const [, pinCode] = pinCodeData.split('=');
  const [, email] = emailData.split('=');
  $scope.pinCode = pinCode;
  $scope.email = email;
  $scope.phone = '';
  $scope.newPassword = '';
  $scope.newPasswordConfirm = '';

  $scope.resetPassword = () => {
    if ($scope.pinCode === ''
      || $scope.email === ''
      || $scope.phone === ''
      || $scope.newPassword === ''
      || $scope.newPasswordConfirm === '') {
      $scope.error = 'Please make sure no fields are blank';
      return;
    }

    if ($scope.newPassword !== $scope.newPasswordConfirm) {
      $scope.error = 'The passwords entered are not consistent.';
      return;
    }

    const countryData = $('#phone').intlTelInput('getSelectedCountryData');
    const { dialCode } = countryData;

    $scope.error = '';
    $http({
      method: 'POST',
      url: `${backendUrl}/updatePassword`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest: () => {
        const str = [];
        str.push(`pinCode=${$scope.pinCode}`);
        str.push(`email=${$scope.email}`);
        str.push(`phone=${dialCode}${$scope.phone}`);
        str.push(`newPassword=${$scope.newPassword}`);
        return str.join('&');
      },
    }).success((res) => {
      window.alert('Successfully updated your password');
      window.location = 'login.html';
    }).error((err) => {
      const errorMsg = (err.error) ? err.error : err;
      $scope.error = `Server error: ${errorMsg}`;
    });
  };
});
