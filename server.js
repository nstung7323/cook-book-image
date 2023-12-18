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

const ingredientSchema = new Schema({
    name: { type: String },
    img_url: { type: String },
    quatity: { type: Number },
});

const reviewSchema = new Schema({
    star: { type: String },
    _id_user: { type: Schema.Types.ObjectId },
    comment: { type: String },
});

const stepSchema = new Schema({
    id: { type: Number },
    making: { type: String },
});
const Recipes = new Schema({
    _id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name_food: { type: String },
    img_url: { type: String },
    video_url: { type: String },
    ingredients: [ingredientSchema],
    steps:[stepSchema],
    evaluate: [reviewSchema],
    topics: { type: mongoose.Schema.Types.ObjectId, ref: 'topic' },
}, {
    timestamps: true,
});
Recipes.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true
});

const recipes = mongoose.model("recipes", Recipes);

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
  upload.array("media", 10)(req, res, async (err) => {
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

app.post("/recipes", (req, res) => {
  upload.array("media", 10)(req, res, async (err) => {
    const ingredients = req.files.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        name: req.body[`name${index}`],
        quality: req.body[`quality${index}`],
        img_url: url,
      };
    });
    
    let steps = [];
    let index = 1;
    let tmp = 0;
    while(tmp < Object.keys(req.body).length) {
      tmp++;
      if (Object.keys(req.body).includes(`step${index}`)) {
        const step = {
          id: req.body[`step${index}`],
          making: req.body[`making${index}`]
        }
        steps.push(step);
        index++;
      }
    }
    
    const data = {
      _id_user: req.body._id_user,
      name_food: req.body.name_food,
      img_url: req.body.img_url,
      video_url: req.body.video_url,
      ingredients,
      steps,
      topics: req.body.topics,
    };

    await new recipes(data).save();
    res.status(200).send({ message: 'Thêm công thức thành công' });
  });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

module.exports = app;
