'use strict';

const Support = require('../support');
const { DataTypes } = require('@sequelize/core');
const util        = require('util');

const expectsql   = Support.expectsql;
const current     = Support.sequelize;
const sql         = current.dialect.queryGenerator;

describe(Support.getTestDialectTeaser('SQL'), () => {
  describe('group', () => {
    const testsql = function (options, expectation) {
      const model = options.model;

      it(util.inspect(options, { depth: 2 }), () => {
        return expectsql(
          sql.selectQuery(
            options.table || model && model.getTableName(),
            options,
            options.model,
          ),
          expectation,
        );
      });
    };

    const User = Support.sequelize.define('User', {
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
    });

    testsql({
      model: User,
      attributes: ['name'],
      group: ['name'],
    }, {
      default: 'SELECT `name` FROM `Users` AS `User` GROUP BY `name`;',
      postgres: 'SELECT "name" FROM "Users" AS "User" GROUP BY "name";',
      db2: 'SELECT "name" FROM "Users" AS "User" GROUP BY "name";',
      ibmi: 'SELECT "name" FROM "Users" AS "User" GROUP BY "name"',
      mssql: 'SELECT [name] FROM [Users] AS [User] GROUP BY [name];',
      snowflake: 'SELECT "name" FROM "Users" AS "User" GROUP BY "name";',
      mysql: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT name AS `name` FROM `Users` GROUP BY `name`) AS `_0_root.base`) AS `_1_root`;',
    });

    testsql({
      model: User,
      attributes: ['name'],
      group: [],
    }, {
      default: 'SELECT `name` FROM `Users` AS `User`;',
      postgres: 'SELECT "name" FROM "Users" AS "User";',
      db2: 'SELECT "name" FROM "Users" AS "User";',
      ibmi: 'SELECT "name" FROM "Users" AS "User"',
      mssql: 'SELECT [name] FROM [Users] AS [User];',
      snowflake: 'SELECT "name" FROM "Users" AS "User";',
      mysql: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'name\', (SELECT `_0_root.base`.`name` AS `name`)) AS `root` FROM (SELECT * FROM `Users` ) AS `_0_root.base`) AS `_1_root`;',
    });
  });
});
