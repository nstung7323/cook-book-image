const express = require("express");
const app = express();
const port = 3000;

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const API_URL = "https://cook-book-image.glitch.me";

app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.urlencoded({
    limit: "1000mb",
    extended: true,
  })
);
app.use(
  express.json({
    limit: "1000mb",
  })
);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");

try {
  mongoose.connect(
    "mongodb+srv://daophuong01072003:aS866N4miT3FymRs@cluster0.opyc2h1.mongodb.net/CookBook?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log("connection successful");
} catch (err) {
  console.log("connection failed: " + err.message);
}

const likeArr = new Schema({
  _id_users: { type: Schema.Types.ObjectId, ref: "User" },
});

const CommentArr = new Schema({
  _id_users: { type: Schema.Types.ObjectId, ref: "User" },
  comment: { type: String },
});

const Media = new Schema({
  type: { type: String, enum: ["image", "video"], required: true },
  url: { type: String, required: true },
});

const Post = new Schema(
  {
    _id_author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: { type: String },
    content: { type: String },
    time: { type: Date },
    media: [Media],
    likes: [{ type: mongoose.Schema.Types.ObjectId }],
    comments: [CommentArr],
    topics: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
  },
  {
    timestamps: true,
  }
);

const post = mongoose.model("posts", Post);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "./public/upload");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalname = file.originalname;
    const extension = path.extname(originalname);
    const newFilename = `${timestamp}_${originalname}`;
    console.log(newFilename);
    cb(null, newFilename);
  },
});

const upload = multer({ storage });

app.post("/post", (req, res) => {
  console.log(req.body);
  console.log(req.files);
  upload.array("media", 3)(req, res, async (err) => {
    const media = req.files.map((file) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url,
      };
    });

    const data = {
      _id_author: req.body._id_author,
      title: req.body.title,
      content: req.body.content,
      media,
      topics: req.body.topics,
    };

    await new post(data).save();
    res.status(200).send({ message: 'Thêm bài viết thành công' });
  });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

module.exports = app;
