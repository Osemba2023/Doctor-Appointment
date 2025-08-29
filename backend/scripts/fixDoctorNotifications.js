const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/UserModel"); // ✅ Correct model

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("✅ MongoDB connected");

    const users = await User.find({
      $or: [
        { "unseenNotifications.onClickPath": { $regex: "^/doctor-appointments/" } },
        { "seenNotifications.onClickPath": { $regex: "^/doctor-appointments/" } }
      ]
    });

    for (let user of users) {
      let updated = false;

      // ✅ Update unseen
      user.unseenNotifications = user.unseenNotifications.map((notif) => {
        if (!notif.onClickPath.includes("/details") && notif.onClickPath.includes("/doctor-appointments/")) {
          notif.onClickPath = `/doctor-appointments/details/${notif.onClickPath.split("/").pop()}`;
          updated = true;
        }
        return notif;
      });

      // ✅ Update seen
      user.seenNotifications = user.seenNotifications.map((notif) => {
        if (!notif.onClickPath.includes("/details") && notif.onClickPath.includes("/doctor-appointments/")) {
          notif.onClickPath = `/doctor-appointments/details/${notif.onClickPath.split("/").pop()}`;
          updated = true;
        }
        return notif;
      });

      if (updated) {
        console.log(`✅ Updated notifications for user: ${user.email}`);
        await user.save();
      }
    }

    console.log("🎉 Notifications updated successfully");
    process.exit(0);
  })
  .catch(err => console.error(err));


