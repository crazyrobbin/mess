'use strict';

/**
 * @ngdoc function
 * @name demoApp.controller:CommonCtrl
 * @description
 * # CommonCtrl
 * Controller of the demoApp
 */
angular.module('posApp')
    .controller('CommonCtrl', [
        '$scope',
        '$mdSidenav',
        'ssSideNav',
        'ssSideNavSharedService',
        '$rootScope',
        function (
            $scope,
            $mdSidenav,
            ssSideNav,
            ssSideNavSharedService,
            $rootScope) {

            $scope.onClickMenu = function () {
                $mdSidenav('left').toggle();
            };

            $scope.menu = ssSideNav;

            // Listen event SS_SIDENAV_CLICK_ITEM to close menu
            $rootScope.$on('SS_SIDENAV_CLICK_ITEM', function() {
                console.log('do whatever you want after click on item');
            });
        }
    ]);

/**
 * @ngdoc function
 * @name demoApp.controller:IndexCtrl
 * @description
 * # IndexCtrl
 * Controller of the demoApp
 */
angular.module('posApp')

    .controller('HomeCtrl', [
        '$scope',
        '$timeout',
        'ssSideNav',
        function (
            $scope,
            $timeout,
            ssSideNav) {

            ssSideNav.setVisible('link_3', true);

            ssSideNav.setVisibleFor([{
                id: 'toogle_1_link_2',
                value: true
            }, {
                id: 'toogle_1_link_1',
                value: false
            }]);

            $timeout(function () {
                ssSideNav.setVisible('toogle_2', false);
            }, 1000 * 3);
	   }
    ]);