import { setupHostEvents } from "./hostEvents.js";
import { setupPlayerEvents } from "./playerEvents.js";
import { setupAudienceEvents } from "./audienceEvents.js";
import { handlePlayerDisconnect } from "../services/gameService.js";

export function setupSocketEvents(io) {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Setup host and player events
    setupHostEvents(socket, io);
    setupPlayerEvents(socket, io);
    setupAudienceEvents(socket, io);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
      handlePlayerDisconnect(socket.id);
    });
  });
}
