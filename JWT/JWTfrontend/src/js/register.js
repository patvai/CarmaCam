$('#phone').intlTelInput();

const app = angular.module('myApp', []);
app.controller('myCtrl', ($scope, $http) => {
  // const backendUrl = 'https://cloudserver.carma-cam.com';
  const backendUrl = 'http://0.0.0.0:9001';

  $scope.submitData = () => {
    if ($scope.phone === ''
      || $scope.email === ''
      || $scope.fname === ''
      || $scope.lname === ''
      || $scope.password === ''
      || $scope.zipcode === '') {
      $scope.error = 'Please make sure no fields are blank';
      return;
    }

    // TODO: find a way to notify that country is not selected (sometimes the flag area is gray)
    const countryData = $('#phone').intlTelInput('getSelectedCountryData');
    const { dialCode } = countryData;

    $http({
      method: 'POST',
      url: `${backendUrl}/accounts`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest() {
        const str = [];
        str.push(`fname=${$scope.fname}`);
        str.push(`lname=${$scope.lname}`);
        str.push(`email=${$scope.email}`);
        str.push(`username=${$scope.username}`);
        str.push(`phone=${dialCode}${$scope.phone}`);
        str.push(`password=${$scope.password}`);
        str.push(`licensePlate=${$scope.license}`);
        str.push(`zipcode=${$scope.zipcode}`);
        return str.join('&');
      },
      withCredentials: true,
    }).success((res) => {
      if (res.error) {
        $scope.error = res.error;
        return;
      }

      window.location = `myAccount.html?_id=${res.id}`;
    }).error((err) => {
      // server response with an error status also goes here
      const errorMsg = (err.error) ? err.error : err;
      $scope.error = `Server error: ${errorMsg}`;
    });
  };
});
