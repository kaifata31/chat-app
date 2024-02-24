const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});
//Connection to DB
require("./db/connection");

//importing files
const Users = require("./models/Users");
const Conversations = require("./models/Conversations");
const Messages = require("./models/Messages");
// const { connection } = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

let users = [];
io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, recieverId, message, conversationId }) => {
      const reciever = users.find((user) => user.userId === recieverId);
      const sender = users.find((user) => user.userId === senderId);
      const user = await Users.findById(senderId);
      console.log("sender :>> ", sender, reciever);
      if (reciever) {
        io.to(reciever.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            recieverId,
            user: { id: user._id, fullName: user.fullName, email: user.email },
          });
      } else {
        io.to(sender.socketId).emit("getMessage", {
          senderId,
          message,
          conversationId,
          recieverId,
          user: { id: user._id, fullName: user.fullName, email: user.email },
        });
      }
    }
  );

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
  // io.emit('getUsers', socket.userId);
});

//Routes

app.get("/", (req, res) => {
  res.send("welcome");
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).send("Please fill all required fields");
    } else {
      const isAlreadyExist = await Users.findOne({ email });
      if (isAlreadyExist) {
        res.status(400).send("User Already Exists");
      } else {
        const newUser = new Users({ fullName, email });
        bcryptjs.hash(password, 10, (err, hashedPassword) => {
          newUser.set("password", hashedPassword);
          newUser.save();
          next();
        });

        return res.status(200).send("User registered Successfully");
      }
    }
  } catch (error) {}
});

app.post("/api/login", async (req, res, next) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).send("Please fill all required fields");
    }

    // Find the user by their email in the database
    const user = await Users.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(400).send("User email or password is incorrect");
    }

    // Validate the password using bcryptjs
    const validateUser = await bcryptjs.compare(password, user.password);

    // Check if the password is valid
    if (!validateUser) {
      return res.status(400).send("User email or password is incorrect");
    }

    // If the email and password are correct, create a JWT token
    const payload = {
      userId: user._id,
      email: user.email,
    };

    const JWT_SECRET_KEY =
      process.env.JWT_SECRET_KEY || "THIS_IS_A_JWT_SECRET_KEY";

    jwt.sign(
      payload,
      JWT_SECRET_KEY,
      { expiresIn: 84600 },
      async (err, token) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Internal Server Error");
        }

        // Update the user's token in the database
        await Users.updateOne(
          { _id: user._id },
          {
            $set: { token },
          }
        );

        user.save();
        next();
      }
    );

    res.status(200).json({
      user: { id: user._id, email: user.email, fullName: user.fullName },
      token: user.token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, recieverId } = req.body;
    const newConversation = new Conversations({
      members: [senderId, recieverId],
    });

    await newConversation.save();
    res.status(200).send("Convesation created successfully");
  } catch (error) {
    console.log(error, "Error");
  }
});

app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversations.find({
      members: { $in: [userId] },
    });
    // res.status(200).send(conversations);
    const conversationUserData = Promise.all(
      conversations.map(async (conversation) => {
        const recieverId = conversation.members.find(
          (memberId) => memberId != userId
        );
        const user = await Users.findById(recieverId);

        return {
          user: {
            recieverId: user._id,
            fullName: user.fullName,
            email: user.email,
          },
          conversationId: conversation._id,
        };
      })
    );

    res.status(200).json(await conversationUserData);
  } catch (error) {
    console.log(error, "Error");
  }
});

app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, recieverId } = req.body;
    console.log(conversationId, senderId, message, recieverId);
    if (!senderId || !message)
      return res.status(400).send("Please fill all required fields");

    if (conversationId === "new" && recieverId) {
      const newConversation = new Conversations({
        members: [senderId, recieverId],
      });
      await newConversation.save();

      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        message,
      });
      await newMessage.save();
      return res.status(200).send("Message Sent Succesfully");
    } else if (!conversationId && !recieverId) {
      return res.status(400).send("Please fill all required fields");
    }

    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send("Message sent succesfully");
  } catch (error) {
    console.log(error, "Error");
  }
});

app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      const messages = await Messages.find({ conversationId });
      const messagesUserData = Promise.all(
        messages.map(async (message) => {
          const user = await Users.findById(message.senderId);

          return {
            user: { id: user._id, email: user.email, fullName: user.fullName },
            message: message.message,
          };
        })
      );
      res.status(200).json(await messagesUserData);
    };
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversation = await Conversations.find({
        members: { $all: [req.query.senderId, req.query.recieverId] },
      });

      if (checkConversation.length > 0) {
        checkMessages(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessages(conversationId);
    }
  } catch (error) {
    console.log("Error", error);
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await Users.find({ _id: { $ne: userId } });
    const userData = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            recieverId: user._id,
          },
        };
      })
    );

    res.status(200).json(await userData);
  } catch (error) {
    console.log(error, "Error");
  }
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("listening on port" + port);
});
