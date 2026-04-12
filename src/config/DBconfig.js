const sql = require("mysql2");

var config = {
    "user": "root", // Database username
    "password": "admin123", // Database password
    "host": "localhost", // Server IP address
    "database": "ponte_guapagt"// Database name
   
}
const connection = sql.createConnection(config);
connection.connect(err => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
        throw err;
    }
    console.log("Connection Successful!");
});

module.exports = connection; 