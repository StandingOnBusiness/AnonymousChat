# Frontend Components Documentation

## `App.vue` (Root Component)
-   **Role**: State manager and router. Since there is no `vue-router`, `App.vue` manages a `view` state (`'login' | 'lobby' | 'chat'`) to switch between components.
-   **State**:
    -   `myUsername`: Current user's name.
    -   `connectedUsers`: List of users from server.
    -   `chatPartner`: Object containing partner's ID, Name, and Public Keys.
    -   `messages`: Array of message objects for the current session.
-   **Socket Listeners**: Handles global events like `update_users`, `connection_request`, and `private_message` (decryption happens here).

## `LoginView.vue`
-   **Role**: Authenticaton and Key Generation.
-   **Lifecycle**:
    -   `onMounted`: Calls `CryptoService.generateKeys()`. This is CPU intensive and done immediately so keys are ready when user types name.
-   **Events**:
    -   `login-success`: Emitted when server confirms username is unique and registered.
-   **Features**:
    -   "More Information" popup with architectural details.
    -   Unsubscribes from socket events on unmount.

## `LobbyView.vue`
-   **Role**: User discovery.
-   **Props**: `users` (Array), `myId` (String).
-   **Computed Logic**:
    -   **Filtering**: Removes self from list.
    -   **Search**: Filters by `username.startsWith(query)`.
    -   **Sections**: Splits results into `availableUsers` and `unavailableUsers` based on `status === 'busy'`.
-   **UI**:
    -   Expandable search bar (click icon to reveal input).
    -   Visual indicators (grayscale) for busy users.
    -   Emits `connect` event with target ID.

## `ChatView.vue`
-   **Role**: Messaging interface.
-   **Props**:
    -   `messages`: Array of displayed messages.
    -   `partnerName`: Name of the chatter.
    -   `isTyping`: Boolean to show "Partner is typing..."
-   **Logic**:
    -   **`sendMessage`**: Emits `send` event. Does **not** encrypt directly; encryption is handled by parent `App.vue` before socket emission to keep logic centralized.
    -   **`watch(messages)`**: Auto-scrolls to bottom on new message.
    -   **`formatTime`**: Localizes timestamps.
