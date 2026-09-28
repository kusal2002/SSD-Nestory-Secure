const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider !== "wso2";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "wso2"],
      default: "local",
    },
    oidcIssuer: {
      type: String,
      default: null,
    },
    oidcSubject: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "child"],
      default: "user",
    },
    childProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      default: null,
    },
    parentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.index(
  { oidcIssuer: 1, oidcSubject: 1 },
  {
    unique: true,
    partialFilterExpression: {
      oidcIssuer: { $type: "string" },
      oidcSubject: { $type: "string" },
    },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Record when the password changed so tokens issued earlier are rejected.
  // Backdated 1s because JWT "iat" has one-second precision, which keeps the
  // fresh token issued in the same request valid.
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// True if the password was changed after the token was issued
userSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  if (!this.passwordChangedAt) return false;
  return tokenIssuedAt * 1000 < this.passwordChangedAt.getTime();
};

module.exports = mongoose.model("User", userSchema);
