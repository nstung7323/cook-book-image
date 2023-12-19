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

const User = new Schema(
  {
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts"}],
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "recipes"}]
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("User", User);

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
    quality: { type: String },
});

const reviewSchema = new Schema({
    star: { type: String },
    _id_user: { type: Schema.Types.ObjectId },
    comment: { type: String },
});

const stepSchema = new Schema({
    id: { type: Number },
    making: { type: String },
    img_url: { type: String }
});
const Recipes = new Schema({
    _id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name_food: { type: String },
    img_url: { type: String },
    video_url: { type: String },
    time: { type: String },
    ingredient: [ingredientSchema],
    step: [stepSchema],
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

const imgRecipesUploadMiddleware = upload.fields([
  { name: "img_ingredients", maxCount: 10 },
  { name: "img_making", maxCount: 10 },
]);

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

    const newPost = await new post(data).save();
    await user.findByIdAndUpdate(
      req.body._id_author,
      { $push: { posts: newPost._id }}
    );
    res.status(200).send({ message: 'Thêm bài viết thành công' });
  });
});

app.post("/recipes", (req, res) => {
  console.log(req.body.name_food);
  console.log(req.body.time);
  console.log(req.body);
  imgRecipesUploadMiddleware(req, res, async (err) => {
    const ingredients = req.files.img_ingredients.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        name: req.body[`name${index}`],
        quality: req.body[`quality${index}`],
        img_url: url,
      }
    });
                                                      
    const steps = req.files.img_making.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        id: req.body[`step${index}`],
        making: req.body[`making${index}`],
        img_url: url,
      }
    });
    
    const data = {
      _id_user: req.body._id_user,
      name_food: req.body.name_food,
      img_url: req.body.img_url,
      video_url: req.body.video_url,
      time: req.body.time,
      ingredient: ingredients,
      step: steps,
      topics: req.body.topics,
    };

    const newRecipe = await new recipes(data).save();
    await user.findByIdAndUpdate(
      req.body._id_user,
      { $push: { recipes: newRecipe._id }}
    );
    res.status(200).send({ message: 'Thêm công thức thành công' });
  });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

module.exports = app;
