const apiVersion = '1.0.0';

var Router = require('restify-router').Router;
var router = new Router();
var resultFormatter = require("../../result-formatter");
var passport = require('../../passports/local-passport');

router.post('/', passport, (request, response, next) => {
    var account = request.user;
    var permissionMap = account.roles.map((role) => {
        return role.permissions.reduce((map, permission, index) => {
            var key = permission.unit.code;
            if (!map.has(key))
                map.set(key, 0);
            var mod = map.get(key);
            mod = mod | permission.permission;
            map.set(key, mod);

            return map;
        }, new Map());
    }).reduce((map, curr, index) => {
        curr.forEach((value, key) => {
            if (!map.has(key))
                map.set(key, 0);
            var mod = map.get(key);
            mod = mod | value;
            map.set(key, mod);
        });
        return map;
    }, new Map());

    var permission = {};
    permissionMap.forEach((value, key) => {
        permission[key] = value;
    });

    var jwt = require("jsonwebtoken");
    var token = jwt.sign({
        username: account.username,
        profile: account.profile,
        // roles: account.roles,
        permission: permission
    }, process.env.AUTH_SECRET);

    var result = resultFormatter.ok(apiVersion, 200, token);
    response.send(200, result);
});
module.exports = router;
