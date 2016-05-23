'use strict';

/**
 * @ngdoc overview
 * @name demoApp
 * @description
 * # demoApp
 *
 * Main module of the application.
 */
angular
    .module('posApp', [
        'ngAnimate',
        'ngAria',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngMaterial',
        'ui.router',
        'posControllers',
        'materialCalendar',
        'posServices',
        'sasrio.angular-material-sidenav'
    ])
    .directive('backButton', function(){
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        element.bind('click', goBack);

        function goBack() {
          history.back();
          scope.$apply();
        }
      }
    }
})
    .filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})
    .config([
        '$mdThemingProvider',
        '$locationProvider',
        '$urlRouterProvider',
        '$stateProvider',
        'ssSideNavSectionsProvider',
        function (
            $mdThemingProvider,
            $locationProvider,
            $urlRouterProvider,
            $stateProvider,
            ssSideNavSectionsProvider) {

            $mdThemingProvider
                .theme('default')
                .primaryPalette('red', {
                    'default': '700'
                });

            $urlRouterProvider.otherwise(function () {
                return '/home-page';
            });

            $stateProvider.state({
                name: 'common',
                abstract: true,
                templateUrl: 'views/_common.html',
                controller: 'CommonCtrl'
            });

            $stateProvider.state({
                name: 'common.home',
                url: '/home-page',
                templateUrl: 'views/home-page.html',
                controller: 'HomePageCtrl'
            });

            $stateProvider.state({
                name: 'common.complaint',
                url: '/complaint',
                templateUrl: 'views/complaint.html',
                controller: 'ComplaintCtrl'
            });

            $stateProvider.state({
                name: 'common.menu',
                url: '/menu',
                templateUrl: 'views/menu.html',
                controller: 'MenuCtrl'
            });

            $stateProvider.state({
                name: 'common.user',
                url: '/user-home-page/:query',
                templateUrl: 'views/user-home-page.html',
                controller: 'UserHomePageCtrl'
            });


            $stateProvider.state({
                name: 'common.toggle1',
                url: '/toogle1',
                abstract: true,
                template: '<ui-view/>'
            });

            $stateProvider.state({
                name: 'common.toggle1.summary',
                url: '/summary',
                templateUrl: 'views/summary.html',
                controller: 'SummaryCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.accounts',
                url: '/accounts',
                templateUrl: 'views/accounts.html',
                controller: 'AccountsCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.stock',
                url: '/stock',
                templateUrl: 'views/stock.html',
                controller: 'StockCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.expenses',
                url: '/expenses',
                templateUrl: 'views/expense.html',
                controller: 'ExpensesCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.editmenu',
                url: '/editmenu',
                templateUrl: 'views/edit-menu.html',
                controller: 'EditMenuCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.staff',
                url: '/staff',
                templateUrl: 'views/staff.html',
                controller: 'StaffCtrl'
            });

            $stateProvider.state({
                name: 'common.toggle1.permanentstock',
                url: '/permanentstock',
                templateUrl: 'views/permanentstock.html',
                controller: 'PermanentStockCtrl'
            });

            ssSideNavSectionsProvider.initWithTheme($mdThemingProvider);
            ssSideNavSectionsProvider.initWithSections([{
                id: 'link_1',
                name: 'Home ',
                state: 'common.home',
                type: 'link',
            }, {
                id: 'link_2',
                name: 'Menu',
                state: 'common.menu',
                type: 'link'
            }, {
                id: 'link_3',
                name: 'Complaint',
                state: 'common.complaint',
                type: 'link',
            },  {
                id: 'toogle_2',
                name: 'Other',
                type: 'heading',
                children: [{
                    name: 'Foodmonk',
                    type: 'toggle',
                    pages: [{
                        id: 'toogle_1_link_1',
                        name: 'Summary',
                        state: 'common.toggle1.summary'
                    }, {
                        id: 'toogle_1_link_2',
                        name: 'Accounts',
                        state: 'common.toggle1.accounts'
                    }, {
                        id: 'toogle_1_link_3',
                        name: 'Stock',
                        state: 'common.toggle1.stock'
                    }, {
                        id: 'toogle_1_link_4',
                        name: 'Expenses',
                        state: 'common.toggle1.expenses',
                    }, {
                        id: 'toogle_1_link_5',
                        name: 'Edit Menu',
                        state: 'common.toggle1.editmenu'
                    }, {
                        id: 'toogle_1_link_6',
                        name: 'Staff',
                        state: 'common.toggle1.staff'
                    },  {
                        id: 'toogle_1_link_7',
                        name: 'Permanent Stock',
                        state: 'common.toggle1.permanentstock'
                    }]
                }]
            }]);
        }
    ]);