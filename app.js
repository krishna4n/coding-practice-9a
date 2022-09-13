const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initiateDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};
initiateDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser == undefined) {
    if (password.length > 5) {
      const hashPassword = await bcrypt.hash(password, 10);
      const postQuery = `insert into user(username,name,password,gender,location) values('${username}','${name}','${hashPassword}','${gender}','${location}')`;
      await db.run(postQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser == undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const userMatch = await bcrypt.compare(password, dbUser.password);
    if (userMatch == true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getUserQuery);
  const cPasswordStatus = await bcrypt.compare(oldPassword, db.password);
  if (cPasswordStatus == true) {
    if (newPassword.length > 5) {
      const hashPassword = await bcrypt.hash(newPassword, 10);
      const passwordUpdateQuery = `update user set password = '${hashPassword} where username = '${username}''`;
      await db.run(passwordUpdateQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
