const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const port = 3000;

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "./public/upload"); // Thư mục uploads

    // Tạo thư mục uploads nếu chưa tồn tại
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

app.post("/upload_image", upload.array("images", 3), (rqe, res) => {
  res.send("File uploaded!");
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

module.exports = app;
