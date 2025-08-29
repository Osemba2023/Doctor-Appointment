// utils/testRequire.js
const sendEmail = require("./sendEmails"); // "./" because both are in utils

console.log("sendEmail module loaded:", typeof sendEmail === "function");
