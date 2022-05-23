import { DataTypes } from '@sequelize/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { expectsql, sequelize } from '../../support';

describe('QueryInterface#rawSelect', () => {
  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
  }, { timestamps: false });

  afterEach(() => {
    sinon.restore();
  });

  // you'll find more replacement tests in query-generator tests
  it('does not parse user-provided data as replacements', async () => {
    const stub = sinon.stub(sequelize, 'queryRaw');

    await sequelize.getQueryInterface().rawSelect(User.tableName, {
      // @ts-expect-error -- we'll fix the typings when we migrate query-generator to TypeScript
      attributes: ['id'],
      where: {
        username: 'some :data',
      },
      replacements: {
        data: 'OR \' = ',
      },
    }, 'id', User);

    expect(stub.callCount).to.eq(1);
    const firstCall = stub.getCall(0);
    expectsql(firstCall.args[0] as string, {
      default: `SELECT [id] FROM [Users] AS [User] WHERE [User].[username] = 'some :data';`,
      mssql: `SELECT [id] FROM [Users] AS [User] WHERE [User].[username] = N'some :data';`,
      mysql: 'SELECT coalesce(JSON_ARRAYAGG(`root`), json_array()) AS `root` FROM (SELECT json_object(\'id\', (SELECT `_0_root.base`.`id` AS `id`)) AS `root` FROM (SELECT * FROM `Users` WHERE `username` = \'some :data\') AS `_0_root.base`) AS `_1_root`;',
    });
  });
});
