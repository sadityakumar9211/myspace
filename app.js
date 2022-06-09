//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.use(session({
    secret: "the secret is a secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-abhisekh:Test123@cluster0.nickj.mongodb.net/myspaceDB", { useNewUrlParser: true });


let user_ind = "";
let user_name = "";
let user_email = "";


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    year: Number,
    batch: String
});
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    user_id: String
});
const qaSchema = new mongoose.Schema({
    question: String,
    answers: [],
    user_id: String
});
const feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
const QA = mongoose.model("QA", qaSchema);
const FeedBack = mongoose.model("FeedBack", feedbackSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secret",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },
//     function (accessToken, refreshToken, profile, cb) {
//         User.findOrCreate({ googleId: profile.id }, function (err, user) {
//             return cb(err, user);
//         });
//     }
// ));


app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        user_ind = req.user._id;
        user_name = req.user.name;
        res.render("dashboard", { name: user_name, email: user_email });
    }
    else {
        res.render("landing");
    }
});


app.get("/article", function (req, res) {
    if (req.isAuthenticated()) {
        Post.find({}, function (err, posts) {
            res.render("article", {
                element: posts,
                name: user_name
            });
        });
    }
    else {
        res.render("landing");
    }
});



app.get("/compose", function (req, res) {
    res.render("compose");
});



app.post("/compose", function (req, res) {
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        user_id: user_ind
    });
    post.save();
    res.redirect("/article");
});


app.post("/feedback", function (req, res) {
    const feedback = new FeedBack({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message
    });
    feedback.save();
    res.render("feedback");
});

app.post("/deletepost", function (req, res) {
    const id = req.body.uid;
    Post.deleteOne({ _id: id }).then(function () {
        res.redirect("/article");
    }).catch(function (error) {
        res.redirect("/");
    });
});


app.post("/deleteqna", function (req, res) {
    const id = req.body.uid;
    QA.deleteOne({ _id: id }).then(function () {
        res.redirect("/qa");
    }).catch(function (error) {
        res.redirect("/");
    });
});



app.get("/about", function (req, res) {
    res.render("about");
}
);

app.get("/qa", function (req, res) {
    if (req.isAuthenticated()) {
        QA.find({}, function (err, qna) {
            res.render("qa", {
                element: qaContent,
                array: qna,
                name: user_name
            });
        });
    }
    else {
        res.render("landing");
    }
});


app.get("/posts/:postId", function (req, res) {
    const index = req.params.postId;
    Post.findOne({ _id: index }, function (err, posts) {
        if (err)
            console.log(err);
        else
            res.render("expand", { header: posts.title, content: posts.content });
    });
});


app.get("/composeq", function (req, res) {
    res.render("composeq");
});


app.post("/composeq", function (req, res) {
    const question = new QA({
        question: req.body.question,
        user_id: user_ind
    });
    question.save();
    res.redirect("/qa");
});


app.get("/composea", function (req, res) {
    res.render("composea");
});

let ind = "";
app.post("/getindex", function (req, res) {
    ind = req.body.index;
    res.redirect("/composea");
});

app.post("/composea", function (req, res) {
    let index = ind;
    let ans = req.body.answer;
    QA.updateOne(
        { _id: index },
        { $push: { answers: ans } },
        function (err, docs) {
            if (err) {
                res.redirect("/composea");
            }
            else {
                res.redirect("/qa");
            }
        });
});



app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})
app.get("/register", function (req, res) {
    res.render("register");
});


app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err)
            res.render("login_failure");
        else {
            user_email = req.body.username;
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username, name: req.body.name, year: req.body.year, batch: req.body.batch }, req.body.password, function (err, user) {
        if (err) {
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });
});


app.get("/bcs1", function (req, res) {
    res.render("bcs1");
})

app.get("/bcs2", function (req, res) {
    res.render("bcs2");
})

app.get("/bcs3", function (req, res) {
    res.render("bcs3");
})

app.get("/bcs4", function (req, res) {
    res.render("bcs4");
})

app.get("/bcs5", function (req, res) {
    res.render("bcs5");
})

app.get("/bcs6", function (req, res) {
    res.render("bcs6");
})

app.get("/bcs7", function (req, res) {
    res.render("bcs7");
})

app.get("/bcs8", function (req, res) {
    res.render("bcs8");
})

app.get("/img1", function (req, res) {
    res.render("img1");
})

app.get("/img2", function (req, res) {
    res.render("img2");
})

app.get("/img3", function (req, res) {
    res.render("img3");
})

app.get("/img4", function (req, res) {
    res.render("img4");
})

app.get("/img5", function (req, res) {
    res.render("img5");
})

app.get("/img6", function (req, res) {
    res.render("img6");
})

app.get("/img7", function (req, res) {
    res.render("img7");
})

app.get("/img8", function (req, res) {
    res.render("img8");
})

app.get("/img9", function (req, res) {
    res.render("img9");
})

app.get("/img10", function (req, res) {
    res.render("img10");
})

app.get("/imt1", function (req, res) {
    res.render("imt1");
})

app.get("/imt2", function (req, res) {
    res.render("imt2");
})

app.get("/imt3", function (req, res) {
    res.render("imt3");
})

app.get("/imt4", function (req, res) {
    res.render("imt4");
})

app.get("/imt5", function (req, res) {
    res.render("imt5");
})

app.get("/imt6", function (req, res) {
    res.render("imt6");
})

app.get("/imt7", function (req, res) {
    res.render("imt7");
})

app.get("/imt8", function (req, res) {
    res.render("imt8");
})

app.get("/imt9", function (req, res) {
    res.render("imt9");
})

app.get("/imt10", function (req, res) {
    res.render("imt10");
})


app.get("/schedule", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("schedule");
    }
    else {
        res.render("landing");
    }
})

app.get("/coming_soon", function (req, res) {
    res.render("coming_soon");
})

app.get("/event", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("event");
    }
    else {
        res.render("landing");
    }
})

app.get("/renderart", function (req, res) {
    if (req.isAuthenticated()) {
        Post.find({ user_id: user_ind }, function (err, posts) {
            res.render("article_clone", {
                element: posts,
                name: user_name
            });
        });
    }
    else {
        res.render("landing");
    }
})


app.get("/renderqa", function (req, res) {
    if (req.isAuthenticated()) {
        QA.find({ user_id: user_ind }, function (err, qna) {
            res.render("qa_clone", {
                element: qaContent,
                array: qna,
                name: user_name
            });
        });
    }
    else {
        res.render("landing");
    }
});

app.listen(process.env.PORT, function () {
    console.log("Server Started Successfully");
});
