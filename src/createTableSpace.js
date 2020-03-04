const oracledb = require('oracledb');

var createTablespace = async function(config) {
	let connection;
	var connectionConfig = {
        user:config.createSetup.connectionConfig.user,
        password:config.createSetup.connectionConfig.password,
        connectString:config.createSetup.connectionConfig.connectString,
		privilege: oracledb.SYSDBA
    }
  try {

    let sql, binds, options, result;
    connection = await oracledb.getConnection(connectionConfig);
	var dataFile = config.createSetup.tablespace+".dbf"
	var qry = "BEGIN EXECUTE IMMEDIATE 'CREATE TABLESPACE "+config.createSetup.tablespace+" LOGGING DATAFILE ''"+dataFile+"'' SIZE 150M AUTOEXTEND ON NEXT  50M MAXSIZE UNLIMITED EXTENT MANAGEMENT LOCAL ONLINE PERMANENT'; EXECUTE IMMEDIATE 'CREATE USER "+config.createSetup.tablespace+" IDENTIFIED BY "+config.createSetup.tablespace+" DEFAULT TABLESPACE "+config.createSetup.tablespace+" TEMPORARY TABLESPACE temp'; EXECUTE IMMEDIATE 'GRANT CONNECT, RESOURCE TO "+config.createSetup.tablespace+"'; EXECUTE IMMEDIATE 'GRANT DBA TO "+config.createSetup.tablespace+"'; EXCEPTION WHEN OTHERS THEN IF SQLCODE NOT IN (-00942) THEN RAISE; END IF; END;"
    console.log("qry : "+qry)
	await connection.execute(qry);
	console.log("Tablespace created successfully")
	return {"status":"success","msg":"Tablespace created successfully"};

  } catch (err) {
    return {"status":"unsuccess","msg":err};
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        return {"status":"unsuccess","msg":err};
      }
    }
  }
}
module.exports = createTablespace;