
# WhatsApp Notification Edge Function

This edge function sends WhatsApp messages through Twilio's API, supporting both regular messages and message templates.

## Environment Variables

- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number with or without the 'whatsapp:' prefix

## Request Format

The function accepts requests in either JSON or form-encoded format:

```json
{
  "to": "+1234567890",
  "message": "Hello, this is a test message",
  "recipientName": "John",
  "isEmergency": true,
  "triggerKeyword": "SOS",
  "useTemplate": false
}
```

For templates:

```json
{
  "to": "+1234567890",
  "useTemplate": true,
  "templateId": "template_sid_here",
  "templateParams": ["Sender Name", "Recipient Name", "Location", "Map URL"],
  "messageId": "optional-message-id",
  "isEmergency": true
}
```

## Response Format

```json
{
  "success": true,
  "messageId": "SM123456789",
  "status": "queued",
  "usingTemplate": true,
  "templateId": "template_sid_here",
  "timestamp": "2023-05-25T15:30:45.000Z"
}
```

## Error Response

```json
{
  "success": false,
  "error": "Error message details",
  "timestamp": "2023-05-25T15:30:45.000Z"
}
```
