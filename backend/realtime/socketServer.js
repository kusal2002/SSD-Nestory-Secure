const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  resolveFamilyForUser,
  createUserTextMessage,
  getFamilyRoomName,
  serializeMessage,
} = require("../services/chatService");

let ioInstance;

const getIo = () => {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized");
    }
    return ioInstance;
};

const extractBearerToken = (value = "") => {
  if (!value) return "";
  if (!value.startsWith("Bearer ")) return value;
  return value.slice("Bearer ".length).trim();
};

const initSocketServer = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    },
    transports: ["websocket"],
  });

  ioInstance.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token || "";
      const headerToken = socket.handshake.headers?.authorization || "";
      const rawToken = authToken || extractBearerToken(headerToken);
      const token = extractBearerToken(rawToken);

      if (!token) {
        console.log("[Socket Auth] Token missing");
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user || user.isActive === false) {
        console.log("[Socket Auth] User not found or inactive:", decoded.id);
        return next(new Error("Invalid user"));
      }

      socket.user = user;
      
      // Join a private room for the user to receive targeted notifications
      socket.join(`user:${user._id}`);
      
      console.log(
        "[Socket Auth] Authenticated user:",
        user._id,
        user.name,
        user.role,
      );
      return next();
    } catch (error) {
      console.error("[Socket Auth] Authentication failed:", error.message);
      return next(new Error("Socket authentication failed"));
    }
  });

  ioInstance.on("connection", (socket) => {
    console.log("[Socket] New connection:", socket.id, socket.user?.name);
    socket.on("chat:join", async (_, ack) => {
      try {
        const family = await resolveFamilyForUser(socket.user);
        if (!family) {
          console.log(
            "[Socket] chat:join failed - no family found for user:",
            socket.user._id,
          );
          if (typeof ack === "function") {
            ack({ ok: false, message: "No family found" });
          }
          return;
        }

        const room = getFamilyRoomName(family._id);
        await socket.join(room);
        console.log(
          "[Socket] chat:join success - user",
          socket.user._id,
          "joined room",
          room,
        );

        if (typeof ack === "function") {
          ack({
            ok: true,
            room,
            familyId: String(family._id),
          });
        }
      } catch (error) {
        console.error("[Socket] chat:join error:", error.message);
        if (typeof ack === "function") {
          ack({ ok: false, message: "Could not join chat room" });
        }
      }
    });

    socket.on("chat:send", async (payload = {}, ack) => {
      try {
        const family = await resolveFamilyForUser(socket.user);
        if (!family) {
          console.log(
            "[Socket] chat:send failed - no family found for user:",
            socket.user._id,
          );
          if (typeof ack === "function") {
            ack({ ok: false, message: "No family found" });
          }
          return;
        }

        const content =
          typeof payload.content === "string" ? payload.content.trim() : "";
        if (!content) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Message content is required" });
          }
          return;
        }

        const message = await createUserTextMessage({
          family,
          user: socket.user,
          content,
        });

        const serialized = serializeMessage(message.toObject());
        const room = getFamilyRoomName(family._id);
        console.log(
          "[Socket] chat:send - broadcasting to room",
          room,
          "message:",
          serialized.id,
        );
        ioInstance.to(room).emit("chat:new-message", {
          message: serialized,
        });

        if (typeof ack === "function") {
          ack({ ok: true, data: serialized });
        }
      } catch (error) {
        console.error("[Socket] chat:send error:", error.message);
        if (typeof ack === "function") {
          ack({ ok: false, message: "Failed to send message" });
        }
      }
    });

    socket.on("chat:typing", async (payload = {}) => {
      try {
        const family = await resolveFamilyForUser(socket.user);
        if (!family) return;

        const room = getFamilyRoomName(family._id);
        socket.to(room).emit("chat:typing", {
          userId: String(socket.user._id),
          name: socket.user.name || "Reader",
          isTyping: Boolean(payload.isTyping),
        });
      } catch (error) {
        console.error("[Socket] chat:typing error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected:", socket.id, socket.user?.name);
    });
  });

  return ioInstance;
};

const emitFamilyChatEvent = (familyId, eventName, payload) => {
  if (!ioInstance || !familyId) {
    console.warn(
      "[Socket] emitFamilyChatEvent: ioInstance or familyId missing",
      { ioInstance: !!ioInstance, familyId },
    );
    return;
  }
  const room = getFamilyRoomName(familyId);
  console.log("[Socket] emitFamilyChatEvent:", eventName, "to room", room);
  ioInstance.to(room).emit(eventName, payload);
};

module.exports = {
  initSocketServer,
  getIo,
  emitFamilyChatEvent,
};
