# Socket Event Reference (`src/socket.js`)

## Client-Side Events (Outgoing)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join` | `{ username, publicKey }` | Sent immediately after key generation to register with the server. |
| `request_connect` | `{ targetId }` | Sent when clicking 'Connect' in the lobby. |
| `accept_connect` | `{ requesterId }` | Sent when clicking 'Accept' on an incoming request modal. |
| `private_message` | `{ targetId, encryptedPayload }` | Sent when submitting a chat message. |
| `typing` | `{ targetId }` | Sent on every keystroke in the chat input. |
| `leave_chat` | `{ targetId }` | Sent when clicking the 'Back' button in chat. |

## Client-Side Events (Incoming)

| Event Name | Payload | Handler Location | Description |
| :--- | :--- | :--- | :--- |
| `login_success` | `{ username }` | `LoginView.vue` | Confirms successful registration. |
| `login_error` | `{ message }` | `LoginView.vue` | Indicates duplicate username or other error. |
| `update_users` | `[{ id, username, status }]` | `App.vue` | Updates the global list of connected users. |
| `connection_request` | `{ requesterId, requesterName, requesterPublicKey }` | `App.vue` | Triggers the "New Request" modal. |
| `chat_started` | `{ partnerId, partnerName, partnerPublicKey }` | `App.vue` | Triggers navigation to `ChatView`. |
| `private_message` | `{ senderId, encryptedPayload }` | `App.vue` | Triggers decryption and adds message to chat. |
| `partner_typing` | `{ senderId }` | `App.vue` | Shows "typing..." indicator in chat. |
| `partner_left` | `{ senderId }` | `App.vue` | Closes the chat and returns to lobby. |

## Payload Definitions
**`publicKey`**:
```json
{
  "encryption": { ...JWK... },
  "signing": { ...JWK... }
}
```

**`encryptedPayload`**:
```json
{
  "iv": "Base64String",
  "key": "Base64String",
  "data": "Base64String"
}
```
