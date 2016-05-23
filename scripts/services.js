'use strict';

/* Services */

var posServices = angular.module('posServices', ['ngResource']);
var Datastore = require('nedb');
var userDb = new Datastore({ filename: 'data/user', autoload: true, timestampData : true });
var rebateDb = new Datastore({ filename: 'data/rebate', autoload: true, timestampData : true });
var deliveryDb = new Datastore({ filename: 'data/delivery', autoload: true, timestampData : true });
var date = new Date();
var month = date.getMonth() + 1;
var year = date.getFullYear();
var orderDb = new Datastore({ filename: 'data/orders', autoload: true, timestampData: true });
var postpaidDb = new Datastore({ filename: 'data/postpaid', autoload: true, timestampData: true });
var mealClosedStatusDb = new Datastore({ filename: 'data/mealClosedStatus', autoload: true, timestampData: true });
var updateDb = new Datastore({ filename: 'data/updates', autoload: true, timestampData: true });
var menuDb = new Datastore({ filename: 'data/menu', autoload: true, timestampData: true });
var suggestmenuDb = new Datastore({ filename: 'data/suggestmenu', autoload: true, timestampData: true });
var paymentsDb = new Datastore({ filename: 'data/payments', autoload: true, timestampData: true });
var complaintDb = new Datastore({ filename: 'data/complaint', autoload: true, timestampData: true });
var expenseDb = new Datastore({ filename: 'data/expenses', autoload: true, timestampData: true });
var stockDb = new Datastore({ filename: 'data/stock', autoload: true, timestampData: true });
var permanentStockDb = new Datastore({ filename: 'data/permanentstock', autoload: true, timestampData: true });
var stockAddedHistoryDb = new Datastore({ filename: 'data/stockaddedhistory', autoload: true, timestampData: true });
var stockUsedHistoryDb = new Datastore({ filename: 'data/stockusedhistory', autoload: true, timestampData: true });
var utensilsDb = new Datastore({ filename: 'data/utensils', autoload: true, timestampData: true });
var staffDb = new Datastore({ filename: 'data/staff', autoload: true, timestampData: true });
var permanentStockAddHistoryDb = new Datastore({ filename: 'data/permanentStockAddHistory', autoload: true, timestampData: true });
var passwordDb = new Datastore({ filename: 'data/password', autoload: true, timestampData: true });
var scope = this;


posServices.service('Menu', function(Constants){

    this.byDay = function(day){

    },
    this.all = function(callBack){
        return menuDb.findOne({id : 1}, function(err, doc){
            if(doc){
                return callBack(getMenu(doc.menu));
            }else{
                return insert(function(menu){
                    return callBack(getMenu(menu));
                });
            }

            function insert(callBack){
                return passwordDb.insert({pin: 8905, id: 1}, function(err, doc){
                    console.log(doc);
                    var menu = [
                            {'name' : 'Breakfast', 'mainmenu' : '', 'mainmenu_normalprice' : 0, 'mainmenu_guestprice' : 0, 'extra' : [] },
                            {'name' : 'Lunch', 'mainmenu' : '', 'mainmenu_normalprice' : 0, 'mainmenu_guestprice' : 0, 'extra' : [] },
                            {'name' : 'Snacks', 'mainmenu' : '', 'mainmenu_normalprice' : 0, 'mainmenu_guestprice' : 0, 'extra' : [] },
                            {'name' : 'Dinner', 'mainmenu' : '', 'mainmenu_normalprice' : 0, 'mainmenu_guestprice' : 0, 'extra' : [] },
                        ];
                    var menus = [];
                    for(var i=0; i<=7; i++){
                        menus[i] = menu;
                    }
                    return menuDb.insert({menu : menus, id: 1}, function(err, newDoc) {
                            if(err == null) return callBack(menus);
                            else return callBack(false);
                    });
                });
            }

            function getMenu(doc){
                var menu = [];
                for(var i=0; i<=7; i++){
                    menu.push({day : Constants.dayName(i), type : doc[i]});
                }
                return menu;
            }
        });
    },
    this.parseMenuByDay = function(menu){
        var day = new Date().getDay();
        if(day==0)day = 7;
        return {'breakfast' : 
                    {'daily' : menu[0].type[0].mainmenu, 'extra' : menu[0].type[0].extra.concat(menu[day].type[0].extra), 'main' : menu[day].type[0].mainmenu, 'normalprice' : menu[day].type[0].mainmenu_normalprice, 'guestprice' : menu[day].type[0].mainmenu_guestprice
                    }, 'lunch' : {
                        'daily' : menu[0].type[1].mainmenu, 'extra' : menu[0].type[1].extra.concat(menu[day].type[1].extra), 'main' : menu[day].type[1].mainmenu, 'normalprice' : menu[day].type[0].mainmenu_normalprice, 'guestprice' : menu[day].type[0].mainmenu_guestprice
                    }, 'dinner' : {'daily' : menu[0].type[3].mainmenu, 'extra' : menu[0].type[3].extra.concat(menu[day].type[3].extra), 'main' : menu[day].type[3].mainmenu, 'normalprice' : menu[day].type[0].mainmenu_normalprice, 'guestprice' : menu[day].type[0].mainmenu_guestprice}
                };
    },
    this.byMealTiming = function(menu, user){
        menu = this.parseMenuByDay(menu);
        var time = Constants.messTimingDisplayFormat();
        if(time.breakfast.show)return this.getMeals(menu.breakfast, user);
        if(time.lunch.show)return this.getMeals(menu.lunch, user);
        if(time.dinner.show)return this.getMeals(menu.dinner, user);
    },
    this.update = function(dayIndex, menu, callBack){
        var newMenu = [];
        for(var i=0; i<=7; i++){
            newMenu[i] = angular.fromJson(angular.toJson(menu[i].type));
        }
        return menuDb.update({ id: 1 }, { $set: { menu: newMenu } }, {}, function (err, docs) {
            return callBack(true);
        });
    },
    this.suggest = function(dayIndex, mealTypeIndex, room, newMenu, callBack){
        var roomNo = room.length!=10 ? room : "";
        var phoneNo = room.length==10 ? room : "";
        suggestmenuDb.insert({dayIndex: dayIndex, mealTypeIndex: mealTypeIndex, roomNo : roomNo, phoneNo: phoneNo, newMenu: angular.fromJson(angular.toJson(newMenu)), seen: false}, function(){
            return callBack(true);
        });
    },
    this.getMeals = function(menu, user){
        var items = [{name : 'General Meal', price : menu.normalprice, qty: 1, subtotal : menu.normalprice, veg: true}];
        var guestitems = [{name : 'General Meal', price : menu.guestprice, qty: 0, subtotal : 0, veg: true}];
        items[0].qty = this.qtyIfVisited(items[0], user.items, 'normal');
        guestitems[0].qty = this.qtyIfVisited(guestitems[0], user.items, 'guest');
        if(user.type=="guest"){guestitems[0].qty = 1; items[0].qty = 0;}
        for(var i=0; i<menu.extra.length; i++){
            var item = {name : menu.extra[i].name, price : menu.extra[i].normalprice, qty: 0, subtotal: 0, veg: menu.extra[i].veg};
            var guestitem = {name : menu.extra[i].name, price : menu.extra[i].guestprice, qty: 0, subtotal: 0, veg: menu.extra[i].veg};
            if(user.veg && menu.extra[i].veg && menu.extra[i].default){item.qty = 1; item.subtotal = item.price;}
            if(!user.veg && !menu.extra[i].veg && menu.extra[i].default){item.qty = 1; item.subtotal = item.price;}
            item.qty = this.qtyIfVisited(item, user.items, 'normal');
            guestitem.qty = this.qtyIfVisited(guestitem, user.items, 'guest');
            items.push(item);
            guestitems.push(guestitem);
        }
        return {'normal' : items, 'guest' : guestitems};
    },
    this.qtyIfVisited = function(item, cart, type){
        for(var i=0; i<cart.length; i++){
            if(cart[i].name === item.name && cart[i].type===type)return cart[i].qty;
        }
        return item.qty;
    }
});

posServices.service('Users',
    function($q, dateFilter, Constants, Menu, Cart){
        var startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        var endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 0);

        this.all = function(callBack) {
            return userDb.find({}, function (err, docs) {
                callBack(docs);
            });
        },
        this.updateVeg = function(user,callBack){
            return userDb.update({_id: user._id}, {$set: {veg: user.veg}}, {}, function(err, doc){
                return callBack(true);
            });
        },
        this.updateUser = function(user,callBack){
            return userDb.findOne({ $or: [{ roomNo: user.roomNo }, { phoneNo: user.phoneNo }] }, function(err, doc){
                if(!doc || (doc._id === user._id)){
                    console.log(user.email);
                    return userDb.update({_id: user._id}, {$set: {veg: user.veg, name: user.name, dob: user.dob, address: user.address, phone: user.phoneNo, roomNo: user.roomNo, email: user.email}}, {}, function(err, doc){
                        return callBack(true);
                    });
                }
                else return callBack(false);
            });
            
        },
        this.updateUpdateTime = function(updatedAt, callBack){
            return updateDb.remove({}, {}, function(err, numRemoved){
                return updateDb.insert(updatedAt, function(){
                    return callBack(true);
                });
            });
        },
        this.updateData = function(callBack){
            return updateDb.findOne({}).sort({ createdAt: 1 }).exec(function(err, doc){
                var data = [{"name": "userDb", "data" : []}, 
                            {"name": "complaintDb", "data" : []},
                            {"name": "expenseDb", "data" : []}, 
                            {"name": "postpaidDb", "data" : []},
                            {"name": "rebateDb", "data" : []},
                            {"name": "deliveryDb", "data" : []},
                            {"name": "suggestmenuDb", "data" : []},
                            {"name": "orderDb", "data" : []},
                            {"name": "mealClosedStatusDb", "data" : []},
                            {"name": "paymentsDb", "data" : []},
                            {"name": "stockDb", "data" : []},
                            {"name": "stockAddedHistoryDb", "data" : []},
                            {"name": "permanentStockDb", "data" : []},
                            {"name": "utensilsDb", "data" : []},
                            {"name": "menuDb", "data" : []},
                            {"name": "stockUsedHistoryDb", "data" : []},
                            {"name": "staffDb", "data" : []}], updateTime = {}, i=0;
                if(!doc){
                    doc = {};
                    angular.forEach(data, function(db){
                        doc[db.name] = {};
                        doc[db.name].updatedAt = new Date(2001, 1, 1, 1, 1, 1, 1);
                    });
                }
                var dayPromises = [];
                angular.forEach(data, function (db) {
                    var deferred = $q.defer();
                    dayPromises.push(deferred.promise);
                    getData(db, function(updateData){
                        db.data = updateData;
                        updateTime[db.name] = {};
                        updateTime[db.name].updatedAt = new Date();
                        deferred.resolve();
                    });
                });
                $q.all(dayPromises).then(function () {
                    angular.forEach(data, function(db){
                        if(db.data.length) i++;
                    });
                    if(i == 0)data = [];
                    return callBack({data: data, updatedAt: updateTime});
                });
                function getData(db, callBack){
                    var lastUpdatedTime = doc[db.name].updatedAt;
                    scope[db.name].find({$or: [{createdAt: {$gte: lastUpdatedTime}}, {updatedAt: {$gte: lastUpdatedTime}}]}, 
                        function(err, docs){
                            return callBack(docs);
                    });
                }
            });
        },
        this.insert = function(user, callBack) {
            return this.search(user.roomNo, function(found){
                if(found!=null && found._id != "0"){
                    return callBack(false);
                }else{
                    userDb.insert({name: user.name, dob: user.dob, roomNo: user.roomNo, phoneNo : user.phoneNo, balance: user.balance,email : user.email, address: user.address, veg : !user.nonveg, registered: true}, function (err, newDoc) {
                        if(err == null) return callBack(true);
                        else return callBack(false);
                    });
                }
            });
        },
        this.closeMealHour = function(menu, messMenu, mealType, callBack){
            var price = parseInt(menu[mealType].normalprice);
            return userDb.find({}, function(err, users){
                var promises = users.map(function (user) {
                    return orderDb.findOne({$and: [{ createdAt: {$gte : startTime}}, { createdAt: {$lte : endTime}}], type: mealType, userId: user._id}, function(err, doc){
                        if(!doc){
                            var searchParam = {userId: user._id, active: true, endDate: {$gte : startTime}};
                            deliveryDb.find(searchParam, function(err, deliveryDates){
                                if(checkDates(deliveryDates, mealType)){
                                    user.visited = false; user.items = []; user.type = "normal";
                                    var newMenu = Menu.byMealTiming(messMenu, user);
                                    var cart = Cart.getCart(newMenu);
                                    orderDb.insert({type : mealType, userId : user._id, items : cart.items, amount : cart.amount, visited : false, balance : user.balance - cart.amount, delivery: true}, function(){
                                            userDb.update({_id: user._id }, {$set: { balance : user.balance - cart.amount} }, {}, function(err){
                                            return callBack(true);
                                        });
                                    });
                                }else{
                                    rebateDb.find(searchParam, function(err, rebateDates){
                                        if(!checkDates(rebateDates, mealType)){
                                            orderDb.insert({type : mealType, userId : user._id, items : [], amount : price, visited : false, delivery: false, balance : user.balance - price}, function(){
                                                    userDb.update({_id: user._id }, {$set: { balance : user.balance - price} }, {}, function(err){
                                                    });
                                                });
                                        }
                                    });
                                }

                                function checkDates(dates, mealType){
                                    date = new Date();
                                    for(var i=0; i<dates.length; i++){
                                        if(dates[i].startDate <= date){
                                            if(dates[i].startDate.getMonth()==date.getMonth() && dates[i].startDate.getDate()==date.getDate()){
                                                for(var j=0; j<dates[i].startDateTimings.length; j++){
                                                    if(dates[i].startDateTimings[j].value == mealType && dates[i].startDateTimings[j].checked)return true;
                                                }
                                            }else if(dates[i].endDate.getMonth()==date.getMonth() && dates[i].endDate.getDate()==date.getDate()){
                                                for(var j=0; j<dates[i].endDateTimings.length; j++){
                                                    if(dates[i].endDateTimings[j].value == mealType && dates[i].endDateTimings[j].checked)return true;
                                                }
                                            }else{
                                                if(dates[i].allDinner && mealType=="dinner")return true;
                                                if(dates[i].allLunch && mealType=="lunch")return true;
                                                if(dates[i].allBreakfast && mealType=="breakfast")return true;
                                            }
                                        }
                                    }
                                    return false;
                                }
                            });
                        }
                    });
                });

                $q.all(promises).then(function () {
                    return mealClosedStatusDb.insert({day: date.getDate(), type: mealType}, function(err, newDoc){
                        return callBack(true);
                    });
                });
            });
        },
        this.checkMealClosed = function(mealType, callBack){
            return mealClosedStatusDb.findOne({day: date.getDate(), type: mealType, createdAt: {$gte : startTime}}, function(err, doc){
                if(doc)return callBack(true);
                else return callBack(false);
            });
        },
        this.remove = function(user, callBack){
            return this.search(user.roomNo, function(found){
                if(found!=null){
                    return userDb.update({ _id: user._id }, {$set: {registered: false}}, {}, function (err, numRemoved) {
                        return paymentsDb.insert({userId: user._id, amount: -1 * user.balance, balance: 0}, function(err, newDoc) {
                                if(err == null) return callBack(true);
                                else return callBack(false);
                        });
                    });
                }else return callBack(false);
            });
        },
        this.addRebate = function(user, startDate, endDate, allBreakfast, allLunch, allDinner, callBack){
            if(endDate.value==null)endDate= startDate;
            return rebateDb.insert({userId: user._id, startDate: startDate.value, startDateTimings: angular.fromJson(angular.toJson(startDate.timings)), endDateTimings: angular.fromJson(angular.toJson(endDate.timings)), endDate: endDate.value, allBreakfast: allBreakfast, allLunch: allLunch, allDinner: allDinner, active: true}, function(err, newDoc){
                return callBack(true);
            });
        },
        this.addDelivery = function(user, startDate, endDate, allBreakfast, allLunch, allDinner, callBack){
            if(endDate.value==null)endDate = startDate;
            return deliveryDb.insert({userId: user._id, startDate: startDate.value, startDateTimings: angular.fromJson(angular.toJson(startDate.timings)), endDateTimings: angular.fromJson(angular.toJson(endDate.timings)), endDate: endDate.value, allBreakfast: allBreakfast, allLunch: allLunch, allDinner: allDinner, active: true}, function(err, newDoc){
                return callBack(true);
            });
        },
        this.summary = function(callBack){
            var data = this.getDays();
            var dayPromises = [];

            angular.forEach(data, function (day) {
                var deferred = $q.defer();
                dayPromises.push(deferred.promise);
                calculateSummaryByDay(day, function(call){
                    deferred.resolve();
                });
            });
            
            $q.all(dayPromises).then(function () {
                for(var i=0; i<data[0].meals; i++){
                    data[0].meals[i].lastWeekData = [data[1].meals[i].totalRegisteredUserAte[0] + data[1].meals[i].totalNonRegisteredUserAte[0], data[1].meals[i].totalRegisteredUserAte[1] + data[1].meals[i].totalNonRegisteredUserAte[1]];
                }
                userDb.find({}, function(err, users){
                    var userPromises = [];
                    angular.forEach(users, function(user){
                        user.rebate = {};
                        user.delivery = {};
                        var deferred = $q.defer();
                        userPromises.push(deferred.promise);
                        checkRebateDelivery(user, data[0].meals,function(call){
                            deferred.resolve();
                        });
                    });

                    $q.all(userPromises).then(function(){
                        for(var i=0; i< data[0].meals.length; i++){
                            for(var j=0; j<users.length; j++){
                                if(!users[j].rebate[data[0].meals[i].name]){
                                    if(users[j].veg)data[0].meals[i].totalRegisteredUsers[0] += 1;
                                    else data[0].meals[i].totalRegisteredUsers[1] += 1;
                                }
                                if(users[j].delivery[data[0].meals[i].name]){
                                    data[0].meals[i].deliveryUsers.push({name: users[j].name, veg: users[j].veg, address: users[j].address});
                                    if(users[j].veg)data[0].meals[i].totalDeliveryOrders[0] += 1;
                                    else data[0].meals[i].totalDeliveryOrders[1] += 1;   
                                }
                            }
                        }
                        console.log(data[0]);
                        return callBack(data[0]);
                    });

                    function checkRebateDelivery(user, meals, callBack){
                        var searchParam = {userId: user._id, active: true, endDate: {$gte : startTime}};

                            deliveryDb.find(searchParam, function(err, deliveryDates){
                                rebateDb.find(searchParam, function(err, rebateDates){
                                    for(var i=0; i<meals.length; i++){
                                        user.rebate[meals[i].name] = false;
                                        user.delivery[meals[i].name] = false;
                                        console.log(rebateDates);
                                        console.log(user.roomNo);
                                        if(checkDates(deliveryDates, meals[i].name)){
                                            user.delivery[meals[i].name] = true;
                                        }else if(checkDates(rebateDates, meals[i].name)){
                                            user.rebate[meals[i].name] = true;
                                        }
                                    }
                                    return callBack(user);
                                });
                            });
                            function checkDates(dates, mealType){
                                date = new Date();
                                for(var i=0; i<dates.length; i++){
                                    if(dates[i].startDate <= date){
                                        if(dates[i].startDate.getMonth()==date.getMonth() && dates[i].startDate.getDate()==date.getDate()){
                                            for(var j=0; j<dates[i].startDateTimings.length; j++){
                                                if(dates[i].startDateTimings[j].value == mealType && dates[i].startDateTimings[j].checked)return true;
                                            }
                                        }else if(dates[i].endDate.getMonth()==date.getMonth() && dates[i].endDate.getDate()==date.getDate()){
                                            for(var j=0; j<dates[i].endDateTimings.length; j++){
                                                if(dates[i].endDateTimings[j].value == mealType && dates[i].endDateTimings[j].checked)return true;
                                            }
                                        }else{
                                            if(dates[i].allDinner && mealType=="dinner")return true;
                                            if(dates[i].allLunch && mealType=="lunch")return true;
                                            if(dates[i].allBreakfast && mealType=="breakfast")return true;
                                        }
                                    }
                                }
                                return false;
                            }
                    }
                });
            });

            function calculateSummaryByDay(day, callBack){
                return orderDb.find({$and: [{ createdAt: {$gte : startTime}}, { createdAt: {$lte : endTime}}]}, function(err, docs){
                    var collection = 0;
                    day.meals = getMeals();
                    for(var i=0; i<docs.length; i++){
                        var doc = docs[i];
                        if(doc.userId == "0")collection += doc.amount;
                        if(doc.type == "breakfast")mealUseInc(day.meals[0], doc);
                        if(doc.type == "lunch")mealUseInc(day.meals[1], doc);
                        if(doc.type == "dinner")mealUseInc(day.meals[2], doc);
                    }

                    function mealUseInc(meal, cart){
                        if(cart.userId == "0"){
                            meal.collection += cart.amount;
                            if(isVeg(cart.items))meal.totalNonRegisteredUserAte[0] += getUserNumber(cart.items);
                            else meal.totalNonRegisteredUserAte[1] += getUserNumber(cart.items);
                        }else{
                            if(isVeg(cart.items))meal.totalRegisteredUserAte[0] += getUserNumber(cart.items);
                            else meal.totalRegisteredUserAte[1] += getUserNumber(cart.items);
                        }
                    }

                    function isVeg(items){
                        for(var i=0; i<items.length; i++){
                            if(!items[i].veg) return false;
                        }
                        return true;
                    }

                    function getUserNumber(items){
                        var numOfPlates = 0;
                        for(var i=0; i<items.length; i++){
                            if(items[i].name === "General Meal") numOfPlates += items[i].qty;
                        }
                        return numOfPlates;
                    }

                    function getMeals(){
                        var meal = {
                            name: 'breakfast', 
                            collection: 0,
                            totalRegisteredUsers: [0, 0], 
                            totalRegisteredUserAte: [0, 0],
                            totalNonRegisteredUserAte: [0, 0],
                            totalDeliveryOrders: [0, 0],
                            lastWeekData: [0,0],
                            deliveryUsers: []
                        };
                        var meal1 = angular.fromJson(angular.toJson(meal)), meal2 = angular.fromJson(angular.toJson(meal)), meal3 = angular.fromJson(angular.toJson(meal));
                        var meals = [];
                        meals.push(meal1); meals.push(meal2); meals.push(meal3); 
                        meal2.name = 'lunch'; meal3.name = 'dinner';
                        return meals;
                    }
                    paymentsDb.find({createdAt: {$gte: startTime}}, function(err, payments){
                        for(var i=0; i<payments.length; i++){
                            collection += payments[i].amount;
                        }
                        day.totalCollection = collection;
                        callBack(day);
                    });
                    
                });
            }
        },
        this.getDays = function(){
            var today = {value: 'Today', date: date};

            var todayLastWeek = new Date(); todayLastWeek.setDate(date.getDate()-7);
            var todayLastWeek = {value: 'TodayLastWeek', date: todayLastWeek};

            return [today, todayLastWeek];
        },
        this.loadDeliveryRebate = function(userId, type, callBack){
            var date = new Date();
            var searchParam = {userId: userId, active: true, endDate: {$gte : startTime}};
            if(type=="delivery"){
                return deliveryDb.find(searchParam, function(err, docs){
                    return callBack(docs);
                });
            }else{
                return rebateDb.find(searchParam, function(err, docs){
                    return callBack(docs);
                });
            }
        },
        this.removeDeliveryRebate = function(id, type, callBack){
            if(type=="delivery"){
                return deliveryDb.update({_id: id}, {$set: {active: false}}, {}, function(){
                    return callBack(true);
                });
            }else{
                return rebateDb.update({_id: id}, {$set: {active: false}}, {}, function(){
                    return callBack(true);
                });
            }
        },
        this.confirmOrder = function(menu, user, callBack){
            var type = this.getMealType();
            var cart = Cart.getCart(menu);
            orderDb.findOne({$and: [{ createdAt: {$gte : startTime}}, { createdAt: {$lte : endTime}}], type : type, userId : user._id, }, function(err, docs){
                if(docs == null || user._id == "0"){
                    if(docs == null && user._id!="0"){
                        orderDb.insert({ type : type, userId : user._id, items : cart.items, amount : cart.amount, visited : true, balance : user.balance - cart.amount, delivery:false}, function(){
                            userDb.update({_id: user._id }, {$set: { balance : user.balance - cart.amount} }, {}, function(err){
                                return callBack(true);
                            });
                        });
                    }else if(user.prepaid){
                        orderDb.insert({type : type, userId : user._id, items : cart.items, amount : cart.amount, visited : true, balance : 0, roomNo: user.roomNo, phoneNo: user.phoneNo, delivery:false}, function(){
                            return callBack(true);
                        });
                    }else{
                        postpaidDb.insert({day : date.getDate(), type : type, paid: false, userId : user._id, amount : cart.amount, visited : true, balance : 0, roomNo: user.roomNo, phoneNo: user.phoneNo, user: angular.fromJson(angular.toJson(user)), menu: angular.fromJson(angular.toJson(menu))}, function(err){
                            return callBack(true);
                        });
                    }
                }else{
                    orderDb.update({_id : docs._id}, {$set: {amount: cart.amount, balance: user.balance + docs.amount - cart.amount, items: cart.items}}, {}, function(err){
                        userDb.update({_id: user._id }, {$set: { balance :  user.balance + docs.amount - cart.amount} }, {}, function(err){
                            return callBack(true);
                        });
                    });
                }
            });

        },
        this.postpaids = function(callBack){
            return postpaidDb.find({paid: false},function(err, docs){
                return callBack(docs);
            });
        },
        this.utensilsByUser = function(user, callBack){
            var searchParam = {returned: false, roomNo: user.roomNo };
            if(user.phoneNo.length==10)searchParam = {returned: false, phoneNo: user.phoneNo};
            return utensilsDb.find(searchParam,function(err, docs){
                return 
                return callBack(docs);
            });
        },
        this.search = function(query, callBack){
            query = query.trim();
            var type = this.getMealType();
            var searchParam = { roomNo: query };
            if(query.length==10)searchParam = {phoneNo: query};
            return userDb.findOne(searchParam, function (err, docs) {
                if(docs==null){
                    var phoneNo = query,roomNo = query;
                    if(query.length==10 && isInt(query))roomNo = "N/A";
                    else phoneNo = "N/A";
                    callBack({name: "Guest", roomNo: roomNo, phoneNo : phoneNo, balance: 0, email : "N/A", veg : true, type: 'guest', _id: '0', visited: false, items: [], prepaid: true});
                }else{
                    docs.type = "normal";
                    orderDb.findOne({$and: [{ createdAt: {$gte : startTime}}, { createdAt: {$lte : endTime}}], type : type, userId : docs._id }, function(err, cart){
                        docs.visited = cart ? cart.visited : false;
                        docs.items = cart ? cart.items : [];
                        callBack(docs);
                    });
                }
            });
        },
        this.updatePostpaidUser = function(id, menu, callBack){
            return postpaidDb.update({_id : id}, {$set : {menu : angular.fromJson(angular.toJson(menu)) }}, {}, function(){
                return callBack(true);
            });
        },
        this.collectFromPostpaidUser = function(postpaid, callBack){
            var type = this.getMealType();
            var user = postpaid.user;
            var cart = Cart.getCart(postpaid.menu);
            return postpaidDb.update({ _id: postpaid._id }, {$set: {paid: true}}, {}, function (err, numRemoved) {
                return orderDb.insert({type : type, userId : user._id, items : cart.items, amount : cart.amount, visited : true, balance : 0, roomNo: user.roomNo, phoneNo: user.phoneNo}, function(){
                    return callBack(true);
                });
            });
        },
        this.pay = function(id, amount, callBack){
            return userDb.findOne({ _id: id}, function(err, user){
                if(user && isInt(amount)){
                    return userDb.update({ _id: id }, { $set: { balance: user.balance + amount } }, {}, function () {
                        return paymentsDb.insert({userId: id, amount: amount, balance: user.balance + amount}, function(err, newDoc) {
                                if(err == null) return callBack(true);
                                else return callBack(false);
                        });
                    });
                }
            });
        },
        this.getMealType = function(){
            var time = Constants.messTimingDisplayFormat();
            var type = 'breakfast';
            if(time.breakfast.show)type = 'breakfast';
            if(time.lunch.show)type = 'lunch';
            if(time.dinner.show)type = 'dinner';
            return type;
        },
        this.history = function(year, month, userId, callBack){
            var historyStartTime = new Date(year, (month - 1), 1, 0, 0, 0, 0);
            var historyEndTime = new Date(year, (month - 1), 31, 23, 59, 59, 0);
            return orderDb.find({$and: [{ createdAt: {$gte : historyStartTime}}, { createdAt: {$lte : historyEndTime}}], userId: userId},
                function(err, docs) {
                    console.log(docs);
                return callBack(docs);
            });
        },
        this.historyByDay = function(year, month, day, userId, callBack){
            var historyStartTime = new Date(year, (month - 1), day, 0, 0, 0, 0);
            var historyEndTime = new Date(year, (month - 1), day, 23, 59, 59, 0);
            return orderDb.find({$and: [{ createdAt: {$gte : historyStartTime}}, { createdAt: {$lte : historyEndTime}}], userId: userId}, function(err, docs){
                var obj = {items : [], amount: 0, balance: 0};
                for(var i=0; i<docs.length; i++){
                    obj.items.push(docs[i]);
                    obj.amount += docs[i].amount;
                }
                return callBack(obj);
            });
        }
    });


posServices.service('Constants',
    function(dateFilter){
        var MESS_TIMING = [['07:00:00 am', '10:00:00 am'],['01:00:00 pm', '04:00:00 pm'],['08:00:00 pm', '11:00:00 pm']];
        var DAY_NAME = ['Daily', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        this.dayName = function(dayNumber) {
            return DAY_NAME[dayNumber];
        },
        this.rebateDate = function(type){
            var date = {value: new Date(), timings: [{value: "breakfast", disabled: false, checked: true}, {value: "lunch", disabled: false, checked: true}, {value: "dinner", disabled: false, checked: true}]};
            if(type == "end"){
                date = {value: null, timings: [{value: "breakfast", disabled: false, checked: true}, {value: "lunch", disabled: false, checked: true}, {value: "dinner", disabled: false, checked: true}]};
            }
            return date;
        },
        this.checkRebateAvailability = function(date, type){
            if(date.value.getDate() == new Date().getDate()){
                var timings = this.messTimingDisplayFormat();
                if(timings.breakfast.show){
                    if(type=="rebate"){date.timings[0].disabled = true; date.timings[0].checked = false;}
                }
                if(timings.lunch.show){
                    date.timings[0].disabled = true; date.timings[0].checked = false;
                    if(type=="rebate"){date.timings[1].disabled = true; date.timings[1].checked = false;}
                }
                if(timings.dinner.show){
                    date.timings[0].disabled = true; date.timings[0].checked = false;
                    date.timings[1].disabled = true; date.timings[1].checked = false;
                    if(type=="rebate"){date.timings[2].disabled = true; date.timings[2].checked = false;}
                }
            }
            else date = this.rebateDate("start");
            return date;
        },
        this.messTimingDisplayFormat = function() {
            return {'breakfast' : {'value' : MESS_TIMING[0][0].substr(0,5) + MESS_TIMING[0][0].substr(8,3) + ' to ' + MESS_TIMING[0][1].substr(0,5) + MESS_TIMING[0][1].substr(8,3), 'open' : this.timeInBtw(MESS_TIMING[0][0], MESS_TIMING[0][1]), 'show' : this.timeInBtw("00:01:00 am", MESS_TIMING[1][0]) }, 'lunch' : { 'value' : MESS_TIMING[1][0].substr(0,5) + MESS_TIMING[1][0].substr(8,3) + ' to ' + MESS_TIMING[1][1].substr(0,5) + MESS_TIMING[1][1].substr(8,3),'open' : this.timeInBtw(MESS_TIMING[1][0], MESS_TIMING[1][1]) ,'show' : this.timeInBtw(MESS_TIMING[1][0], MESS_TIMING[2][0]) }, 'dinner' : {'value' : MESS_TIMING[2][0].substr(0,5) + MESS_TIMING[2][0].substr(8,3) + ' to ' + MESS_TIMING[2][1].substr(0,5) + MESS_TIMING[2][1].substr(8,3),'open' : this.timeInBtw(MESS_TIMING[2][0], MESS_TIMING[2][1]) ,'show' : this.timeInBtw(MESS_TIMING[2][0], '11:59:59 pm') }};
        },
        this.timeInBtw = function(start, end) {
            var arbDate = '01/01/2011 ';
            if(Date.parse(arbDate + dateFilter(new Date(), 'hh:mm:ss a')) >= Date.parse(arbDate + start) && Date.parse(arbDate + dateFilter(new Date(), 'hh:mm:ss a')) <= Date.parse(arbDate + end))return true;
            return false;
        }
    });

posServices.service('Complaint',
    function(){
        this.insert = function(complaint, callBack) {
            var roomNo = complaint.roomNo.length!=10 ? complaint.roomNo : "";
            var phoneNo = complaint.roomNo.length==10 ? complaint.roomNo : "";
            return complaintDb.insert({roomNo: roomNo, phoneNo: phoneNo, desc: complaint.desc, seen: false}, function(err){
                return callBack(true);
            });
        }
    });

posServices.service('Expense',
    function(){
        this.insert = function(expense, callBack) {
            return expenseDb.insert({amount:expense.amount, desc: expense.desc}, function(err){
                return callBack(true);
            });
        }
    });

posServices.service('Stock',
    function(){
        this.insert = function(newItem, callBack) {
            return stockDb.findOne({name: newItem.name}, function(err, docs){
                if(docs)return callBack(false);
                return stockDb.insert({name: newItem.name, unit: newItem.unit, quantity: 0, threshold: newItem.threshold, rank: newItem.rank, price: [],show: true}, function(err, newDoc){
                    return callBack(true);
                });
            })
        },
        this.add = function(item, data, callBack) {
            if(data.quantity<0)return callBack(false);
            else{
                var price = angular.fromJson(angular.toJson(item.price));
                price.push(data);
                return stockDb.update({_id: item._id},{$set: { quantity: item.quantity + data.quantity, price: price }}, {}, function(err, newDoc){
                    return stockAddedHistoryDb.insert({itemId: item._id, quantity: data.quantity, price: data.price}, function(err, docs){
                        return callBack(true);
                    });
                });
            }
        },
        this.use = function(item, amount, callBack) {
            if(amount>item.quantity)return callBack(false);
            else{
                var quantity = amount, index=0, usedPrice = [], newPrice = [], price = angular.fromJson(angular.toJson(item.price));
                for(var i=0; i<item.price.length; i++){
                    index = i;
                    if(quantity <= item.price[i].quantity){
                        var partialPrice = (price[i].price/price[i].quantity)* quantity;
                        price[i].price -= partialPrice;
                        price[i].quantity -= quantity;
                        usedPrice.push({quantity: quantity, price: partialPrice});
                        break;
                    }else{
                        usedPrice.push(item.price[i]);
                    }
                    quantity -= price[i].quantity;
                }
                for(var i=0; i<price.length; i++){
                    if(i>=index && price[i].quantity!=0){
                        newPrice.push(price[i]);
                    }
                }
                return stockDb.update({_id: item._id},{$set: { quantity: item.quantity - amount, price:  newPrice}}, {}, function(err, newDoc){
                    return stockUsedHistoryDb.insert({itemId: item._id, quantity: amount, price: usedPrice}, function(err, docs){
                        return callBack(true);
                    });
                });
            }
        },
        this.all = function(callBack){
            return stockDb.find({show: true}).sort({ rank: 1 }).exec(function(err, docs){
                return callBack(docs);
            });
        },
        this.edit = function(stock, callBack){
            return stockDb.update({_id: stock._id}, {$set: {name: stock.name, rank: stock.rank, threshold: stock.threshold}}, {}, function(err, docs){
                return callBack(true);
            });
        }
    });

posServices.service('PermanentStock',
    function(){
        this.insert = function(newItem, callBack) {
            return permanentStockDb.findOne({name: newItem.name}, function(err, docs){
                if(docs)return callBack(false);
                return permanentStockDb.insert({name: newItem.name, quantity: 0, rank: newItem.rank, issued: 0, show: true, canBeIssued: newItem.canBeIssued}, function(err, newDoc){
                    return callBack(true);
                });
            })
        },
        this.add = function(item, quantity, callBack) {
            if(quantity<0)return callBack(false);
            else{
                return permanentStockDb.update({_id: item._id},{$set: { quantity: item.quantity + quantity }}, {}, function(err, newDoc){
                    return permanentStockAddHistoryDb.insert({itemId: item._id, quantity: quantity}, function(err, docs){
                        return callBack(true);
                    });
                });
            }
        },
        this.utensilsByUser = function(user, callBack){
            var searchParam = {returned: false, roomNo: user.roomNo };
            if(user.phoneNo.length==10)searchParam = {returned: false, phoneNo: user.phoneNo};
            return utensilsDb.find(searchParam,function(err, docs){
                return permanentStockDb.find({show: true, canBeIssued: true}).sort({rank : 1}).exec(function(err2, stocks){
                    var utensils = [];
                    for(var i=0; i< stocks.length; i++){
                        utensils.push({name: stocks[i].name, quantity: 0, _id: stocks[i]._id});
                        for(var j=0; j<docs.length; j++){
                            if(docs[j].utensilId == stocks[i]._id){
                                utensils[i].quantity = docs[j].quantity;
                            }
                        }
                    }
                    return callBack(utensils);
                });
            });
        },
        this.utensilByUser = function(id, callBack){
            return utensilsDb.find({utensilId: id, returned: false}, function(err, newDocs){
                var items = [];
                for(var i=0; i<newDocs.length; i++){
                    for(var j=0; j<newDocs[i].quantity; j++){
                        items.push({roomNo: newDocs[i].roomNo, phoneNo: newDocs[i].phoneNo, _id: newDocs[i]._id});
                    }
                }
                return callBack(items);
            });
        },
        this.stockById = function(id, callBack){
            return permanentStockDb.findOne({show: true, _id: id}).sort({ rank: 1 }).exec(function(err, docs){
                return callBack(docs);
            });
        },
        this.updateUserUtensils = function(utensil, user, callBack){
            var searchParam = {returned: false, roomNo: user.roomNo, utensilId: utensil._id };
            if(user.phoneNo.length==10)searchParam = {returned: false, phoneNo: user.phoneNo, utensilId: utensil._id};
            return permanentStockDb.findOne({_id: utensil._id}, function(err, permanentStock){
                return utensilsDb.findOne(searchParam,function(err, docs){
                    var quantity = permanentStock.issued;
                    if(docs){
                        if(utensil.quantity == 0){
                            quantity -= 1;
                            utensilsDb.update({_id: docs._id}, {$set: {returned: true}}, {}, function(err, numRemoved){
                                permanentStockDb.update({_id: utensil._id}, {$set: {issued:  quantity}}, {}, function(err, newDoc){
                                    return callBack(true);
                                });
                            });
                        }else{
                            if(docs.quantity < utensil.quantity)quantity += 1
                                else quantity -= 1;
                            utensilsDb.update({_id: docs._id}, {$set : {quantity: utensil.quantity}}, {}, function(err, newDoc){
                                permanentStockDb.update({_id: utensil._id}, {$set: {issued:  quantity}}, {}, function(err, newDoc){
                                    return callBack(true);
                                });
                            });
                        }
                    }else{
                        quantity += 1;
                        utensilsDb.insert({utensilId: utensil._id, roomNo: user.roomNo, phoneNo: user.phoneNo, returned: false, userId: user._id, quantity: utensil.quantity}, function(err, doc){
                            permanentStockDb.update({_id: utensil._id}, {$set: {issued: quantity}}, {}, function(err, newDoc){
                                    return callBack(true);
                            });
                        });
                    }
                });
            });
        },
        this.all = function(callBack){
            return permanentStockDb.find({show: true}).sort({ rank: 1 }).exec(function(err, docs){
                return callBack(docs);
            });
        }
    });

posServices.service('Staff',
    function(){
        this.insert = function(newItem, callBack) {
            return staffDb.findOne({name: newItem.name, working: true}, function(err, docs){
                if(docs)return callBack(false);
                return staffDb.insert({name: newItem.name, position: newItem.position, working: true}, function(err, newDoc){
                    return callBack(true);
                });
            })
        },
        this.remove = function(item, callBack) {
            return staffDb.update({_id: item._id},{$set: { working: false }}, {}, function(err, newDoc){
                    return callBack(true);
            });
        },
        this.all = function(callBack){
            return staffDb.find({working: true}, function(err, docs){
                return callBack(docs);
            });
        }
    });

posServices.service('Password',
    function(){
        this.getCurrentPassword = function(callBack){
            return passwordDb.findOne({id: 1}, function(err, doc){
                return callBack(doc.pin);
            });
        },
        this.changePassword = function(currentPassword, newPassword, callBack){
            this.getCurrentPassword(function(pin){
                if(currentPassword == pin){
                    return passwordDb.update({id: 1}, {$set: {pin: newPassword}}, {}, function(err, doc){
                        return callBack(true);
                    });
                }else return callBack(false);
            });
        }
    });


posServices.service('Cart',
    function(){
        this.getCart = function(menu){
            var amount = 0;
            var items = this.parseItems(menu.normal, 'normal');
            items = items.concat(this.parseItems(menu.guest, 'guest'));

            for(var i=0; i<items.length; i++){
                amount += items[i].subtotal;
            }
            return {'items' : items, amount : parseInt(amount)};
        },
        this.parseItems = function(menu, type){
            var items = [];
            for(var i=0; i<menu.length; i++){
                if(menu[i].qty!=0){
                    var item = angular.fromJson(angular.toJson(menu[i]));
                    item.type = type;
                    items.push(item);
                }
            }
            return items;
        }
    });

function currentTime(){
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth() + 1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    return year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;
}

function isInt(n) {
   return n % 1 === 0;
}