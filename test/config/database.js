exports.DBConfig = {
    test: {
        dbName:   'sequelize_tools_test',
        user:     null,
        password: null,
        options:  {
            dialect: 'sqlite',
            storage: __dirname + '/../../testdb.sqlite'
        }
    }
};
