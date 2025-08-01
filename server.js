const express = require("express");
const app = express();
const port = 3000;

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");

const API_URL = "https://cook-book-image.onrender.com";

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
app.use(cors());

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
    name: { required: true, type: String },
    email: { required: true, type: String },
    phone: { required: true, type: Number },
    avatar: { required: true, type: String },
    date: { required: true, type: String },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts" }],
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "recipes" }],
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
    vertify: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

Post.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
});

const post = mongoose.model("posts", Post);

const ingredientSchema = new Schema({
  name: { type: String },
  img_url: { type: String },
  quantity: { type: String },
});

const reviewSchema = new Schema({
  star: { type: String },
  _id_user: { type: Schema.Types.ObjectId },
  comment: { type: String },
});

const stepSchema = new Schema({
  id: { type: Number },
  making: { type: String },
  img_url: { type: String },
});
const Recipes = new Schema(
  {
    _id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name_food: { type: String },
    img_url: { type: String },
    video_url: { type: String },
    time: { type: String },
    ration: { type: Number },
    ingredient: [ingredientSchema],
    step: [stepSchema],
    evaluate: [reviewSchema],
    topics: { type: mongoose.Schema.Types.ObjectId, ref: "topic" },
    vertify: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
Recipes.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
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
  { name: "img", maxCount: 1 },
]);

const deleteImgAvatar = async (user) => {
  await fs.unlink(
    path.join(__dirname, `./public/upload/${user.avatar.split("upload/")[1]}`),
    (err) => {
      if (err) {
        console.error(`Lỗi khi xóa ảnh: ${err}`);
      } else {
        console.log(`Xóa ảnh thành công: ${path}`);
      }
    }
  );
};

const deleteImgPost = async (posts) => {
  for (const i of posts.media) {
    await fs.unlink(
      path.join(__dirname, `./public/upload/${i.url.split("upload/")[1]}`),
      (err) => {
        if (err) {
          console.error(`Lỗi khi xóa ảnh: ${err}`);
        } else {
          console.log(`Xóa ảnh thành công: ${path}`);
        }
      }
    );
  }
};

const deleteImgRecipeIngredient = async (recipe) => {
  for (const i of recipe.ingredient) {
    await fs.unlink(
      path.join(__dirname, `./public/upload/${i.img_url.split("upload/")[1]}`),
      (err) => {
        if (err) {
          console.error(`Lỗi khi xóa ảnh: ${err}`);
        } else {
          console.log(`Xóa ảnh thành công: ${path}`);
        }
      }
    );
  }
};

const deleteImgRecipeMaking = async (recipe) => {
  for (const i of recipe.step) {
    await fs.unlink(
      path.join(__dirname, `./public/upload/${i.img_url.split("upload/")[1]}`),
      (err) => {
        if (err) {
          console.error(`Lỗi khi xóa ảnh: ${err}`);
        } else {
          console.log(`Xóa ảnh thành công: ${path}`);
        }
      }
    );
  }
};

const deleteImgRecipe = async (recipe) => {
  await fs.unlink(
    path.join(
      __dirname,
      `./public/upload/${recipe.img_url.split("upload/")[1]}`
    ),
    (err) => {
      if (err) {
        console.error(`Lỗi khi xóa ảnh: ${err}`);
      } else {
        console.log(`Xóa ảnh thành công: ${path}`);
      }
    }
  );
};

app.put("/users/:id", upload.single("_avatar_user"), async (req, res) => {
  const User = await user.findOne({ _id: req.params.id });

  const link = "/upload/" + req.file?.filename;
  const url = API_URL + link;

  const data = {
    name: req.body.name,
    phone: req.body.phone,
    date: req.body.date,
    // avatar: url,
  };

  if (User) {
    if (req.file?.fieldname == "_avatar_user") {
      deleteImgAvatar(User);
      data.avatar = url;
    } else {
      data.avatar = User.avatar;
    }
  } else {
    if (req.file?.fieldname == "_avatar_user") {
      data.avatar = url;
      deleteImgAvatar(data);
    }
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "user not found",
      data: null,
    });
  }

  await user.updateOne({ _id: req.params.id }, { $set: data });
  return res.status(200).json({
    status: "success",
    code: 200,
    message: "Cập nhập thành công!",
    data: [],
  });
});

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
    // await user.findByIdAndUpdate(
    //   req.body._id_author,
    //   { $push: { posts: newPost._id }}
    // );
    res.status(200).send({ message: "Thêm bài viết thành công", data: newPost });
  });
});

app.patch("/post/:id", (req, res) => {
  upload.array("media", 10)(req, res, async (err) => {
    const p = await post.findById(req.params.id);

    const media = req.files?.map((file) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url,
      };
    });

    const data = {
      // _id_author: req.body._id_author,
      title: req.body.title,
      content: req.body.content,
      // media,
      topics: req.body.topics,
      vertify: 0,
    };

    if (p) {
      if (req.files.length) {
        deleteImgPost(p);
        data.media = media;
      } else {
        data.media = p.media;
      }
    } else {
      if (req.files.length) {
        data.media = media;
        deleteImgPost(data);
      }
      return res.status(404).json({ message: "post not found" });
    }

    await post.updateOne({ _id: req.params.id }, { $set: data });
    return res.status(200).json({ messeage: "Cập nhập bài viết thành công" });
  });
});

app.delete("/post/:id", async (req, res) => {
  const p = await post.findById(req.params.id);
  if (!p) {
    return res.status(404).json({ messegae: "post not found" });
  }

  deleteImgPost(p);

  await post.deleteOne({ _id: req.params.id });
  return res.status(200).json({ messeage: "Xóa bài viết thành công" });
});

app.post("/recipes", (req, res) => {
  imgRecipesUploadMiddleware(req, res, async (err) => {
    const ingredients = req.files.img_ingredients.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        name: req.body[`name${index}`],
        quantity: req.body[`quantity${index}`],
        img_url: url,
      };
    });

    const steps = req.files.img_making.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        id: req.body[`step${index}`],
        making: req.body[`making${index}`],
        img_url: url,
      };
    });

    const img_url = req.files.img.map((file, index) => {
      const link = "/upload/" + file.filename;
      const url = API_URL + link;
      return {
        url,
      };
    });

    const data = {
      _id_user: req.body._id_user,
      name_food: req.body.name_food,
      img_url: img_url[0].url,
      video_url: req.body.video_url,
      time: req.body.time,
      ration: req.body.ration,
      ingredient: ingredients,
      step: steps,
      topics: req.body.topics,
    };

    const newRecipe = await new recipes(data).save();
    // await user.findByIdAndUpdate(
    //   req.body._id_user,
    //   { $push: { recipes: newRecipe._id }}
    // );
    res.status(200).json({ message: "Thêm công thức thành công", data: newRecipe });
  });
});

app.patch("/recipes/:id", (req, res) => {
  try {
    imgRecipesUploadMiddleware(req, res, async (err) => {
      const recipe = await recipes.findById(req.params.id);

      const ingredients = req.files.img_ingredients?.map((file, index) => {
        const link = "/upload/" + file.filename;
        const url = API_URL + link;
        return {
          name: req.body[`name${index}`],
          quantity: req.body[`quantity${index}`],
          img_url: url,
        };
      });

      const steps = req.files.img_making?.map((file, index) => {
        const link = "/upload/" + file.filename;
        const url = API_URL + link;
        return {
          id: req.body[`step${index}`],
          making: req.body[`making${index}`],
          img_url: url,
        };
      });

      const img_url = req.files.img?.map((file, index) => {
        const link = "/upload/" + file.filename;
        const url = API_URL + link;
        return {
          url,
        };
      });

      const data = {
        // _id_user: req.body._id_user,
        name_food: req.body.name_food,
        // img_url: img_url[0].url,
        // video_url: req.body.video_url,
        time: req.body.time,
        ration: req.body.ration,
        // ingredient: ingredients,
        // step: steps,
        topics: req.body.topics,
        vertify: 0,
      };

      if (recipe) {
        if (req.files.img_ingredients) {
          deleteImgRecipeIngredient(recipe);
          data.ingredient = ingredients;
        } else {
          for (let i = 0; i < recipe.ingredient.length; i++) {
            if (req.body[`name${i}`]) {
              recipe.ingredient[i].name = req.body[`name${i}`];
            }
            if (req.body[`quantity${i}`]) {
              recipe.ingredient[i].quantity = req.body[`quantity${i}`];
            }
          }
          data.ingredient = recipe.ingredient;
        }
        if (req.files.img_making) {
          deleteImgRecipeMaking(recipe);
          data.step = steps;
        } else {
          for (let i = 0; i < recipe.step.length; i++) {
            if (req.body[`step${i}`]) {
              recipe.step[i].step = req.body[`step${i}`];
            }
            if (req.body[`making${i}`]) {
              recipe.step[i].making = req.body[`making${i}`];
            }
          }
          data.step = recipe.step;
        }
        if (req.files.img) {
          deleteImgRecipe(recipe);
          data.img_url = img_url[0].url;
        } else {
          data.img_url = recipe.img_url;
        }
      } else {
        if (req.files.img_ingredients) {
          data.ingredient = ingredients;
          deleteImgRecipeIngredient(data);
        }
        if (req.files.img_making) {
          data.step = steps;
          deleteImgRecipeMaking(data);
        }
        if (req.files.img_url) {
          data.img_url = img_url[0].url;
          deleteImgRecipe(data);
        }
        return res.status(404).json({ message: "Recipes not found" });
      }

      await recipes.updateOne({ _id: req.params.id }, { $set: data });
      // await user.findByIdAndUpdate(
      //   req.body._id_user,
      //   { $push: { recipes: newRecipe._id }}
      // );
      res.status(200).send({ message: "Cập nhập công thức thành công" });
    });
  } catch (err) {
    res.status(500).json({ err });
  }
});

app.delete("/recipes/:id", async (req, res) => {
  const recipe = await recipes.findById(req.params.id);
  if (!recipe) {
    return res.status(404).send({ message: "Không tìm thấy công thức" });
  }

  deleteImgRecipeIngredient(recipe);
  deleteImgRecipeMaking(recipe);
  deleteImgRecipe(recipe);

  await recipes.deleteOne({ _id: req.params.id });
  return res.status(200).send({ message: "Xóa công thức thành công" });
});

app.get("/", (req, res) => {
  return res.send("Deploy successfully");
})

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

module.exports = app;
