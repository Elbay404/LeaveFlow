import { Client, IMessage } from "@stomp/stompjs";

let client: Client | null = null;

export function connectNotificationSocket(
    onNotification: (notification: any) => void
) {
    if (client?.active) {
        return;
    }

    // Create a new STOMP client 
    client = new Client({
        brokerURL: "ws://localhost:8080/ws",
        reconnectDelay: 5000,

        onConnect: () => {
            console.log("Notification WebSocket connected");

            client?.subscribe(
                "/user/notifications",
                (message: IMessage) => {
                    const notification = JSON.parse(message.body);

                    onNotification(notification);
                }
            );
        },

        onDisconnect: () => {
            console.log("Notification WebSocket disconnected");
        },

        onStompError: (frame) => {
            console.error(
                "STOMP error:",
                frame.headers["message"],
                frame.body
            );
        },

        onWebSocketError: (error) => {
            console.error("WebSocket error:", error);
        }
    });

    client.activate();
}

export function disconnectNotificationSocket() {
    if (client) {
        client.deactivate();
        client = null;
    }
}