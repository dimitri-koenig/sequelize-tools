'use strict';

var Path      = require('path'),
    Sequelize = require('sequelize'),
    config    = require('config');

var DbConnection = (function () {
    function DbConnection(attrs) {
        var self = this;

        this.attrs = attrs;
        this.testEnv = (this.attrs.testEnv != null) && this.attrs.testEnv;

        console.log('Initializing DB connection for ' + this.attrs.dbName);

        this.sqlConnection = new Sequelize(
            this.attrs.dbName,
            this.attrs.user,
            this.attrs.password,
            this.attrs.options
        );

        this.sqlConnection.authenticate()
            .then(function () {
                console.log('Connected to ' + self.attrs.dbName);
                self.authenticated = true;
                self.authHandlers().forEach(function (handler) {
                    handler.apply(self);
                });
                self._authHandlers = [];
            })
            .catch(function (err) {
                console.log('Unable to connect to database: ' + err);
            });
    }

    DbConnection.defaultConnection = function () {
        return this._defaultConnection ||
            (this._defaultConnection = new DbConnection(this.chooseEnvConfig()));
    };

    DbConnection.chooseEnv = function () {
        if (process.env.npm_lifecycle_event === 'test') {
            process.env.NODE_ENV = 'test';
        }
        if (process.env.NODE_ENV && process.env.NODE_ENV.length > 0) {
            return process.env.NODE_ENV;
        }

        console.log('NODE_ENV not defined. Defaulting to "development"');
        return 'development';
    };

    DbConnection.chooseEnvConfig = function () {
        var configPath = process.env.SEQUELIZE_DB_CONFIG,
            dbEnv = this.chooseEnv(),
            envConfig = config.get('dbConfig');

        if (dbEnv === 'test') {
            envConfig.testEnv = true;
        }

        return envConfig;
    };

    DbConnection.reinit = function (success) {
        this._defaultConnection = null;

        this.init(success);
    };

    DbConnection.init = function (success) {
        this.defaultConnection().onAuth(function () {
            this.sync()
                .then(function () {
                    success();
                })
                .catch(function (err) {
                    console.log('Unable to sync DB: ' + err);
                });
        });
    };

    DbConnection.sequelize = function () {
        return this.defaultConnection().sqlConnection;
    };

    DbConnection.prototype.authHandlers = function () {
        return (this._authHandlers = this._authHandlers || []);
    };

    DbConnection.prototype.onAuth = function (handler) {
        if (!this.authenticated) {
            this.authHandlers().push(handler);
        } else {
            handler.apply(this);
        }
    };

    DbConnection.prototype.sync = function () {
        return this.sqlConnection.sync();
    };

    return DbConnection;
})();

module.exports = DbConnection;
