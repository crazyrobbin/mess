'use strict';

/* Controllers */

var posControllers = angular.module('posControllers', ['ngMaterial']);
var messMenu;
var postpaids;
var mealHourClosed = false;

posControllers.controller('ActionCtrl',
    function($scope, $mdDialog, $http, $mdMedia, $window, $timeout, dateFilter, Users) {

        $scope.updateTime = function(){
            $timeout(function(){
                $scope.theclock = (dateFilter(new Date(), 'hh:mm:ss a'));
                $scope.updateTime();
            },1000);
        };

        $scope.updateTime();
        $scope.showConfirm = function(ev) {
            var confirm = $mdDialog.confirm().title('Make sure that you have close current meal before exit.').targetEvent(ev).clickOutsideToClose(true).ok('Exit').cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                $window.close();
            });
        };

        var lockscreen = {
            controller: LockScreenDialogController,
            templateUrl: 'views/dialog/lockscreen.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false };

        $scope.lockScreen = function() {
            console.log("show lock lockScreen");
            $mdDialog.show(lockscreen);
        }

        console.log("sdsda");
        $scope.lockScreen();

        var updating = false;
        $scope.updateTiming = function(){
            $timeout(function(){
                updateData(function(){
                    updating = false;
                    $scope.updateTiming();
                });
            },15000);
        };

        function updateData(callBack){
            return Users.updateData(function(data){
                if(!data.data.length){ $scope.updateStatus = "Up to date"; return callBack();}
                else $scope.updateStatus = "Updating...";
                console.log(data.data);
                if(!updating){
                    updating = true;
                    $http({
                        method: 'POST',
                        url: 'https://www.yoururl.com/updateMess',
                        data: "data=" + JSON.stringify(data.data),
                        headers:  {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).then(function(response){
                        console.log(response);
                        Users.updateUpdateTime(data.updatedAt, function(){
                            $scope.updateStatus = "Up to date";
                            return callBack();
                        });
                    }, function(err){
                        console.log(err);
                        $scope.updateStatus = "Update Pending";
                        return callBack();
                    });
                }
            });
        }
        updateData(function(){
            updating = false;
            $scope.updateTiming();
        });

        $scope.updateStatus = "Update Pending";

    });


posControllers.controller('HomePageCtrl',
    function($scope, $state, $mdDialog, $mdMedia, $timeout, $location, ssSideNav, Users, Constants, Menu) {
        $scope.day = Constants.dayName(new Date().getDay()==0 ? 7 : new Date().getDay());
        var mealHour;
        $scope.orderOnline = "Order online at www.foodmonk.com (android app on google play)"
        $scope.mealHourStatus = "Loading..";
        $scope.updateTiming = function(){
            $timeout(function(){
                $scope.updateTiming();
                updateMealStatus();
            },1000);
        };

        updateMealStatus();
        $scope.closeMealHour = function(ev){
            var confirm = $mdDialog.confirm().title('Are you sure you want to close '+mealHour+ " ?").targetEvent(ev).clickOutsideToClose(true).ok('Yes').cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                Users.closeMealHour($scope.menu, messMenu, mealHour, function(){
                    checkMealClosed(mealHour);
                });
            });
        }

        $scope.updateTiming();
        if(typeof messMenu === 'undefined'){
            Menu.all(function(menu){
                messMenu = menu;
                $scope.menu = Menu.parseMenuByDay(messMenu);
            });
        }else{
            $scope.menu = Menu.parseMenuByDay(messMenu);
        }
        $scope.updateMessMenu = function(){

        }

        function updateMealStatus(){
            $scope.timing = Constants.messTimingDisplayFormat();
            if($scope.timing.breakfast.show) mealHour = "breakfast";
            if($scope.timing.lunch.show) mealHour = "lunch";
            if($scope.timing.dinner.show) mealHour = "dinner";
            checkMealClosed(mealHour);
            if(!mealHourClosed)$scope.mealHourStatus = "Close "+ mealHour;
            else $scope.mealHourStatus = mealHour + " Closed";
        }
        $scope.postpaids = postpaids;
        function updatePostpaids(){
            Users.postpaids(function(docs){
                postpaids = docs;
                $scope.postpaids = docs;
            });
        }

        function checkMealClosed(mealType){
            Users.checkMealClosed(mealType, function(status){
                $scope.currentMealHour = status;
                mealHourClosed = status;
            });
        }

        updatePostpaids();

        $scope.openUserDetail = function(ev, query){
            $scope.roomNo = "";
            $state.go('common.user', {'query' : query});
        };

        $scope.collectFromPostpaidUsers = function(ev, idx ,postpaid){
            $mdDialog.show({
                controller: AddGuestController,
                templateUrl: 'views/dialog/addguest.html',
                parent: angular.element(document.body),
                locals:{
                    menu: postpaid.menu.guest,
                    id: postpaid._id,
                    index: idx,
                    title: 'Guest - Room no: ' + postpaid.roomNo + ", Phone No: "+ postpaid.phoneNo
                },
                clickOutsideToClose: false }).then(function(index){
                    Users.collectFromPostpaidUser(postpaids[index], function(status){
                        updatePostpaids();
                    });
                });
        }

        $scope.register = function(ev){
            $mdDialog.show({
            controller: RegisterDialogController,
            templateUrl: 'views/dialog/register.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false });
        };
    });

posControllers.controller('UserHomePageCtrl',
    function($scope, $state, $stateParams, $mdToast, $mdDialog, Users, Menu) {
        Users.search($stateParams.query, function(user){
            $scope.user = user;
            $scope.menu = Menu.byMealTiming(messMenu, user);
            updateTotal();
        });
        $scope.editProfile = function(ev){
            var dialog = {
                controller: EditUserProfileController,
                templateUrl: 'views/dialog/editUserProfile.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    user: $scope.user,
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog).then(function(user){
                $scope.user.name = user.name;
                $scope.user.roomNo = user.roomNo;
                $scope.user.email = user.email;
                $scope.user.phoneNo = user.phoneNo;
                $scope.user.address = user.address;
                $scope.user.dob = user.dob;
                $scope.user.veg = user.veg;
            });
        }

        $scope.updateVeg = function(){
            Users.updateVeg($scope.user, function(){
                $mdToast.show($mdToast.simple().textContent('Successfully updated!').hideDelay(1000));
            });
        }

        $scope.back = function(){
            $state.go('common.home');
        }

        $scope.add = function(index, type){
            if(type == 'normal' && (index!=0 || $scope.menu.normal[index].qty<1))$scope.menu.normal[index].qty++;
            if(type == 'guest')$scope.menu.guest[index].qty++;
            updateTotal();
        }

        $scope.subtract = function(index, type){
            if(type == 'normal' && $scope.menu.normal[index].qty!=0)$scope.menu.normal[index].qty--
            if(type == 'guest' && $scope.menu.guest[index].qty!=0)$scope.menu.guest[index].qty--
            updateTotal();
        }

        $scope.confirm = function(){
            Users.confirmOrder($scope.menu, $scope.user, function(){
                $scope.back();
            });
        }

        $scope.addGuest = function(ev){
            var dialog = {
                controller: AddGuestController,
                templateUrl: 'views/dialog/addguest.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    menu: $scope.menu.guest,
                    id: 0,
                    title: null,
                    index: 0
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog).then(function(newMenu){
                $scope.menu.guest = newMenu;
                updateTotal();
            });
        }

        $scope.history = function(ev){
            var dialog = {
                controller: HistoryController,
                templateUrl: 'views/dialog/history.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    user: $scope.user
                },
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(answer){
                var currentBalance = $scope.user.balance;
                $scope.user.balance = $scope.user.balance + parseInt(answer);
                Users.pay($scope.user._id, parseInt(answer), function(success){
                    if(success){
                        $scope.user.balance = parseInt(currentBalance) + parseInt(answer);
                    }
                });
            });
        }

        $scope.addDates = function(ev, type){
            var dialog = {
                controller: RebateController,
                templateUrl: 'views/dialog/rebate.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    user: $scope.user,
                    type: type
                },
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog);
        }

        $scope.rebateDeliveryHitory = function(ev, type){
            var dialog = {
                controller: RebateDeliveryDialogController,
                templateUrl: 'views/dialog/rebateDeliveryHistory.html',
                parent: angular.element(document.body),
                fullscreen: true,
                locals: {
                    user: $scope.user,
                    type: type
                },
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(success){});
        }

        $scope.pay = function(ev){
            var dialog = {
                controller: DialogController,
                templateUrl: 'views/dialog/pay.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    userId: $scope.user.id
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog).then(function(answer){
                var currentBalance = $scope.user.balance;
                $scope.user.balance = $scope.user.balance + parseInt(answer);
                Users.pay($scope.user._id, parseInt(answer), function(success){
                    if(success){
                        $scope.user.balance = parseInt(currentBalance) + parseInt(answer);
                    }
                });
            });
        }

        $scope.utensils = function(ev){
            var dialog = {
                controller: AddUtensilsController,
                templateUrl: 'views/dialog/addutensils.html',
                parent: angular.element(document.querySelector('#userDetailContainer')),
                targetEvent: ev,
                locals:{
                    user: $scope.user
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog);
        }

    function updateTotal(){
        var menu = $scope.menu;
        var total = 0,totalguest = 0;
        for(var i=0; i<menu.normal.length; i++){
            var subtotal = menu.normal[i].qty * menu.normal[i].price;
            var subtotalguest = menu.guest[i].qty * menu.guest[i].price;
            menu.normal[i].subtotal = subtotal;
            menu.guest[i].subtotal = subtotalguest;
            total +=  subtotal;
            totalguest +=  subtotalguest;
        }
        $scope.menu = menu;
        $scope.subtotal = total + totalguest;
        $scope.subtotalguest = totalguest;
    }
});

posControllers.controller('MenuCtrl',
    function($scope, $mdDialog, $mdToast, Menu, Constants) {
        $scope.title = "Mess Menu";
        Menu.all(function(menu){
            $scope.days = menu;
        });

        $scope.editMainMenu = function(dayIndex, mealTypeIndex, ev){
        var dialog = {
            controller: SuggestMenuDialogController,
            templateUrl: 'views/dialog/suggestMenuByMeal.html',
            parent: angular.element(document.body),
            fullscreen: true,
            targetEvent: ev,
            locals:{
                menu: $scope.days[dayIndex].type[mealTypeIndex],
                title: Constants.dayName(dayIndex)
            },
            clickOutsideToClose: false
        };
        $mdDialog.show(dialog).then(function(data){
            $scope.days[dayIndex].type[mealTypeIndex] = data.newMenu;
            Menu.suggest(dayIndex, mealTypeIndex, data.roomNo, data.newMenu, function(success){
                $mdToast.show($mdToast.simple().textContent('Successfully submitted!').hideDelay(1000));
            });
        });
    }

    });

posControllers.controller('ComplaintCtrl',
    function($scope, $mdToast, Complaint) {
        $scope.title = "Submit Complaint";
        $scope.reset = function() {
            $scope.complaint = {};
        };

    $scope.submit = function(complaint) {
        Complaint.insert(complaint, function(success){
            var message = "Error in submitting, Please check!";
            if(success){
                $scope.show = true;
                message = "Successfully submitted!";
            }
            $mdToast.show($mdToast.simple().textContent(message).hideDelay(1000));
        })
    };
});


posControllers.controller('SummaryCtrl',
    function($scope, $timeout, Users, $mdDialog) {
        $scope.title = "Transactions Summary";
        $scope.date = new Date();
        $scope.totalCollection = 0;
        loadData();

        function loadData(){
            Users.summary(function(data){
                $scope.day = data;
            });
        }

        $scope.showDeliveryAddress = function(index, ev){
            var dialog = {
                controller: DeliveryAddressDialogController,
                templateUrl: 'views/dialog/deliveryAddress.html',
                parent: angular.element(document.body),
                fullscreen: true,
                locals: {
                    index: index,
                    title: $scope.day.meals[index].name,
                    users: $scope.day.meals[index].deliveryUsers
                },
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(success){});
        }
});

posControllers.controller('AccountsCtrl',
    function($scope, $mdDialog, $state, Users) {
        Users.all(function(docs){
            $scope.users = docs;
        });

        $scope.cancelRegistration = function(index, ev){
             var confirm = $mdDialog.confirm().title('Are you sure you want to cancel registration and return sum of Rs'+ $scope.users[index].balance+' back to '+$scope.users[index].name+'?').targetEvent(ev).clickOutsideToClose(true).ok('Yes').cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                Users.remove($scope.users[index], function(success){
                    $scope.users.splice(index, 1);
                });
            });

        }

        $scope.openUserDetail = function(ev, query){
            $state.go('common.user', {'query' : query});
        };
});


posControllers.controller('StaffCtrl',
    function($scope, $mdDialog, $mdToast, Staff) {
        loadData();

        $scope.changePin = function(ev){
            var changePassword = {
                controller: ChangePasswordDialogController,
                templateUrl: 'views/dialog/changePassword.html',
                parent: angular.element(document.body),
                escapeToClose: false,
                clickOutsideToClose: false };
            $mdDialog.show(changePassword).then(function(success){
                if(success) $mdToast.show($mdToast.simple().textContent('PIN updated').hideDelay(1000));
            });
        }
        $scope.addNewStaff = function(ev){
            var dialog = {
                controller: AddNewStaffDialogController,
                templateUrl: 'views/dialog/addNewStaff.html',
                parent: angular.element(document.body),
                fullscreen: true,
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(){
                loadData();
                $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
            });
        }

        $scope.remove = function(index, ev){
             var confirm = $mdDialog.confirm().title('Are you sure you want to delete?').targetEvent(ev).clickOutsideToClose(true).ok('Yes').cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                Staff.remove($scope.staffs[index], function(success){
                    loadData();
                });
            });

        }

        function loadData(){
            Staff.all(function(docs){
                $scope.staffs = docs;
            });
        }
    });

posControllers.controller('StockCtrl',
    function($scope, $mdDialog, $mdToast, Stock) {

        loadData();

        $scope.addNewItem = function(ev){
            var dialog = {
                controller: AddStockDialogController,
                templateUrl: 'views/dialog/addItemInStock.html',
                parent: angular.element(document.body),
                fullscreen: true,
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(){
                loadData();
                $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
            });
        }

        $scope.editStocks = function(ev){
            var dialog = {
                controller: EditStockDialogController,
                templateUrl: 'views/dialog/editStocks.html',
                parent: angular.element(document.body),
                fullscreen: true,
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(){
                loadData();
            });
        }

        $scope.useStock = function(index, ev, type){
            var dialog = {
                controller: UseStockDialogController,
                templateUrl: 'views/dialog/useStock.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals:{
                    item: $scope.stocks[index],
                    title: type
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog).then(function(data){
                if(type==="Use"){
                    Stock.use($scope.stocks[index], data.quantity, function(success){
                        if(success){
                            loadData();
                            $mdToast.show($mdToast.simple().textContent('Successfully used!').hideDelay(1000));
                        }
                    });
                }else{
                    Stock.add($scope.stocks[index], data, function(success){
                        if(success){
                            loadData();
                            $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
                        }
                    });
                }
            });
        }

        function loadData(){
            Stock.all(function(docs){
                $scope.stocks = docs;
            });
        }
});

posControllers.controller('PermanentStockCtrl',
    function($scope, $mdDialog, $mdToast, PermanentStock) {

        loadData();

        $scope.addNewItem = function(ev){
            var dialog = {
                controller: AddPermanentStockDialogController,
                templateUrl: 'views/dialog/addItemInPermanentStock.html',
                parent: angular.element(document.body),
                fullscreen: true,
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(){
                loadData();
                $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
            });
        }

        $scope.issuedDetail = function(index, ev){
            var dialog = {
                controller: IssuedDetailDialogController,
                templateUrl: 'views/dialog/issuedDetail.html',
                parent: angular.element(document.body),
                fullscreen: true,
                locals: {
                    utensil: $scope.stocks[index]
                },
                targetEvent: ev,
                clickOutsideToClose: true
            };
            $mdDialog.show(dialog).then(function(newDoc){
                $scope.stocks[index] = newDoc;
            });
        }

        $scope.addQuantityPermanentStock = function(index, ev, type){
            var dialog = {
                controller: AddQuantityInPermanentStockDialogController,
                templateUrl: 'views/dialog/addQuantityInPermanentStock.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals:{
                    item: $scope.stocks[index],
                },
                clickOutsideToClose: false
            };
            $mdDialog.show(dialog).then(function(quantity){
                PermanentStock.add($scope.stocks[index], quantity, function(success){
                    if(success){
                        loadData();
                        $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
                    }
                });
            });
        }

        function loadData(){
            PermanentStock.all(function(docs){
                $scope.stocks = docs;
            });
        }
});


posControllers.controller('ExpensesCtrl',
    function($scope, $mdToast, Expense) {
        $scope.title = "Submit Expense";
        $scope.reset = function() {
            $scope.expense = {};
        };

    $scope.addAnother = function(){
        $scope.show = false;
    }

    $scope.submit = function(expense) {
        Expense.insert(expense, function(success){
            var message = "Error in submitting, Please check!";
            if(success){
                $scope.reset();
                $scope.show = true;
                message = "Successfully submitted!";
            }
            $mdToast.show($mdToast.simple().textContent(message).hideDelay(1000));
        })
    };

    });

posControllers.controller('EditMenuCtrl',
    function($scope, $mdDialog, $mdToast, Menu, Constants) {
    $scope.title = "Edit Mess Menu";
    // Menu.insert();
    Menu.all(function(menu){
        $scope.days = menu;
    });

    $scope.editMainMenu = function(dayIndex, mealTypeIndex, ev){
        var dialog = {
            controller: EditMainMenuDialogController,
            templateUrl: 'views/dialog/editMainMenuByMeal.html',
            parent: angular.element(document.body),
            fullscreen: true,
            targetEvent: ev,
            locals:{
                menu: $scope.days[dayIndex].type[mealTypeIndex],
                title: Constants.dayName(dayIndex)
            },
            clickOutsideToClose: false
        };
        $mdDialog.show(dialog).then(function(newMenu){
            $scope.days[dayIndex].type[mealTypeIndex] = newMenu;
            messMenu = $scope.days;
            Menu.update(dayIndex, $scope.days, function(success){
                $mdToast.show($mdToast.simple().textContent('Successfully updated!').hideDelay(1000));
            });
        });
    }

    $scope.addExtra = function(dayIndex, mealTypeIndex, ev){
        var dialog = {
            controller: AddExtraMenuDialogController,
            templateUrl: 'views/dialog/addExtra.html',
            parent: angular.element(document.body),
            fullscreen: true,
            targetEvent: ev,
            locals:{
                menu: $scope.days[dayIndex].type[mealTypeIndex],
                title: Constants.dayName(dayIndex)
            },
            clickOutsideToClose: false
        };
        $mdDialog.show(dialog).then(function(newExtra){
            var size = 0;
            if(!(typeof $scope.days[dayIndex].type[mealTypeIndex].extra === 'undefined')){
                size = $scope.days[dayIndex].type[mealTypeIndex].extra.length;
            }
            $scope.days[dayIndex].type[mealTypeIndex].extra[size] = newExtra;
            messMenu = $scope.days;
            Menu.update(dayIndex, $scope.days, function(success){
                $mdToast.show($mdToast.simple().textContent('Successfully updated!').hideDelay(1000));
            });
        });
    }
});


function UserDialogController($scope, $mdDialog, Users, user) {
    $scope.user = user;
    $scope.cancel = function(){
        $mdDialog.cancel();
    }
}

function AddGuestController($scope, $mdDialog, Users, menu, id, index, title){
    $scope.menu = menu;
    $scope.title = title;
    $scope.newMenu = angular.copy(menu);

    $scope.cancel = function(){
        $mdDialog.cancel();
    }

    $scope.add = function(index){
        $scope.newMenu[index].qty++;
        $scope.newMenu[index].subtotal = $scope.newMenu[index].qty * $scope.newMenu[index].price;
    }

    $scope.subtract = function(index){
        if($scope.newMenu[index].qty!=0)$scope.newMenu[index].qty--;
        $scope.newMenu[index].subtotal = $scope.newMenu[index].qty * $scope.newMenu[index].price;
    }

    $scope.updateMenu = function(newMenu){
        $scope.menu = newMenu;
        $mdDialog.hide($scope.menu);
    }

    $scope.updateAmount = function(newMenu){
    }

    $scope.collectAmount = function(newMenu){
        $scope.menu = newMenu;
        $mdDialog.hide(index);
    }
}


function EditUserProfileController($scope, $mdDialog, Users, user){
    $scope.newUser = angular.copy(user);
    $scope.newUser.phoneNo = parseInt($scope.newUser.phoneNo)
    $scope.cancel = function(){
        $mdDialog.cancel();
    }

    $scope.updateUser = function(newUser){
        Users.updateUser(newUser, function(success){
            if(success)$mdDialog.hide(newUser);
            else $mdDialog.cancel();
        });
    }

}


function AddUtensilsController($scope, $mdDialog, PermanentStock, user, $mdToast){
    loadData();

    $scope.cancel = function(){
        $mdDialog.cancel();
    }

    $scope.add = function(index){
        $scope.utensils[index].quantity++;
        $scope.updateUtensilsIssued($scope.utensils[index]);
    }

    $scope.subtract = function(index){
        if($scope.utensils[index].quantity!=0){
            $scope.utensils[index].quantity--;
            $scope.updateUtensilsIssued($scope.utensils[index]);
        }
    }

    $scope.updateUtensilsIssued = function(utensil){
        PermanentStock.updateUserUtensils(utensil, user, function(success){
            $mdToast.show($mdToast.simple().textContent('Successfully updated!').hideDelay(1000));
        });
    }

    function loadData(){
        PermanentStock.utensilsByUser(user, function(utensils){
            $scope.utensils = utensils;
        });
    }
}

function LockScreenDialogController($scope, $mdDialog, Password) {
    $scope.unlock = function(){
        Password.getCurrentPassword(function(password){
            if($scope.pin == password)$mdDialog.hide();
        });
    }
}

function ChangePasswordDialogController($scope, $mdDialog, Password) {
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.changePassword = function(){
        Password.changePassword(parseInt($scope.currentPassword), parseInt($scope.newPassword), function(success){
            if(success)$mdDialog.hide(true);
            else{
                $scope.message = "Invalid current password";
                $scope.currentPassword = "";
                $scope.newPassword = "";
            }
        });
    }
}

function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}

function UseStockDialogController($scope, $mdDialog, item, title){
    $scope.item = item;
    $scope.title = title;
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function() {
        var amount = 0;
        if(title === "Use")amount = $scope.amount2;
        else amount = $scope.amount1;
        $mdDialog.hide({quantity: parseInt(amount), price: parseInt($scope.price1)});
    };
}

function AddQuantityInPermanentStockDialogController($scope, $mdDialog, item){
    $scope.item = item;
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function() {
        var amount = $scope.quantity;
        $mdDialog.hide(parseInt(amount));
    };
}

function SuggestMenuDialogController($scope, $mdDialog, title, menu) {
    $scope.title = title;
    $scope.menu = menu;
    $scope.newMenu = angular.copy(menu);
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.updateMenu = function(newMenu){
        newMenu.name = $scope.menu.name;
        if(typeof newMenu.extra === 'undefined'){
            newMenu.extra = [];
        }
        $scope.menu = newMenu;
        $mdDialog.hide({newMenu: $scope.menu, roomNo: $scope.roomNo});
    }
}

function RegisterDialogController($scope, $mdDialog, Users) {
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.user = {balance: 1000};

    $scope.reset = function() {
        $scope.user = {balance: 1000};
    };

    $scope.register = function(user) {
        if(typeof user.balance === 'undefined')$scope.user.message = "Invalid registration amount";
        else{
            Users.insert(user, function(success){
                if(success){
                    $mdDialog.hide();
                }else{
                    $scope.user.message = "This user is already registered.";
                }
            })
        }
    };
}

function EditMainMenuDialogController($scope, $mdDialog, title, menu) {
    $scope.title = title;
    $scope.menu = menu;
    $scope.newMenu = angular.copy(menu);

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.remove = function(index) {
        $scope.newMenu.extra.splice(index, 1);
    }

    $scope.updateMenu = function(newMenu){
        newMenu.name = $scope.menu.name;
        if(typeof newMenu.extra === 'undefined'){
            newMenu.extra = [];
        }
        $scope.menu = newMenu;

        $mdDialog.hide($scope.menu);
    }
}

function AddExtraMenuDialogController($scope, $mdDialog, title, menu) {
    $scope.title = title;
    $scope.menu = menu;
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.addExtra = function(newExtra){
        $mdDialog.hide(newExtra);
    }
}

function AddStockDialogController($scope, $mdDialog, Stock){
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.units = ["kg", "grams", "litre", "ml", "pieces","packets"]
    $scope.reset = function() {
        $scope.stock = {};
    };

    $scope.add = function(stock) {
        Stock.insert(stock, function(success){
            if(success){
                $mdDialog.hide();
            }else{
                $scope.message = "Item is already present.";
            }
        })
    };
}

function AddPermanentStockDialogController($scope, $mdDialog, PermanentStock){
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.reset = function() {
        $scope.stock = {};
    };

    $scope.add = function(stock) {
        PermanentStock.insert(stock, function(success){
            if(success){
                $mdDialog.hide();
            }else{
                $scope.message = "Item is already present.";
            }
        })
    };
}

function AddNewStaffDialogController($scope, $mdDialog, Staff){
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.positions = ["Helper", "Manager", "Cook"];
    $scope.reset = function() {
        $scope.staff = {};
    };

    $scope.add = function(staff) {
        Staff.insert(staff, function(success){
            if(success){
                $mdDialog.hide();
            }else{
                $scope.message = "Staff with same name is already present.";
            }
        })
    };
}

function IssuedDetailDialogController($scope, $mdDialog, PermanentStock, utensil){
    $scope.cancel = function() {
        PermanentStock.stockById(utensil._id, function(doc){
            $mdDialog.hide(doc);
        })
    };
    $scope.title = utensil.name;
    loadData();

    $scope.collect = function(index, ev) {
        var user = {roomNo: $scope.items[index].roomNo, phoneNo: $scope.items[index].phoneNo};
        PermanentStock.utensilsByUser(user, function(stocks){
            var newUtensil;
            for(var i=0; i<stocks.length; i++){
                if(stocks[i]._id == utensil._id)newUtensil = stocks[i];
            }
            newUtensil.quantity -= 1;
            PermanentStock.updateUserUtensils(newUtensil, user, function(success){
                $scope.items.splice(index, 1);
            });
        });

    };

    function loadData(){
        PermanentStock.utensilByUser(utensil._id, function(docs){
            $scope.items = docs;
        });
    }
}

function RebateDeliveryDialogController($scope, $mdDialog, Users, user, type){
    $scope.cancel = function() {
        $mdDialog.hide();
    };
    $scope.title = type;
    loadData();

    $scope.remove = function(index, ev) {
        Users.removeDeliveryRebate($scope.lists[index]._id, type, function(){
            loadData();
        });
    };

    function loadData(){
        Users.loadDeliveryRebate(user._id, type, function(docs){
            $scope.lists = docs;
        });
    }
}

function DeliveryAddressDialogController($scope, $mdDialog, users, index, title){
    $scope.cancel = function() {
        $mdDialog.hide();
    };
    $scope.title = title;
    loadData();

    function loadData(){
        $scope.lists = users;
    }
}

function EditStockDialogController($scope, $mdDialog, Stock, $mdToast){
    $scope.cancel = function() {
        $mdDialog.hide();
    };
    $scope.title = "Edit Stocks";
    loadData();

    $scope.updateItem = function(index) {
        Stock.edit($scope.stocks[index], function(){
            $mdToast.show($mdToast.simple().textContent('Successfully updated!').hideDelay(1000));
        });
    };

    function loadData(){
        Stock.all(function(docs){
            $scope.stocks = docs;
        });
    }
}

function RebateController($scope, $mdDialog, $mdToast, Users, Constants, user, type){
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.title = type;
    loadData();

    $scope.changeStartDateMin = function(){
        $scope.startMinDate = new Date();
        $scope.startDate.timings = Constants.checkRebateAvailability($scope.startDate, type).timings;
    }

    $scope.reset = function(){
        loadData();
    }

    $scope.add = function() {
        if(type === "rebate"){
            Users.addRebate(user, $scope.startDate, $scope.endDate, $scope.allBreakfast, $scope.allLunch, $scope.allDinner, function(){
                $mdDialog.hide(true);
                $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
            });
        }else{
            Users.addDelivery(user, $scope.startDate, $scope.endDate, $scope.allBreakfast, $scope.allLunch, $scope.allDinner, function(){
                $mdDialog.hide(true);
                $mdToast.show($mdToast.simple().textContent('Successfully added!').hideDelay(1000));
            });
        }
    };

    function loadData(){
        $scope.startDate = Constants.checkRebateAvailability(Constants.rebateDate("start"), type);
        $scope.endDate = Constants.rebateDate("end");
        $scope.endMinDate = new Date();
        $scope.allBreakfast = true;
        $scope.allLunch = true;
        $scope.allDinner = true;
    }
}

function HistoryController($scope, $mdDialog, $filter, user, Users, MaterialCalendarData){
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    var history = [];
    $scope.dayFormat = "d";
    $scope.detail = {amount: 0};

    loadData({'year' : new Date().getFullYear(), 'month' : new Date().getMonth() + 1});
    $scope.firstDayOfWeek = 1; // First day of the week, 0 for Sunday, 1 for Monday, etc.
    $scope.setDirection = function(direction) {
      $scope.direction = direction;
      $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
    };

    $scope.prevMonth = function(data) {
        loadData(data);
    };

    $scope.nextMonth = function(data) {
        loadData(data);
    };

    $scope.setDayContent = function(date) {
        return "";
    };

    $scope.dayClick = function(date) {
        var year =  $filter("date")(date, "yyyy");
        var month =  $filter("date")(date, "M");
        var date =  $filter("date")(date, "d");
        $scope.detail = getDetailByDay(date);
    };

    function loadData(data){
        history = [];
        Users.history(data.year, data.month, user._id, function(docs){
            history = docs;
            var numOfDays = new Date(data.year, data.month, 0).getDate();
            for(var i=0; i<numOfDays; i++){
                var detail = getDetailByDay(i+1);
                var content = "NILL";
                if(detail.amount!=0) content = "Rs" + detail.amount + "/-";
                MaterialCalendarData.setDayContent(new Date(data.year, data.month-1, i+1), content);
            }
        });
    }

    function getDetailByDay(day){
        var amount = 0;
        var balance = 0;
        var balanceSelected = false;
        var balanceSelected2 = false;
        var detail = {amount : amount, balance : balance, meals : []};
        for(var i=0; i<history.length; i++){
            var d = history[i];
            if(d.createdAt.getDate() == day){
                console.log("found");
                amount += d.amount;
                if(d.type === "breakfast"){
                    if(!balanceSelected2)balance = d.balance;
                    detail.meals.push(d);
                }else if(d.type === "lunch"){
                    if(!balanceSelected)balance = d.balance;
                    detail.meals.push(d);
                }
                else if(d.type === "dinner"){
                    balance = d.balance; balanceSelected = true;
                    detail.meals.push(d);
                }
            }
        }
        detail.amount = amount;
        detail.balance = balance;
        return detail;
    }
}
